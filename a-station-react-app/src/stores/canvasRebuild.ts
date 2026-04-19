import { useCanvasSessionStore } from "./canvasSessionStore";
import { useCanvasStore } from "./canvasStore";

function playbookIdFor(path: string): string {
  return `session::${path}`;
}

function rebuild(): void {
  const session = useCanvasSessionStore.getState();
  const canvas = useCanvasStore.getState();
  const { selection, files } = session;

  if (selection.length === 0) {
    canvas.clearCanvas();
    return;
  }

  if (!session.allSelectedLoaded()) {
    return;
  }

  if (selection.length === 1) {
    const p = selection[0];
    const content = files[p]?.content ?? "";
    canvas.loadFromYAML(content, p, playbookIdFor(p));
    return;
  }

  const playbooks = selection.map((p) => ({
    content: files[p]?.content ?? "",
    filename: p,
    id: playbookIdFor(p),
  }));
  canvas.loadMultiplePlaybooks(playbooks);
}

let initialized = false;

export function initCanvasRebuild(): void {
  if (initialized) return;
  initialized = true;

  useCanvasSessionStore.subscribe(
    (s) => s.selection,
    () => rebuild(),
  );

  useCanvasSessionStore.subscribe(
    (s) => s.files,
    () => rebuild(),
  );

  useCanvasStore.subscribe(
    (s) => s.viewMode,
    () => rebuild(),
  );

  rebuild();
}
