import { useState, useEffect, useCallback, useRef } from "react";
import { startJob } from "@/api/job-api";
import { JobWebSocketManager } from "@/websocket/job-websocket.ts";
import { useAuthStore } from "@/stores/authStore";
import type { JobCreate, JobResponse, JobStatus, JobStreamEvent } from "@/types";

interface UseJobExecutionOptions {
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

interface JobExecutionState {
  isLoading: boolean;
  isRunning: boolean;
  job: JobResponse | null;
  output: string[];
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
    output: [],
    status: null,
    error: null,
  });

  const handleWebSocketEvent = useCallback(
    (event: JobStreamEvent) => {
      switch (event.type) {
        case "output":
          setState((prev) => ({
            ...prev,
            output: [...prev.output, event.data as string],
          }));
          break;

        case "status":
          setState((prev) => ({
            ...prev,
            status: event.data as JobStatus,
            isRunning: event.data === "running",
          }));
          break;

        case "error":
          const errorMsg = event.data as string;
          setState((prev) => ({
            ...prev,
            error: errorMsg,
            isRunning: false,
          }));
          onError?.(errorMsg);
          break;

        case "complete":
          setState((prev) => ({
            ...prev,
            isRunning: false,
          }));
          onComplete?.(event.data);
          break;

        default:
          console.warn("Unknown event type:", event.type);
      }
    },
    [onComplete, onError]
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
        output: [],
        status: null,
        error: null,
      });

      try {
        // Start the job via HTTP
        const result = await startJob(jobData, token);

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
    [token, autoConnect, handleWebSocketEvent, onError]
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
        output: [],
      }));
    },
    [token, handleWebSocketEvent]
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
