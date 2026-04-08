export interface ProjectSource {
  id: string;
  workspace_id: string;
  name: string;
  source_type: "git" | "local";
  local_path: string;
  git_url: string | null;
  git_branch: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSourceCreate {
  name: string;
  source_type: "git" | "local";
  git_url?: string;
  git_branch?: string;
  local_path?: string;
}

export interface FileTreeNode {
  name: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

export interface FileContent {
  path: string;
  content: string;
}

export interface InventoryHost {
  name: string;
  vars: Record<string, unknown>;
}

export interface InventoryGroup {
  name: string;
  hosts: InventoryHost[];
  vars: Record<string, unknown>;
  children: string[];
}

export interface InventoryData {
  groups: InventoryGroup[];
}
