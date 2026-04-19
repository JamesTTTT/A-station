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
} from "@/api/source-api";
import { useCanvasSessionStore } from "./canvasSessionStore";

interface SourceStore {
  sources: ProjectSource[];
  activeSourceId: string | null;
  fileTree: FileTreeNode | null;

  loading: boolean;
  syncLoading: boolean;
  error: string | null;

  fetchSources: (workspaceId: string) => Promise<void>;
  setActiveSource: (sourceId: string, workspaceId: string) => Promise<void>;
  addSource: (
    workspaceId: string,
    data: ProjectSourceCreate,
  ) => Promise<{ success: boolean; error?: string }>;
  removeSource: (
    workspaceId: string,
    sourceId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  syncSource: (
    workspaceId: string,
    sourceId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  fetchFileTree: (workspaceId: string, sourceId: string) => Promise<void>;
  clearAll: () => void;
  getActiveSource: () => ProjectSource | null;
}

export const useSourceStore = create<SourceStore>()(
  persist(
    (set, get) => ({
      sources: [],
      activeSourceId: null,
      fileTree: null,
      loading: false,
      syncLoading: false,
      error: null,

      fetchSources: async (workspaceId) => {
        if (!workspaceId) {
          set({ error: "Missing workspace ID" });
          return;
        }

        set({ loading: true, error: null });

        try {
          const result = await getSources(workspaceId);

          if (result.success) {
            set({ sources: result.data, loading: false });

            const state = get();
            const persisted = state.activeSourceId;
            const stillExists =
              persisted && result.data.some((s) => s.id === persisted);

            if (stillExists) {
              await get().fetchFileTree(workspaceId, persisted!);
            } else if (result.data.length > 0) {
              get().setActiveSource(result.data[0].id, workspaceId);
            }
          } else {
            set({ error: "Failed to fetch sources", loading: false });
          }
        } catch {
          set({ error: "An unexpected error occurred", loading: false });
        }
      },

      setActiveSource: async (sourceId, workspaceId) => {
        useCanvasSessionStore.getState().clear();
        set({
          activeSourceId: sourceId,
          fileTree: null,
        });
        await get().fetchFileTree(workspaceId, sourceId);
      },

      addSource: async (workspaceId, data) => {
        try {
          const result = await createSource(workspaceId, data);

          if (result.success) {
            const state = get();
            const updated = [...state.sources, result.data];
            set({ sources: updated });

            if (!state.activeSourceId) {
              get().setActiveSource(result.data.id, workspaceId);
            }
            return { success: true };
          } else {
            return {
              success: false,
              error:
                result.error?.message ||
                result.error?.detail ||
                "Failed to add source",
            };
          }
        } catch {
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      removeSource: async (workspaceId, sourceId) => {
        try {
          const result = await deleteSource(workspaceId, sourceId);

          if (result.success) {
            const state = get();
            const updated = state.sources.filter((s) => s.id !== sourceId);
            set({ sources: updated });

            if (state.activeSourceId === sourceId) {
              if (updated.length > 0) {
                get().setActiveSource(updated[0].id, workspaceId);
              } else {
                useCanvasSessionStore.getState().clear();
                set({
                  activeSourceId: null,
                  fileTree: null,
                });
              }
            }
            return { success: true };
          } else {
            return {
              success: false,
              error:
                result.error?.message ||
                result.error?.detail ||
                "Failed to remove source",
            };
          }
        } catch {
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      syncSource: async (workspaceId, sourceId) => {
        set({ syncLoading: true });

        try {
          const result = await syncSource(workspaceId, sourceId);

          if (result.success) {
            set({
              sources: get().sources.map((s) =>
                s.id === sourceId ? result.data : s,
              ),
              syncLoading: false,
            });

            if (get().activeSourceId === sourceId) {
              useCanvasSessionStore.getState().clear();
              await get().fetchFileTree(workspaceId, sourceId);
            }
            return { success: true };
          } else {
            set({ syncLoading: false });
            return {
              success: false,
              error:
                result.error?.message || result.error?.detail || "Sync failed",
            };
          }
        } catch {
          set({ syncLoading: false });
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      fetchFileTree: async (workspaceId, sourceId) => {
        set({ loading: true, error: null });

        try {
          const result = await getFileTree(workspaceId, sourceId);

          if (result.success) {
            set({ fileTree: result.data, loading: false });
          } else {
            set({ error: "Failed to load file tree", loading: false });
          }
        } catch {
          set({ error: "An unexpected error occurred", loading: false });
        }
      },

      clearAll: () => {
        useCanvasSessionStore.getState().clear();
        set({
          sources: [],
          activeSourceId: null,
          fileTree: null,
          loading: false,
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
