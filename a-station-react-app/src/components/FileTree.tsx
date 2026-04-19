import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useSourceStore } from "@/stores/sourceStore";
import { useCanvasSessionStore } from "@/stores/canvasSessionStore";
import { AddSource } from "@/components/Modals/AddSource";
import { Button } from "@/components/ui";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  GitBranch,
  HardDrive,
  Loader2,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { FileTreeNode } from "@/types";

const isYamlFile = (name: string) =>
  name.endsWith(".yml") || name.endsWith(".yaml");

function collectYamlPaths(node: FileTreeNode, prefix: string): string[] {
  const here = prefix ? `${prefix}/${node.name}` : node.name;
  if (node.type === "file") {
    return isYamlFile(node.name) ? [here] : [];
  }
  const out: string[] = [];
  if (node.children) {
    for (const child of node.children) {
      out.push(...collectYamlPaths(child, here));
    }
  }
  return out;
}

interface TreeNodeProps {
  node: FileTreeNode;
  path: string;
  depth: number;
  selectedPaths: Set<string>;
  focusedPath: string | null;
  fileStatuses: Record<
    string,
    { status: "loading" | "loaded" | "error"; error?: string }
  >;
  onSelectFile: (path: string, isYaml: boolean, e: MouseEvent) => void;
}

const TreeNode = ({
  node,
  path,
  depth,
  selectedPaths,
  focusedPath,
  fileStatuses,
  onSelectFile,
}: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const isDir = node.type === "directory";
  const isSelected = selectedPaths.has(fullPath);
  const isFocused = focusedPath === fullPath;
  const yaml = !isDir && isYamlFile(node.name);
  const status = fileStatuses[fullPath];

  if (isDir) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex w-full items-center gap-1.5 px-2 py-1 hover:bg-accent cursor-pointer text-left`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm text-foreground truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.name}
                node={child}
                path={fullPath}
                depth={depth + 1}
                selectedPaths={selectedPaths}
                focusedPath={focusedPath}
                fileStatuses={fileStatuses}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const errored = status?.status === "error";
  const loading = status?.status === "loading";

  return (
    <button
      onClick={(e) => onSelectFile(fullPath, yaml, e)}
      className={`flex w-full items-center gap-1.5 px-2 py-1 hover:bg-accent cursor-pointer text-left ${
        errored
          ? "bg-destructive/10"
          : isSelected
            ? "bg-primary/15"
            : isFocused
              ? "bg-accent"
              : ""
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      title={
        errored
          ? status?.error ?? "Failed to load"
          : yaml
            ? "Click to load • Cmd/Ctrl-click to add • Shift-click for range"
            : "Click to preview"
      }
    >
      <File
        className={`w-4 h-4 shrink-0 ${yaml ? "text-primary" : "text-muted-foreground"}`}
      />
      <span
        className={`text-sm truncate flex-1 ${
          isSelected ? "text-foreground font-medium" : "text-foreground"
        }`}
      >
        {node.name}
      </span>
      {loading && (
        <Loader2 className="w-3 h-3 shrink-0 text-muted-foreground animate-spin" />
      )}
      {errored && (
        <AlertCircle className="w-3 h-3 shrink-0 text-destructive" />
      )}
    </button>
  );
};

interface FileTreeProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const FileTree = ({
  collapsed = false,
  onToggleCollapse,
}: FileTreeProps) => {
  const { selectedWorkspace } = useWorkspaceStore();
  const {
    sources,
    activeSourceId,
    fileTree,
    loading,
    syncLoading,
    error,
    fetchSources,
    setActiveSource,
    syncSource,
    removeSource,
  } = useSourceStore();

  const selection = useCanvasSessionStore((s) => s.selection);
  const focused = useCanvasSessionStore((s) => s.focused);
  const anchor = useCanvasSessionStore((s) => s.anchor);
  const files = useCanvasSessionStore((s) => s.files);
  const sessionReplace = useCanvasSessionStore((s) => s.replace);
  const sessionToggle = useCanvasSessionStore((s) => s.toggle);
  const sessionRange = useCanvasSessionStore((s) => s.range);
  const sessionClear = useCanvasSessionStore((s) => s.clear);
  const sessionSetFocused = useCanvasSessionStore((s) => s.setFocused);

  useEffect(() => {
    if (!selectedWorkspace) return;
    fetchSources(selectedWorkspace.id);
  }, [selectedWorkspace?.id, fetchSources]);

  const activeSource = sources.find((s) => s.id === activeSourceId);

  const orderedYamlPaths = useMemo(() => {
    if (!fileTree?.children) return [];
    const out: string[] = [];
    for (const child of fileTree.children) {
      out.push(...collectYamlPaths(child, ""));
    }
    return out;
  }, [fileTree]);

  const selectedSet = useMemo(() => new Set(selection), [selection]);

  const fileStatuses = useMemo(() => {
    const out: Record<
      string,
      { status: "loading" | "loaded" | "error"; error?: string }
    > = {};
    for (const [p, f] of Object.entries(files)) {
      out[p] = { status: f.status, error: f.error };
    }
    return out;
  }, [files]);

  const loadingSelectedCount = useMemo(
    () => selection.filter((p) => files[p]?.status === "loading").length,
    [selection, files],
  );
  const totalSelected = selection.length;
  const loadedSelectedCount = totalSelected - loadingSelectedCount;
  const progressPct =
    totalSelected > 0 ? (loadedSelectedCount / totalSelected) * 100 : 0;

  const makeCtx = () => {
    if (!selectedWorkspace || !activeSourceId) return null;
    return { workspaceId: selectedWorkspace.id, sourceId: activeSourceId };
  };

  const handleSelectFile = (
    path: string,
    isYaml: boolean,
    e: MouseEvent,
  ) => {
    const ctx = makeCtx();
    if (!ctx) return;

    if (!isYaml) {
      sessionSetFocused(path, ctx);
      return;
    }

    const isCmd = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    if (isShift && anchor && orderedYamlPaths.length) {
      const i1 = orderedYamlPaths.indexOf(anchor);
      const i2 = orderedYamlPaths.indexOf(path);
      if (i1 >= 0 && i2 >= 0) {
        const [a, b] = i1 < i2 ? [i1, i2] : [i2, i1];
        const range = orderedYamlPaths.slice(a, b + 1);
        sessionRange(range, path, ctx);
        return;
      }
      sessionReplace([path], ctx);
      return;
    }

    if (isCmd) {
      sessionToggle(path, ctx);
      return;
    }

    sessionReplace([path], ctx);
  };

  const handleSelectAll = () => {
    const ctx = makeCtx();
    if (!ctx || orderedYamlPaths.length === 0) return;
    sessionReplace(orderedYamlPaths, ctx);
  };

  const handleDeselectAll = () => {
    sessionClear();
  };

  const handleSync = async () => {
    if (!selectedWorkspace || !activeSourceId) return;
    await syncSource(selectedWorkspace.id, activeSourceId);
  };

  if (!selectedWorkspace) return null;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center h-full w-full bg-background border-r border-border py-2 gap-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Expand file tree"
          aria-label="Expand file tree"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <div
          className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground select-none"
          style={{ writingMode: "vertical-rl" }}
        >
          Files
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-background border-r border-border min-w-0">
      {/* Source selector header */}
      <div className="px-3 py-2 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Source</h2>
          <div className="flex items-center gap-0.5">
            {activeSourceId && (
              <Button
                className="flex items-center justify-center w-6 h-6 rounded bg-transparent hover:bg-destructive/10 transition-colors"
                onClick={() => {
                  if (!activeSourceId) return;
                  const source = sources.find((s) => s.id === activeSourceId);
                  if (!source) return;
                  if (!window.confirm(`Remove source "${source.name}"?`))
                    return;
                  removeSource(selectedWorkspace.id, activeSourceId);
                }}
                title="Remove source"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            )}
            <AddSource
              workspaceId={selectedWorkspace.id}
              trigger={
                <Button className="flex items-center justify-center w-6 h-6 rounded bg-transparent hover:bg-accent transition-colors">
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              }
            />
            {onToggleCollapse && (
              <Button
                onClick={onToggleCollapse}
                className="flex items-center justify-center w-6 h-6 rounded bg-transparent hover:bg-accent transition-colors ml-0.5"
                title="Collapse file tree"
                aria-label="Collapse file tree"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {sources.length > 0 && (
          <div className="flex items-center gap-1">
            <select
              value={activeSourceId || ""}
              onChange={(e) => {
                if (e.target.value) {
                  setActiveSource(e.target.value, selectedWorkspace.id);
                }
              }}
              className="flex-1 text-sm bg-muted border border-border rounded px-2 py-1 text-foreground truncate"
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>

            {activeSource?.source_type === "git" && (
              <Button
                className="flex items-center justify-center w-7 h-7 rounded bg-transparent hover:bg-accent transition-colors"
                onClick={handleSync}
                disabled={syncLoading}
                title="Sync (git pull)"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-muted-foreground ${syncLoading ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>
        )}

        {/* Source info */}
        {activeSource && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {activeSource.source_type === "git" ? (
              <>
                <GitBranch className="w-3 h-3" />
                <span className="truncate">
                  {activeSource.git_branch || "main"}
                </span>
              </>
            ) : (
              <>
                <HardDrive className="w-3 h-3" />
                <span className="truncate">local</span>
              </>
            )}
            {activeSource.last_synced_at && (
              <span className="ml-auto text-[10px]">
                {new Date(activeSource.last_synced_at).toLocaleString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        )}

        {error && <div className="p-4 text-xs text-destructive">{error}</div>}

        {!loading && !error && sources.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            No sources added yet. Click + to add a project source.
          </div>
        )}

        {!loading && !error && fileTree && fileTree.children && (
          <div className="py-1">
            {fileTree.children.map((node) => (
              <TreeNode
                key={node.name}
                node={node}
                path=""
                depth={0}
                selectedPaths={selectedSet}
                focusedPath={focused}
                fileStatuses={fileStatuses}
                onSelectFile={handleSelectFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selection footer */}
      {orderedYamlPaths.length > 0 && (
        <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-2 bg-muted/30">
          <span className="text-[11px] text-muted-foreground">
            {selection.length} / {orderedYamlPaths.length} selected
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSelectAll}
              className="text-[11px] px-2 py-1 rounded hover:bg-accent text-foreground"
              title="Select all YAML files in this source"
            >
              All
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={selection.length === 0}
              className="text-[11px] px-2 py-1 rounded hover:bg-accent text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bulk-load progress bar */}
      {loadingSelectedCount > 0 && (
        <div className="border-t border-border px-3 py-1.5 bg-muted/30">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>
              Loading {loadedSelectedCount} / {totalSelected}
            </span>
          </div>
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
