import type { ApiResult } from "@/types";
import type {
  Workspace,
  WorkspaceWithMembers,
  WorkspaceCreate,
} from "@/types/workspace";
import { apiFetch } from "@/api/client";

export const getWorkspaces = async (): Promise<ApiResult<Workspace[]>> => {
  try {
    const response = await apiFetch(`/workspaces/`, { method: "GET" });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (err) {
    console.error(err);
    return { success: false, error: { message: "Server error" } };
  }
};

export const getWorkspaceById = async (
  workspaceId: string,
): Promise<ApiResult<WorkspaceWithMembers>> => {
  try {
    const response = await apiFetch(`/workspaces/${workspaceId}`, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (err) {
    console.error(err);
    return { success: false, error: { message: "Server error" } };
  }
};

export const createWorkspace = async (
  workspaceData: WorkspaceCreate,
): Promise<ApiResult<Workspace>> => {
  try {
    const response = await apiFetch(`/workspaces/`, {
      method: "POST",
      body: JSON.stringify(workspaceData),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (err) {
    console.error(err);
    return { success: false, error: { message: "Server error" } };
  }
};
