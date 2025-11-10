import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace } from "@/types/workspace";

interface WorkspaceStore {
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (workspace: Workspace) => void;
  clearSelectedWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      selectedWorkspace: null,
      setSelectedWorkspace: (workspace) => set({ selectedWorkspace: workspace }),
      clearSelectedWorkspace: () => set({ selectedWorkspace: null }),
    }),
    {
      name: "workspace-storage",
    }
  )
);