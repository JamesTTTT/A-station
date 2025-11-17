export interface JobCreate {
  playbook_id: string;
  ansible_version?: string;
  inventory?: string;
  extra_vars?: Record<string, unknown>;
}

export interface JobResponse {
  id: string;
  workflow_id: string;
  status: JobStatus;
  task_id?: string;
  queue?: string;
  celery_status?: string;
  result?: unknown;
  started_at?: string;
  finished_at?: string;
}

export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILURE = "failure",
  CANCELLED = "cancelled",
}

export interface JobStreamEvent {
  type: "output" | "status" | "error" | "complete";
  data: string | JobStatus;
  timestamp: string;
}
