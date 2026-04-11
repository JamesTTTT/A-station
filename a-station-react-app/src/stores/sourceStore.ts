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

  // Multi-file selection: files loaded onto the canvas (YAML only)
  selectedFilePaths: string[];
  // Cache of fetched file contents keyed by path
  fileContents: Record<string, string>;
  // The single file shown in the YAML preview pane (may be non-YAML)
  focusedFilePath: string | null;
  // Anchor for shift-range selection (last non-shift click)
  selectionAnchor: string | null;

  loading: boolean;
  fileLoading: boolean;
  syncLoading: boolean;
  error: string | null;

  fetchSources: (workspaceId: string) => Promise<void>;
  setActiveSource: (
    sourceId: string,
    workspaceId: string,
  ) => Promise<void>;
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
  fetchFileTree: (
    workspaceId: string,
    sourceId: string,
  ) => Promise<void>;

  setSelection: (
    paths: string[],
    focused: string | null,
    anchor: string | null,
  ) => void;
  setFocusedFile: (path: string | null) => void;
  loadFileContents: (
    workspaceId: string,
    sourceId: string,
    paths: string[],
  ) => Promise<void>;
  clearSelection: () => void;
  clearAll: () => void;
  getActiveSource: () => ProjectSource | null;
}

const emptySelection = {
  selectedFilePaths: [] as string[],
  fileContents: {} as Record<string, string>,
  focusedFilePath: null as string | null,
  selectionAnchor: null as string | null,
};

export const useSourceStore = create<SourceStore>()(
  persist(
    (set, get) => ({
      sources: [],
      activeSourceId: null,
      fileTree: null,
      ...emptySelection,
      loading: false,
      fileLoading: false,
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
            const stillExists = persisted && result.data.some((s) => s.id === persisted);

            if (stillExists) {
              // Persisted source is valid — just load its file tree
              await get().fetchFileTree(workspaceId, persisted!);
            } else if (result.data.length > 0) {
              // No valid persisted source — pick the first one
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
        set({
          activeSourceId: sourceId,
          fileTree: null,
          ...emptySelection,
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

            // If this is the first source, auto-activate it
            if (!state.activeSourceId) {
              get().setActiveSource(result.data.id, workspaceId);
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
                set({
                  activeSourceId: null,
                  fileTree: null,
                  ...emptySelection,
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

            // Refresh file tree if this is the active source
            if (get().activeSourceId === sourceId) {
              await get().fetchFileTree(workspaceId, sourceId);
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

      setSelection: (paths, focused, anchor) => {
        set({
          selectedFilePaths: paths,
          focusedFilePath: focused,
          selectionAnchor: anchor,
        });
      },

      setFocusedFile: (path) => {
        set({ focusedFilePath: path });
      },

      loadFileContents: async (workspaceId, sourceId, paths) => {
        const state = get();
        const missing = paths.filter(
          (p) => state.fileContents[p] === undefined,
        );
        if (missing.length === 0) return;

        set({ fileLoading: true });

        try {
          const results = await Promise.all(
            missing.map((p) =>
              getFileContent(workspaceId, sourceId, p).then((r) => ({
                p,
                r,
              })),
            ),
          );

          const next = { ...get().fileContents };
          for (const { p, r } of results) {
            if (r.success) {
              next[p] = r.data.content;
            }
          }
          set({ fileContents: next, fileLoading: false });
        } catch {
          set({
            fileLoading: false,
            error: "Failed to load file contents",
          });
        }
      },

      clearSelection: () => {
        set({ ...emptySelection });
      },

      clearAll: () => {
        set({
          sources: [],
          activeSourceId: null,
          fileTree: null,
          ...emptySelection,
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
