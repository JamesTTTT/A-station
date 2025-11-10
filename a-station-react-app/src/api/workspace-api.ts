import type { ApiResult } from "@/types";
import type { Workspace, WorkspaceWithMembers, WorkspaceCreate } from "@/types/workspace";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const getWorkspaces = async (
  accessToken: string
): Promise<ApiResult<Workspace[]>> => {
  try {
    const response = await fetch(`${baseUrl}/workspaces/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
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

export const getWorkspaceById = async (
  workspaceId: string,
  accessToken: string
): Promise<ApiResult<WorkspaceWithMembers>> => {
  try {
    const response = await fetch(`${baseUrl}/workspaces/${workspaceId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
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
  accessToken: string
): Promise<ApiResult<Workspace>> => {
  try {
    const response = await fetch(`${baseUrl}/workspaces/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
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