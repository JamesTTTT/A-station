import { YamlCodeViewer } from "@/components";
import { useSourceStore } from "@/stores/sourceStore";
import { File } from "lucide-react";

export function YamlTab() {
  const { focusedFilePath, fileContents, fileLoading } = useSourceStore();

  const content =
    focusedFilePath !== null ? (fileContents[focusedFilePath] ?? "") : "";

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <File className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground truncate">
            {focusedFilePath || "Click a file or node to preview"}
          </span>
        </div>
        {fileLoading && (
          <span className="text-xs text-muted-foreground shrink-0">
            Loading...
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <YamlCodeViewer content={content} readOnly height="100%" />
      </div>
    </div>
  );
}
