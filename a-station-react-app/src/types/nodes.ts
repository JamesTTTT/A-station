// === Execution & View Types ===

export type ExecutionState =
  | "idle"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export type TaskGroupType =
  | "pre_tasks"
  | "roles"
  | "tasks"
  | "post_tasks"
  | "handlers";

export type ViewMode = "flat" | "grouped";

// === Parser Output Types ===

export interface PlaybookTask {
  id: string;
  name: string;
  module: string;
  order: number;
  playName?: string;
  playbookId: string;
  playbookFile: string;
  parentHeadNodeId: string;
  taskGroup: TaskGroupType;
  roleName?: string;
  blockType?: "block" | "rescue" | "always";
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

export interface PlaybookRole {
  id: string;
  name: string;
  parentHeadNodeId: string;
  playbookId: string;
  playbookFile: string;
  order: number;
  vars?: Record<string, any>;
  tags?: string[];
  when?: string;
}

export interface TaskGroup {
  id: string;
  type: TaskGroupType;
  parentHeadNodeId: string;
  label: string;
}

export interface ParseResult {
  success: boolean;
  headNodes: HeadNode[];
  tasks: PlaybookTask[];
  taskGroups: TaskGroup[];
  roles: PlaybookRole[];
  error?: string;
  partialErrors?: Array<{ playbookId: string; filename: string; error: string }>;
}

// === React Flow Node Data Types ===

export interface TaskNodeData {
  taskId: string;
  name: string;
  module: string;
  state: ExecutionState;
  playName?: string;
  playbookFile: string;
  playbookId: string;
  parentHeadNodeId: string;
  taskGroup: TaskGroupType;
  roleName?: string;
  blockType?: "block" | "rescue" | "always";
  type: "simpleTask";
}

export interface HeadNodeData {
  playName: string;
  playbookFile: string;
  playbookId: string;
  order: number;
  state: ExecutionState;
  hosts?: string | string[];
  become?: boolean;
  becomeUser?: string;
  vars?: Record<string, any>;
  tags?: string[];
  gather_facts?: boolean;
  isExpanded: boolean;
  taskGroupSummary?: string;
  type: "headNode";
}

export interface TaskGroupNodeData {
  groupId: string;
  groupType: TaskGroupType;
  label: string;
  parentHeadNodeId: string;
  state: ExecutionState;
  type: "taskGroup";
}

export interface RoleNodeData {
  roleId: string;
  name: string;
  state: ExecutionState;
  parentHeadNodeId: string;
  playbookFile: string;
  playbookId: string;
  vars?: Record<string, any>;
  tags?: string[];
  when?: string;
  type: "roleNode";
}

export type AnyNodeData =
  | TaskNodeData
  | HeadNodeData
  | TaskGroupNodeData
  | RoleNodeData;
