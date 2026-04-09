import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useSourceStore } from "@/stores/sourceStore";
import { useAuthStore } from "@/stores/authStore";
import { AddSource } from "@/components/Modals/AddSource";
import { Button } from "@/components/ui";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  GitBranch,
  HardDrive,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { FileTreeNode } from "@/types";

const isYamlFile = (name: string) =>
  name.endsWith(".yml") || name.endsWith(".yaml");

interface TreeNodeProps {
  node: FileTreeNode;
  path: string;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

const TreeNode = ({
  node,
  path,
  depth,
  selectedPath,
  onSelectFile,
}: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const isDir = node.type === "directory";
  const isSelected = selectedPath === fullPath;

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
                selectedPath={selectedPath}
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
      onClick={() => onSelectFile(fullPath)}
      className={`flex w-full items-center gap-1.5 px-2 py-1 hover:bg-accent cursor-pointer text-left ${
        isSelected ? "bg-accent" : ""
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <File
        className={`w-4 h-4 shrink-0 ${isYamlFile(node.name) ? "text-primary" : "text-muted-foreground"}`}
      />
      <span className="text-sm text-foreground truncate">{node.name}</span>
    </button>
  );
};

export const FileTree = () => {
  const { selectedWorkspace } = useWorkspaceStore();
  const token = useAuthStore((state) => state.token);
  const {
    sources,
    activeSourceId,
    fileTree,
    selectedFilePath,
    loading,
    syncLoading,
    error,
    fetchSources,
    setActiveSource,
    selectFile,
    syncSource,
    removeSource,
  } = useSourceStore();
  useEffect(() => {
    if (!selectedWorkspace || !token) return;
    fetchSources(selectedWorkspace.id, token);
  }, [selectedWorkspace?.id, token, fetchSources]);

  const activeSource = sources.find((s) => s.id === activeSourceId);

  const handleSelectFile = async (path: string) => {
    if (!selectedWorkspace || !token || !activeSourceId) return;

    await selectFile(selectedWorkspace.id, activeSourceId, path, token);
  };

  const handleSync = async () => {
    if (!selectedWorkspace || !token || !activeSourceId) return;
    await syncSource(selectedWorkspace.id, activeSourceId, token);
  };

  if (!selectedWorkspace) return null;

  return (
    <div className="flex flex-col w-64 h-full bg-background border-r border-border">
      {/* Source selector header */}
      <div className="px-3 py-2 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Source</h2>
          <div className="flex items-center gap-0.5">
            {activeSourceId && (
              <Button
                className="flex items-center justify-center w-6 h-6 rounded bg-transparent hover:bg-destructive/10 transition-colors"
                onClick={() => {
                  if (!token || !activeSourceId) return;
                  const source = sources.find((s) => s.id === activeSourceId);
                  if (!source) return;
                  if (!window.confirm(`Remove source "${source.name}"?`)) return;
                  removeSource(selectedWorkspace.id, activeSourceId, token);
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
          </div>
        </div>

        {sources.length > 0 && (
          <div className="flex items-center gap-1">
            <select
              value={activeSourceId || ""}
              onChange={(e) => {
                if (e.target.value && token) {
                  setActiveSource(e.target.value, selectedWorkspace.id, token);
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

        {error && (
          <div className="p-4 text-xs text-destructive">{error}</div>
        )}

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
                selectedPath={selectedFilePath}
                onSelectFile={handleSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
