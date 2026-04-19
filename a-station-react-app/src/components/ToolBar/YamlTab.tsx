import { YamlCodeViewer } from "@/components";
import { useCanvasSessionStore } from "@/stores/canvasSessionStore";
import { File, Loader2, AlertCircle } from "lucide-react";

export function YamlTab() {
  const focused = useCanvasSessionStore((s) => s.focused);
  const file = useCanvasSessionStore((s) =>
    s.focused ? s.files[s.focused] : undefined,
  );

  const content = file?.status === "loaded" ? (file.content ?? "") : "";
  const loading = file?.status === "loading";
  const error = file?.status === "error" ? file.error : null;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <File className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground truncate">
            {focused || "Click a file or node to preview"}
          </span>
        </div>
        {loading && (
          <Loader2 className="w-3 h-3 shrink-0 animate-spin text-muted-foreground" />
        )}
        {error && (
          <AlertCircle className="w-3 h-3 shrink-0 text-destructive" />
        )}
      </div>
      {error ? (
        <div className="flex-1 flex items-center justify-center text-xs text-destructive px-4 text-center">
          Failed to load: {error}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <YamlCodeViewer content={content} readOnly />
        </div>
      )}
    </div>
  );
}
