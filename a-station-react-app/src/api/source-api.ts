import type {
  ApiResult,
  ProjectSource,
  ProjectSourceCreate,
  FileTreeNode,
  FileContent,
  InventoryData,
} from "@/types";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const getSources = async (
  workspaceId: string,
  accessToken: string,
): Promise<ApiResult<ProjectSource[]>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/sources`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      },
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

export const createSource = async (
  workspaceId: string,
  sourceData: ProjectSourceCreate,
  accessToken: string,
): Promise<ApiResult<ProjectSource>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/sources`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(sourceData),
      },
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

export const deleteSource = async (
  workspaceId: string,
  sourceId: string,
  accessToken: string,
): Promise<ApiResult<void>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/sources/${sourceId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      },
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
  accessToken: string,
): Promise<ApiResult<ProjectSource>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/sources/${sourceId}/sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      },
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
  accessToken: string,
): Promise<ApiResult<FileTreeNode>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/sources/${sourceId}/tree`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      },
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
  accessToken: string,
): Promise<ApiResult<FileContent>> => {
  try {
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/sources/${sourceId}/file?path=${encodeURIComponent(filePath)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      },
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
  accessToken: string,
  inventoryPath?: string,
): Promise<ApiResult<InventoryData>> => {
  try {
    const params = inventoryPath
      ? `?path=${encodeURIComponent(inventoryPath)}`
      : "";
    const response = await fetch(
      `${baseUrl}/workspaces/${workspaceId}/sources/${sourceId}/inventory${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      },
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
