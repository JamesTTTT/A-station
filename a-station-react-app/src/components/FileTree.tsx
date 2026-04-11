import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useSourceStore } from "@/stores/sourceStore";
import { AddSource } from "@/components/Modals/AddSource";
import { Button } from "@/components/ui";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  GitBranch,
  HardDrive,
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
  onSelectFile: (path: string, isYaml: boolean, e: MouseEvent) => void;
}

const TreeNode = ({
  node,
  path,
  depth,
  selectedPaths,
  focusedPath,
  onSelectFile,
}: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const isDir = node.type === "directory";
  const isSelected = selectedPaths.has(fullPath);
  const isFocused = focusedPath === fullPath;
  const yaml = !isDir && isYamlFile(node.name);

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
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => onSelectFile(fullPath, yaml, e)}
      className={`flex w-full items-center gap-1.5 px-2 py-1 hover:bg-accent cursor-pointer text-left ${
        isSelected ? "bg-primary/15" : isFocused ? "bg-accent" : ""
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      title={
        yaml
          ? "Click to load • Cmd/Ctrl-click to add • Shift-click for range"
          : "Click to preview"
      }
    >
      <File
        className={`w-4 h-4 shrink-0 ${yaml ? "text-primary" : "text-muted-foreground"}`}
      />
      <span
        className={`text-sm truncate ${
          isSelected ? "text-foreground font-medium" : "text-foreground"
        }`}
      >
        {node.name}
      </span>
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
    selectedFilePaths,
    focusedFilePath,
    selectionAnchor,
    loading,
    syncLoading,
    error,
    fetchSources,
    setActiveSource,
    setSelection,
    setFocusedFile,
    loadFileContents,
    syncSource,
    removeSource,
  } = useSourceStore();

  useEffect(() => {
    if (!selectedWorkspace) return;
    fetchSources(selectedWorkspace.id);
  }, [selectedWorkspace?.id, fetchSources]);

  const activeSource = sources.find((s) => s.id === activeSourceId);

  // Ordered list of YAML files for range-select math
  const orderedYamlPaths = useMemo(() => {
    if (!fileTree?.children) return [];
    const out: string[] = [];
    for (const child of fileTree.children) {
      out.push(...collectYamlPaths(child, ""));
    }
    return out;
  }, [fileTree]);

  const selectedSet = useMemo(
    () => new Set(selectedFilePaths),
    [selectedFilePaths],
  );

  const handleSelectFile = async (
    path: string,
    isYaml: boolean,
    e: MouseEvent,
  ) => {
    if (!selectedWorkspace || !activeSourceId) return;

    // Non-YAML: just preview in the YAML pane, don't touch canvas selection
    if (!isYaml) {
      setFocusedFile(path);
      await loadFileContents(selectedWorkspace.id, activeSourceId, [path]);
      return;
    }

    const isCmd = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;
    const current = selectedFilePaths;

    let nextPaths: string[];
    let nextFocused: string | null;
    let nextAnchor: string | null = selectionAnchor;

    if (isShift && selectionAnchor && orderedYamlPaths.length) {
      const i1 = orderedYamlPaths.indexOf(selectionAnchor);
      const i2 = orderedYamlPaths.indexOf(path);
      if (i1 >= 0 && i2 >= 0) {
        const [a, b] = i1 < i2 ? [i1, i2] : [i2, i1];
        nextPaths = orderedYamlPaths.slice(a, b + 1);
        nextFocused = path;
      } else {
        nextPaths = [path];
        nextFocused = path;
        nextAnchor = path;
      }
    } else if (isCmd) {
      if (current.includes(path)) {
        nextPaths = current.filter((p) => p !== path);
        nextFocused = nextPaths[0] ?? null;
      } else {
        nextPaths = [...current, path];
        nextFocused = path;
      }
      nextAnchor = path;
    } else {
      nextPaths = [path];
      nextFocused = path;
      nextAnchor = path;
    }

    setSelection(nextPaths, nextFocused, nextAnchor);
    if (nextPaths.length > 0) {
      await loadFileContents(selectedWorkspace.id, activeSourceId, nextPaths);
    }
  };

  const handleSelectAll = async () => {
    if (!selectedWorkspace || !activeSourceId) return;
    if (orderedYamlPaths.length === 0) return;
    setSelection(orderedYamlPaths, orderedYamlPaths[0], orderedYamlPaths[0]);
    await loadFileContents(
      selectedWorkspace.id,
      activeSourceId,
      orderedYamlPaths,
    );
  };

  const handleDeselectAll = () => {
    setSelection([], null, null);
  };

  const handleSync = async () => {
    if (!selectedWorkspace || !activeSourceId) return;
    await syncSource(selectedWorkspace.id, activeSourceId);
  };

  if (!selectedWorkspace) return null;

  // Collapsed rail: thin vertical strip with a single expand affordance.
  // Keeps the panel discoverable instead of hiding it entirely.
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
                focusedPath={focusedFilePath}
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
            {selectedFilePaths.length} / {orderedYamlPaths.length} selected
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
              disabled={selectedFilePaths.length === 0}
              className="text-[11px] px-2 py-1 rounded hover:bg-accent text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
