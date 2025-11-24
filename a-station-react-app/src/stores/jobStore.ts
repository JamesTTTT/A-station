import { create } from "zustand";
import type { JobResponse } from "@/types";

interface JobStore {
  currentJob: JobResponse | null;
  setCurrentJob: (job: JobResponse | null) => void;
  clearCurrentJob: () => void;
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  currentJob: null,
  setCurrentJob: (job) => set({ currentJob: job, logs: [], error: null }),
  clearCurrentJob: () => set({ currentJob: null, logs: [], isRunning: false, error: null }),

  // logs storage
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),

  // running state
  isRunning: false,
  setIsRunning: (isRunning) => set({ isRunning }),

  // error state
  error: null,
  setError: (error) => set({ error }),
}));
