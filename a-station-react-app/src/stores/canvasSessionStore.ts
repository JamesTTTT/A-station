import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { toast } from "sonner";
import { getFileContent } from "@/api/source-api";

export type FileStatus = "loading" | "loaded" | "error";

export interface CanvasFile {
  path: string;
  status: FileStatus;
  content?: string;
  error?: string;
  abort?: AbortController;
}

export interface LoadContext {
  workspaceId: string;
  sourceId: string;
}

interface CanvasSessionStore {
  files: Record<string, CanvasFile>;
  selection: string[];
  anchor: string | null;
  focused: string | null;

  replace: (paths: string[], ctx: LoadContext) => void;
  toggle: (path: string, ctx: LoadContext) => void;
  range: (paths: string[], focused: string, ctx: LoadContext) => void;
  clear: () => void;

  setFocused: (path: string | null, ctx: LoadContext) => void;

  retry: (path: string, ctx: LoadContext) => void;

  allSelectedLoaded: () => boolean;
  loadingCount: () => number;
  errorCount: () => number;
  totalSelected: () => number;
}

// ─── Internal fetch / cancel helpers ───

async function fetchOne(path: string, ctx: LoadContext): Promise<void> {
  const abort = new AbortController();

  useCanvasSessionStore.setState((s) => ({
    files: {
      ...s.files,
      [path]: { path, status: "loading", abort },
    },
  }));

  try {
    const result = await getFileContent(ctx.workspaceId, ctx.sourceId, path);

    const cur = useCanvasSessionStore.getState().files[path];
    if (!cur || cur.abort !== abort) return;

    if (result.success) {
      useCanvasSessionStore.setState((s) => ({
        files: {
          ...s.files,
          [path]: {
            path,
            status: "loaded",
            content: result.data.content,
          },
        },
      }));
    } else {
      const message =
        result.error.message || result.error.detail || "Failed to load file";
      useCanvasSessionStore.setState((s) => ({
        files: {
          ...s.files,
          [path]: { path, status: "error", error: message },
        },
      }));
      toast.error(`Failed to load ${path}`, {
        description: message,
        action: {
          label: "Retry",
          onClick: () => useCanvasSessionStore.getState().retry(path, ctx),
        },
      });
    }
  } catch (e) {
    const cur = useCanvasSessionStore.getState().files[path];
    if (!cur || cur.abort !== abort) return;
    const message = e instanceof Error ? e.message : "Unknown error";
    useCanvasSessionStore.setState((s) => ({
      files: {
        ...s.files,
        [path]: { path, status: "error", error: message },
      },
    }));
    toast.error(`Failed to load ${path}`, {
      description: message,
      action: {
        label: "Retry",
        onClick: () => useCanvasSessionStore.getState().retry(path, ctx),
      },
    });
  }
}

function ensureLoaded(paths: string[], ctx: LoadContext): void {
  const state = useCanvasSessionStore.getState();
  for (const p of paths) {
    const existing = state.files[p];
    if (existing?.status === "loaded" || existing?.status === "loading") {
      continue;
    }
    void fetchOne(p, ctx);
  }
}

function cancelFor(paths: string[]): void {
  const state = useCanvasSessionStore.getState();
  let changed = false;
  const next = { ...state.files };
  for (const p of paths) {
    const f = next[p];
    if (f?.status === "loading" && f.abort) {
      f.abort.abort();
      delete next[p];
      changed = true;
    }
  }
  if (changed) {
    useCanvasSessionStore.setState({ files: next });
  }
}

// ─── Store ───

export const useCanvasSessionStore = create<CanvasSessionStore>()(
  subscribeWithSelector((set, get) => ({
    files: {},
    selection: [],
    anchor: null,
    focused: null,

    replace: (paths, ctx) => {
      const prev = get();
      const removed = prev.selection.filter((p) => !paths.includes(p));
      cancelFor(removed);

      const last = paths[paths.length - 1] ?? null;
      const keepFocused = prev.focused && paths.includes(prev.focused);
      set({
        selection: paths,
        focused: keepFocused ? prev.focused : last,
        anchor: last,
      });

      ensureLoaded(paths, ctx);
    },

    toggle: (path, ctx) => {
      const prev = get();
      if (prev.selection.includes(path)) {
        cancelFor([path]);
        const next = prev.selection.filter((p) => p !== path);
        set({
          selection: next,
          focused: prev.focused === path ? (next[0] ?? null) : prev.focused,
          anchor: path,
        });
      } else {
        set({
          selection: [...prev.selection, path],
          focused: path,
          anchor: path,
        });
        ensureLoaded([path], ctx);
      }
    },

    range: (paths, focused, ctx) => {
      const prev = get();
      const removed = prev.selection.filter((p) => !paths.includes(p));
      cancelFor(removed);
      set({
        selection: paths,
        focused,
      });
      ensureLoaded(paths, ctx);
    },

    clear: () => {
      cancelFor(get().selection);
      set({
        files: {},
        selection: [],
        focused: null,
        anchor: null,
      });
    },

    setFocused: (path, ctx) => {
      set({ focused: path });
      if (!path) return;
      const existing = get().files[path];
      if (existing?.status === "loaded") return;
      void fetchOne(path, ctx);
    },

    retry: (path, ctx) => {
      void fetchOne(path, ctx);
    },

    allSelectedLoaded: () => {
      const { files, selection } = get();
      return selection.every((p) => files[p]?.status === "loaded");
    },

    loadingCount: () => {
      const { files, selection } = get();
      return selection.filter((p) => files[p]?.status === "loading").length;
    },

    errorCount: () => {
      const { files, selection } = get();
      return selection.filter((p) => files[p]?.status === "error").length;
    },

    totalSelected: () => get().selection.length,
  })),
);
