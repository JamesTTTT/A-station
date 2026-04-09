import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ProjectSource,
  ProjectSourceCreate,
  FileTreeNode,
} from "@/types";
import {
  getSources,
  createSource,
  deleteSource,
  syncSource,
  getFileTree,
  getFileContent,
} from "@/api/source-api";

interface SourceStore {
  sources: ProjectSource[];
  activeSourceId: string | null;
  fileTree: FileTreeNode | null;
  selectedFilePath: string | null;
  selectedFileContent: string | null;
  loading: boolean;
  fileLoading: boolean;
  syncLoading: boolean;
  error: string | null;

  fetchSources: (workspaceId: string, token: string) => Promise<void>;
  setActiveSource: (
    sourceId: string,
    workspaceId: string,
    token: string,
  ) => Promise<void>;
  addSource: (
    workspaceId: string,
    data: ProjectSourceCreate,
    token: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeSource: (
    workspaceId: string,
    sourceId: string,
    token: string,
  ) => Promise<{ success: boolean; error?: string }>;
  syncSource: (
    workspaceId: string,
    sourceId: string,
    token: string,
  ) => Promise<{ success: boolean; error?: string }>;
  fetchFileTree: (
    workspaceId: string,
    sourceId: string,
    token: string,
  ) => Promise<void>;
  selectFile: (
    workspaceId: string,
    sourceId: string,
    path: string,
    token: string,
  ) => Promise<void>;
  clearSelection: () => void;
  clearAll: () => void;
  getActiveSource: () => ProjectSource | null;
}

export const useSourceStore = create<SourceStore>()(
  persist(
    (set, get) => ({
      sources: [],
      activeSourceId: null,
      fileTree: null,
      selectedFilePath: null,
      selectedFileContent: null,
      loading: false,
      fileLoading: false,
      syncLoading: false,
      error: null,

      fetchSources: async (workspaceId, token) => {
        if (!token || !workspaceId) {
          set({ error: "Missing auth token or workspace ID" });
          return;
        }

        set({ loading: true, error: null });

        try {
          const result = await getSources(workspaceId, token);

          if (result.success) {
            set({ sources: result.data, loading: false });

            const state = get();
            const persisted = state.activeSourceId;
            const stillExists = persisted && result.data.some((s) => s.id === persisted);

            if (stillExists) {
              // Persisted source is valid — just load its file tree
              await get().fetchFileTree(workspaceId, persisted!, token);
            } else if (result.data.length > 0) {
              // No valid persisted source — pick the first one
              get().setActiveSource(result.data[0].id, workspaceId, token);
            }
          } else {
            set({ error: "Failed to fetch sources", loading: false });
          }
        } catch {
          set({ error: "An unexpected error occurred", loading: false });
        }
      },

      setActiveSource: async (sourceId, workspaceId, token) => {
        set({
          activeSourceId: sourceId,
          fileTree: null,
          selectedFilePath: null,
          selectedFileContent: null,
        });
        await get().fetchFileTree(workspaceId, sourceId, token);
      },

      addSource: async (workspaceId, data, token) => {
        try {
          const result = await createSource(workspaceId, data, token);

          if (result.success) {
            const state = get();
            const updated = [...state.sources, result.data];
            set({ sources: updated });

            // If this is the first source, auto-activate it
            if (!state.activeSourceId) {
              get().setActiveSource(result.data.id, workspaceId, token);
            }
            return { success: true };
          } else {
            return {
              success: false,
              error: result.error?.message || result.error?.detail || "Failed to add source",
            };
          }
        } catch {
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      removeSource: async (workspaceId, sourceId, token) => {
        try {
          const result = await deleteSource(workspaceId, sourceId, token);

          if (result.success) {
            const state = get();
            const updated = state.sources.filter((s) => s.id !== sourceId);
            set({ sources: updated });

            if (state.activeSourceId === sourceId) {
              if (updated.length > 0) {
                get().setActiveSource(updated[0].id, workspaceId, token);
              } else {
                set({
                  activeSourceId: null,
                  fileTree: null,
                  selectedFilePath: null,
                  selectedFileContent: null,
                });
              }
            }
            return { success: true };
          } else {
            return {
              success: false,
              error: result.error?.message || result.error?.detail || "Failed to remove source",
            };
          }
        } catch {
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      syncSource: async (workspaceId, sourceId, token) => {
        set({ syncLoading: true });

        try {
          const result = await syncSource(workspaceId, sourceId, token);

          if (result.success) {
            set({
              sources: get().sources.map((s) =>
                s.id === sourceId ? result.data : s,
              ),
              syncLoading: false,
            });

            // Refresh file tree if this is the active source
            if (get().activeSourceId === sourceId) {
              await get().fetchFileTree(workspaceId, sourceId, token);
            }
            return { success: true };
          } else {
            set({ syncLoading: false });
            return {
              success: false,
              error: result.error?.message || result.error?.detail || "Sync failed",
            };
          }
        } catch {
          set({ syncLoading: false });
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      fetchFileTree: async (workspaceId, sourceId, token) => {
        set({ loading: true, error: null });

        try {
          const result = await getFileTree(workspaceId, sourceId, token);

          if (result.success) {
            set({ fileTree: result.data, loading: false });
          } else {
            set({ error: "Failed to load file tree", loading: false });
          }
        } catch {
          set({ error: "An unexpected error occurred", loading: false });
        }
      },

      selectFile: async (workspaceId, sourceId, path, token) => {
        set({ fileLoading: true, selectedFilePath: path, selectedFileContent: null });

        try {
          const result = await getFileContent(
            workspaceId,
            sourceId,
            path,
            token,
          );

          if (result.success) {
            set({
              selectedFileContent: result.data.content,
              fileLoading: false,
            });
          } else {
            set({
              selectedFileContent: null,
              fileLoading: false,
              error: "Failed to load file",
            });
          }
        } catch {
          set({
            selectedFileContent: null,
            fileLoading: false,
            error: "An unexpected error occurred",
          });
        }
      },

      clearSelection: () => {
        set({ selectedFilePath: null, selectedFileContent: null });
      },

      clearAll: () => {
        set({
          sources: [],
          activeSourceId: null,
          fileTree: null,
          selectedFilePath: null,
          selectedFileContent: null,
          loading: false,
          fileLoading: false,
          syncLoading: false,
          error: null,
        });
      },

      getActiveSource: () => {
        const state = get();
        return (
          state.sources.find((s) => s.id === state.activeSourceId) ?? null
        );
      },
    }),
    {
      name: "source-storage",
      partialize: (state) => ({
        activeSourceId: state.activeSourceId,
      }),
    },
  ),
);
