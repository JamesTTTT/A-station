export interface JobCreate {
  workspace_id: string;
  source_id: string;
  playbook_path: string;
  inventory_path: string;
  ansible_version: string;
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

export type JobStatus =
  | "pending"
  | "running"
  | "success"
  | "failure"
  | "cancelled";

// Raw Ansible event from the worker
export interface JobStreamEvent {
  job_id: string;
  timestamp: string;
  event: string;
  event_data: Record<string, unknown>;
  uuid: string;
  counter: number;
  stdout: string;
  task_name?: string;
  play_name?: string;
  error?: string;
  result?: unknown;
}
