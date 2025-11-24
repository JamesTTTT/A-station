import type { PlaybookRead } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { updatePlaybook, getPlaybooks, deletePlaybook } from "@/api/playbook-api";

interface PlaybookStore {
  playbooks: PlaybookRead[];
  selectedPlaybookId: string | null;
  draftChanges: string | null;
  loading: boolean;
  error: string | null;
  saveStatus: "idle" | "saving" | "error";
  saveError: string | null;
  lastSaved: Date | null;

  fetchPlaybooks: (workspaceId: string, authToken: string) => Promise<void>; // CHANGED
  selectPlaybook: (id: string) => void;
  clearSelection: () => void;
  updateDraft: (yamlContent: string) => void;
  savePlaybook: (
    authToken: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deletePlaybook: (
    workspaceId: string,
    playbookId: string,
    authToken: string,
  ) => Promise<{ success: boolean; error?: string }>;

  getSelectedPlaybook: () => PlaybookRead | null;
  hasUnsavedChanges: () => boolean;
}

export const usePlaybookStore = create<PlaybookStore>()(
  persist(
    (set, get) => ({
      playbooks: [],
      selectedPlaybookId: null,
      draftChanges: null,
      loading: false,
      error: null,
      saveStatus: "idle",
      saveError: null,
      lastSaved: null,
      _saveAttempts: 0,
      _saveTimeoutId: null,

      fetchPlaybooks: async (workspaceId: string, authToken: string) => {
        if (!authToken || !workspaceId) {
          set({ error: "Missing auth token or workspace ID" });
          return;
        }

        set({ loading: true, error: null });

        try {
          const result = await getPlaybooks(workspaceId, authToken);

          if (result.success) {
            set({
              playbooks: result.data,
              loading: false,
            });
          } else {
            set({
              error: "Failed to fetch playbooks",
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

      selectPlaybook: (id: string) => {
        set({
          selectedPlaybookId: id,
          draftChanges: null,
          saveStatus: "idle",
          saveError: null,
        });
      },

      clearSelection: () => {
        set({
          selectedPlaybookId: null,
          draftChanges: null,
          saveStatus: "idle",
          saveError: null,
        });
      },

      updateDraft: (yamlContent: string) => {
        set({ draftChanges: yamlContent, saveStatus: "idle" });
      },

      savePlaybook: async (authToken: string) => {
        const state = get();

        if (!state.selectedPlaybookId || !state.draftChanges || !authToken) {
          return { success: false, error: "Missing required data" };
        }

        set({ saveStatus: "saving" });

        try {
          const result = await updatePlaybook(
            state.selectedPlaybookId,
            { yaml_content: state.draftChanges },
            authToken,
          );

          if (result.success) {
            set({
              playbooks: state.playbooks.map((pb) =>
                pb.id === state.selectedPlaybookId ? result.data : pb,
              ),
              draftChanges: null,
              saveStatus: "idle",
              lastSaved: new Date(),
              saveError: null,
            });
            return { success: true };
          } else {
            throw new Error("Save failed");
          }
        } catch (error) {
          set({
            saveStatus: "error",
            saveError: "Failed to save playbook. Your changes are preserved.",
          });
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      deletePlaybook: async (
        workspaceId: string,
        playbookId: string,
        authToken: string,
      ) => {
        try {
          const result = await deletePlaybook(workspaceId, playbookId, authToken);

          if (result.success) {
            const state = get();
            set({
              playbooks: state.playbooks.filter((pb) => pb.id !== playbookId),
              selectedPlaybookId:
                state.selectedPlaybookId === playbookId
                  ? null
                  : state.selectedPlaybookId,
              draftChanges:
                state.selectedPlaybookId === playbookId
                  ? null
                  : state.draftChanges,
            });
            return { success: true };
          } else {
            return {
              success: false,
              error: result.error?.message || "Failed to delete playbook",
            };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      getSelectedPlaybook: (): PlaybookRead | null => {
        const state = get();
        if (!state.selectedPlaybookId) return null;

        const playbook = state.playbooks.find(
          (pb) => pb.id === state.selectedPlaybookId,
        );

        if (!playbook) return null;

        if (state.draftChanges) {
          return {
            ...playbook,
            yaml_content: state.draftChanges,
          };
        }

        return playbook;
      },

      hasUnsavedChanges: (): boolean => {
        return get().draftChanges !== null;
      },
    }),
    {
      name: "playbook-storage",
      partialize: (state) => ({
        selectedPlaybookId: state.selectedPlaybookId,
        draftChanges: state.draftChanges,
        lastSaved: state.lastSaved,
      }),
    },
  ),
);
