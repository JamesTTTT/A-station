import type { PlaybookRead } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { updatePlaybook, getPlaybooks } from "@/api/playbook-api";
import { useAuthStore } from "./authStore";
import { useWorkspaceStore } from "./workspaceStore";

interface PlaybookStore {
  playbooks: PlaybookRead[];
  selectedPlaybookId: string | null;
  draftChanges: string | null;

  loading: boolean;
  error: string | null;

  saveStatus: "idle" | "saving" | "error";
  saveError: string | null;
  lastSaved: Date | null;

  fetchPlaybooks: () => Promise<void>;
  selectPlaybook: (id: string) => void;
  clearSelection: () => void;
  updateDraft: (yamlContent: string) => void;
  savePlaybook: () => Promise<void>;

  getSelectedPlaybook: () => PlaybookRead | null;
  hasUnsavedChanges: () => boolean;

  _saveAttempts: number;
  _saveTimeoutId: ReturnType<typeof setTimeout> | null;
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

      fetchPlaybooks: async () => {
        const authToken = useAuthStore.getState().token;
        const workspaceId = useWorkspaceStore.getState().selectedWorkspace?.id;

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
        console.log(id);
        const state = get();

        if (
          state.selectedPlaybookId &&
          state.selectedPlaybookId !== id &&
          state.draftChanges
        ) {
          if (state._saveTimeoutId) {
            clearTimeout(state._saveTimeoutId);
            set({ _saveTimeoutId: null });
          }
          get().savePlaybook();
        }

        set({
          selectedPlaybookId: id,
          draftChanges: null,
          saveStatus: "idle",
          saveError: null,
        });
      },

      clearSelection: () => {
        const state = get();

        if (state.draftChanges) {
          if (state._saveTimeoutId) {
            clearTimeout(state._saveTimeoutId);
            set({ _saveTimeoutId: null });
          }
          get().savePlaybook();
        }

        set({
          selectedPlaybookId: null,
          draftChanges: null,
          saveStatus: "idle",
          saveError: null,
        });
      },

      updateDraft: (yamlContent: string) => {
        set({ draftChanges: yamlContent, saveStatus: "idle" });

        const currentTimeoutId = get()._saveTimeoutId;
        if (currentTimeoutId) {
          clearTimeout(currentTimeoutId);
        }

        const timeoutId = setTimeout(() => {
          get().savePlaybook();
        }, 3000);

        set({ _saveTimeoutId: timeoutId });
      },

      savePlaybook: async () => {
        const state = get();
        const authToken = useAuthStore.getState().token;

        if (!state.selectedPlaybookId || !state.draftChanges || !authToken) {
          return;
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
              _saveAttempts: 0,
              saveError: null,
            });
          } else {
            throw new Error("Save failed");
          }
        } catch (error) {
          // Retry
          if (state._saveAttempts < 1) {
            set({ _saveAttempts: state._saveAttempts + 1 });
            setTimeout(() => get().savePlaybook(), 500);
          } else {
            set({
              saveStatus: "error",
              saveError: "Failed to save playbook. Your changes are preserved.",
              _saveAttempts: 0,
            });
          }
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
