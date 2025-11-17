export interface PlaybookTask {
  id: string;
  name: string;
  module: string;
  order: number;
  playName?: string;
  playbookId: string;
  playbookFile: string;
  parentHeadNodeId: string;
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

  playbookFile: string;
  playbookId: string;
  parentHeadNodeId: string;

  type: "simpleTask";
}

export interface ParseResult {
  success: boolean;
  headNodes: HeadNode[];
  tasks: PlaybookTask[];
  error?: string;
}

export interface HeadNodeData {
  playName: string;
  playbookFile: string;
  playbookId: string;
  order: number;

  hosts?: string | string[];
  become?: boolean;
  becomeUser?: string;
  vars?: Record<string, any>;
  tags?: string[];
  gather_facts?: boolean;

  isExpanded: boolean;

  type: "headNode";
}

export interface HeadNode {
  id: string;
  playbookId: string;
  playbookFile: string;
  playName: string;
  order: number;
  hosts?: string | string[];
  become?: boolean;
  becomeUser?: string;
  vars?: Record<string, any>;
  tags?: string[];
  gather_facts?: boolean;
}