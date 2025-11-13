import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace } from "@/types/workspace";
import { getWorkspaces } from "@/api/workspace-api";
import { useAuthStore } from "./authStore";

interface WorkspaceStore {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;

  loading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  setSelectedWorkspace: (workspace: Workspace) => void;
  clearSelectedWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      workspaces: [],
      selectedWorkspace: null,
      loading: false,
      error: null,

      fetchWorkspaces: async () => {
        const authToken = useAuthStore.getState().token;

        if (!authToken) {
          set({ error: "No auth token available" });
          return;
        }

        set({ loading: true, error: null });

        try {
          const result = await getWorkspaces(authToken);

          if (result.success) {
            set({
              workspaces: result.data,
              loading: false,
            });
          } else {
            set({
              error: "Failed to fetch workspaces",
              loading: false,
            });
          }
        } catch (error) {
          set({
            error: "An unexpected error occurred",
            loading: false,
          });
        }
      },

      setSelectedWorkspace: (workspace: Workspace) => {
        set({ selectedWorkspace: workspace });
      },

      clearSelectedWorkspace: () => {
        set({ selectedWorkspace: null });
      },
    }),
    {
      name: "workspace-storage",
      partialize: (state) => ({
        selectedWorkspace: state.selectedWorkspace,
      }),
    },
  ),
);
