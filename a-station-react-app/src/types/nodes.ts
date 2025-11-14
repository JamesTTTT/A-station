export interface PlaybookTask {
  id: string;
  name: string;
  module: string;
  order: number;
  playName?: string;
}

export type ExecutionState =
  | "idle"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export interface TaskNodeData {
  taskId: string;
  name: string;
  module: string;
  state: ExecutionState;
  playName?: string;
}

export interface ParseResult {
  success: boolean;
  tasks: PlaybookTask[];
  error?: string;
}
