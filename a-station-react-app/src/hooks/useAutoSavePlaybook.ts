import { useEffect, useRef, useCallback } from "react";
import { usePlaybookStore } from "@/stores/playbookStore";
import { useAuthStore } from "@/stores/authStore";

interface UseAutoSaveOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export const useAutoSavePlaybook = (options: UseAutoSaveOptions = {}) => {
  const { debounceMs = 3000, maxRetries = 1, retryDelayMs = 500 } = options;

  const token = useAuthStore((state) => state.token);
  const draftChanges = usePlaybookStore((state) => state.draftChanges);
  const selectedPlaybookId = usePlaybookStore(
    (state) => state.selectedPlaybookId,
  );
  const savePlaybook = usePlaybookStore((state) => state.savePlaybook);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);

  const attemptSave = useCallback(async () => {
    if (!token) return;

    const result = await savePlaybook(token);

    if (!result.success && attemptsRef.current < maxRetries) {
      attemptsRef.current++;
      setTimeout(() => attemptSave(), retryDelayMs);
    } else {
      attemptsRef.current = 0;
    }
  }, [token, savePlaybook, maxRetries, retryDelayMs]);

  useEffect(() => {
    if (!draftChanges || !selectedPlaybookId || !token) {
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
  }, [draftChanges, selectedPlaybookId, token, debounceMs, attemptSave]);

  useEffect(() => {
    return () => {
      if (draftChanges && token) {
        savePlaybook(token);
      }
    };
  }, [draftChanges, token, savePlaybook]);
};
