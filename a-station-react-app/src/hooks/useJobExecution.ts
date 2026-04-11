import { useState, useEffect, useCallback, useRef } from "react";
import { startJob } from "@/api/job-api";
import { JobWebSocketManager } from "@/websocket/job-websocket.ts";
import { useAuthStore } from "@/stores/authStore";
import { useCanvasStore } from "@/stores/canvasStore.ts";
import { useJobStore } from "@/stores/jobStore.ts";
import type {
  JobCreate,
  JobResponse,
  JobStatus,
  JobStreamEvent,
} from "@/types";

interface UseJobExecutionOptions {
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

interface JobExecutionState {
  isLoading: boolean;
  isRunning: boolean;
  job: JobResponse | null;
  status: JobStatus | null;
  error: string | null;
}

export const useJobExecution = (options: UseJobExecutionOptions = {}) => {
  const { onComplete, onError, autoConnect = true } = options;
  const token = useAuthStore((state) => state.token);
  const wsManagerRef = useRef<JobWebSocketManager | null>(null);

  const [state, setState] = useState<JobExecutionState>({
    isLoading: false,
    isRunning: false,
    job: null,
    status: null,
    error: null,
  });

  const play = useRef<string>("");

  const handleWebSocketEvent = useCallback(
    (event: JobStreamEvent) => {
      // Set logs
      if (event.stdout && event.stdout.trim()) {
        useJobStore.getState().addLog(event.stdout);
      }
      console.log(event.event);
      console.log("Event:", event);
      switch (event.event) {
        case "playbook_on_start":
          setState((prev) => ({
            ...prev,
            status: "running",
            isRunning: true,
          }));
          useJobStore.getState().setIsRunning(true);
          break;

        case "playbook_on_stats":
          setState((prev) => ({
            ...prev,
            status: "success",
            isRunning: false,
          }));
          useJobStore.getState().setIsRunning(false);
          onComplete?.(event.event_data);
          break;

        case "runner_on_failed":
          // Task failure
          if (event.task_name) {
            useCanvasStore
              .getState()
              .updateTaskStateByName(event.task_name, "failed");
          }
          if (event.event_data.play) {
            useCanvasStore
              .getState()
              .updateHeadNodeStateByPlayName(play.current, "failed");
          }
          setState((prev) => ({
            ...prev,
            status: "failure",
            isRunning: false,
          }));
          const taskError = `Task failed: ${event.task_name || "unknown"}`;
          useJobStore.getState().setIsRunning(false);
          useJobStore.getState().setError(taskError);
          onError?.(taskError);
          break;

        case "job_error":
          const errorMsg = event.error || "Job error occurred";
          setState((prev) => ({
            ...prev,
            error: errorMsg,
            status: "failure",
            isRunning: false,
          }));
          useJobStore.getState().setIsRunning(false);
          useJobStore.getState().setError(errorMsg);
          onError?.(errorMsg);
          break;

        case "job_complete":
          setState((prev) => ({
            ...prev,
            status: "success",
            isRunning: false,
          }));

          useJobStore.getState().setIsRunning(false);
          onComplete?.(event.result);

          useCanvasStore
            .getState()
            .updateHeadNodeStateByPlayName(play.current, "success");
          break;

        case "playbook_on_play_start":
          play.current = event.event_data.play;
          if (event.event_data.play) {
            useCanvasStore
              .getState()
              .updateHeadNodeStateByPlayName(play.current, "running");
          }
          break;

        case "runner_on_start":
          if (event.task_name) {
            useCanvasStore
              .getState()
              .updateTaskStateByName(event.task_name, "running");
          }
          break;

        case "runner_on_ok":
          if (event.task_name) {
            useCanvasStore
              .getState()
              .updateTaskStateByName(event.task_name, "success");

            if (event.event_data.play) {
              useCanvasStore
                .getState()
                .updateHeadNodeStateByPlayName(play.current, "success");
            }
          }
          break;
        case "runner_on_skipped":
          if (event.task_name) {
            useCanvasStore
              .getState()
              .updateTaskStateByName(event.task_name, "skipped");
          }
          break;

        case "runner_on_unreachable":
          if (event.task_name) {
            useCanvasStore
              .getState()
              .updateTaskStateByName(event.task_name, "failed");
          }
          if (event.event_data.play) {
            useCanvasStore
              .getState()
              .updateHeadNodeStateByPlayName(play.current, "failed");
          }
          break;

        default:
          console.debug("Unhandled Ansible event:", event.event);
      }
    },
    [onComplete, onError],
  );

  const executeJob = useCallback(
    async (jobData: JobCreate) => {
      if (!token) {
        setState((prev) => ({
          ...prev,
          error: "No authentication token found",
        }));
        return;
      }

      setState({
        isLoading: true,
        isRunning: false,
        job: null,
        status: null,
        error: null,
      });

      useJobStore.getState().setIsRunning(false);
      useJobStore.getState().setError(null);

      try {
        // Start the job via HTTP
        const result = await startJob(jobData);

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.error?.message || "Failed to start job",
          }));
          onError?.(result.error?.message || "Failed to start job");
          return;
        }

        const job = result.data;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRunning: true,
          job,
          status: job.status,
        }));

        useJobStore.getState().setIsRunning(true);

        // Connect to WebSocket for streaming
        if (autoConnect) {
          wsManagerRef.current = new JobWebSocketManager(job.id, token);
          wsManagerRef.current.subscribe(handleWebSocketEvent);
          wsManagerRef.current.connect();
        }

        return job;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMsg,
        }));
        onError?.(errorMsg);
      }
    },
    [token, autoConnect, handleWebSocketEvent, onError],
  );

  const connectToJob = useCallback(
    (jobId: string) => {
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      wsManagerRef.current?.disconnect();
      wsManagerRef.current = new JobWebSocketManager(jobId, token);
      wsManagerRef.current.subscribe(handleWebSocketEvent);
      wsManagerRef.current.connect();

      setState((prev) => ({
        ...prev,
        isRunning: true,
      }));
    },
    [token, handleWebSocketEvent],
  );

  const disconnect = useCallback(() => {
    wsManagerRef.current?.disconnect();
    wsManagerRef.current = null;
    setState((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  useEffect(() => {
    return () => {
      wsManagerRef.current?.disconnect();
    };
  }, []);

  return {
    ...state,
    executeJob,
    connectToJob,
    disconnect,
  };
};
