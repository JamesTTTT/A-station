import type {
  ApiResult,
  ProjectSource,
  ProjectSourceCreate,
  FileTreeNode,
  FileContent,
  InventoryData,
} from "@/types";
import { apiFetch } from "@/api/client";

export const getSources = async (
  workspaceId: string,
): Promise<ApiResult<ProjectSource[]>> => {
  try {
    const response = await apiFetch(`/workspaces/${workspaceId}/sources`, {
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

export const createSource = async (
  workspaceId: string,
  sourceData: ProjectSourceCreate,
): Promise<ApiResult<ProjectSource>> => {
  try {
    const response = await apiFetch(`/workspaces/${workspaceId}/sources`, {
      method: "POST",
      body: JSON.stringify(sourceData),
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

export const deleteSource = async (
  workspaceId: string,
  sourceId: string,
): Promise<ApiResult<void>> => {
  try {
    const response = await apiFetch(
      `/workspaces/${workspaceId}/sources/${sourceId}`,
      { method: "DELETE" },
    );

    if (response.ok) {
      return { success: true, data: undefined };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (err) {
    console.error(err);
    return { success: false, error: { message: "Server error" } };
  }
};

export const syncSource = async (
  workspaceId: string,
  sourceId: string,
): Promise<ApiResult<ProjectSource>> => {
  try {
    const response = await apiFetch(
      `/workspaces/${workspaceId}/sources/${sourceId}/sync`,
      { method: "POST" },
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

export const getFileTree = async (
  workspaceId: string,
  sourceId: string,
): Promise<ApiResult<FileTreeNode>> => {
  try {
    const response = await apiFetch(
      `/workspaces/${workspaceId}/sources/${sourceId}/tree`,
      { method: "GET" },
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

export const getFileContent = async (
  workspaceId: string,
  sourceId: string,
  filePath: string,
): Promise<ApiResult<FileContent>> => {
  try {
    const response = await apiFetch(
      `/workspaces/${workspaceId}/sources/${sourceId}/file?path=${encodeURIComponent(filePath)}`,
      { method: "GET" },
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

export const getInventory = async (
  workspaceId: string,
  sourceId: string,
  inventoryPath?: string,
): Promise<ApiResult<InventoryData>> => {
  try {
    const params = inventoryPath
      ? `?path=${encodeURIComponent(inventoryPath)}`
      : "";
    const response = await apiFetch(
      `/workspaces/${workspaceId}/sources/${sourceId}/inventory${params}`,
      { method: "GET" },
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
