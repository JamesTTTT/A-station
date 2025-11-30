import { useEffect, useRef } from "react";
import { usePlaybookStore } from "@/stores/playbookStore";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export const useAutoSavePlaybook = (options: UseAutoSaveOptions = {}) => {
  const {
    enabled = true,
    debounceMs = 3000,
    maxRetries = 1,
    retryDelayMs = 500,
  } = options;

  const token = useAuthStore((state) => state.token);
  const draftChanges = usePlaybookStore((state) => state.draftChanges);
  const selectedPlaybookId = usePlaybookStore(
    (state) => state.selectedPlaybookId,
  );
  const { selectedWorkspace } = useWorkspaceStore();

  const savePlaybook = usePlaybookStore((state) => state.savePlaybook);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled || !draftChanges || !selectedPlaybookId || !token) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      attemptsRef.current = 0;
      await attemptSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, draftChanges, selectedPlaybookId, token, debounceMs]);

  const attemptSave = async () => {
    if (!token || !selectedWorkspace?.id) return;

    const result = await savePlaybook(token, selectedWorkspace.id);

    if (!result.success && attemptsRef.current < maxRetries) {
      attemptsRef.current++;
      setTimeout(attemptSave, retryDelayMs);
    } else {
      attemptsRef.current = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (draftChanges && token && selectedWorkspace?.id) {
        savePlaybook(token, selectedWorkspace.id);
      }
    };
  }, []);
};
