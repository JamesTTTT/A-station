import type { ApiResult, PlaybookCreate, PlaybookRead, PlaybookUpdate } from "@/types";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const createPlaybook = async (
  workspaceId: string,
  playbookData: PlaybookCreate,
  accessToken: string
): Promise<ApiResult<PlaybookRead>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/playbooks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(playbookData),
      }
    );

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

export const getPlaybooks = async (
  workspaceId: string,
  accessToken: string
): Promise<ApiResult<PlaybookRead[]>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/playbooks`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }
    );

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

export const updatePlaybook = async (
  playbookId: string,
  playbookData: PlaybookUpdate,
  accessToken: string
): Promise<ApiResult<PlaybookRead>> => {
  try {
    const response = await fetch(`${baseUrl}/playbooks/${playbookId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify(playbookData),
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

export const deletePlaybook = async (
  workspaceId: string,
  playbookId: string,
  accessToken: string
): Promise<ApiResult<{ message: string }>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/playbooks/${playbookId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }
    );

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