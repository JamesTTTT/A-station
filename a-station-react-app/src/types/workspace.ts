export interface WorkspaceMember {
  user_id: string;
  username: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
}

export interface WorkspaceCreate {
  name: string;
}

export interface WorkspaceUpdate {
  name: string;
}