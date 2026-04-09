import { useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "@/stores/canvasStore";
import { useSourceStore } from "@/stores/sourceStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useJobStore } from "@/stores/jobStore";
import { nodeTypes } from "@/components/Canvas/nodeTypes";
import { Button } from "@/components/ui";
import { Play, List, Columns } from "lucide-react";
import { useJobExecution } from "@/hooks";
import type { FileTreeNode } from "@/types";
import type { ViewMode } from "@/types/nodes";

function collectInventoryPaths(
  node: FileTreeNode,
  currentPath: string,
): string[] {
  const paths: string[] = [];
  const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;

  if (node.type === "file") {
    const name = node.name.toLowerCase();
    const parentDir = currentPath.toLowerCase();
    const isInventoryDir =
      parentDir.includes("inventory") || parentDir.includes("inventories");
    const isInventoryFile =
      name === "hosts" ||
      name === "inventory" ||
      name.endsWith(".ini") ||
      name === "hosts.yml" ||
      name === "hosts.yaml";

    if (isInventoryDir || isInventoryFile) {
      paths.push(fullPath);
    }
  }

  if (node.type === "directory" && node.children) {
    for (const child of node.children) {
      paths.push(...collectInventoryPaths(child, fullPath));
    }
  }

  return paths;
}

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: typeof List }[] = [
  { value: "flat", label: "Flat", icon: List },
  { value: "grouped", label: "Grouped", icon: Columns },
];

export const Canvas = () => {
  const { executeJob } = useJobExecution();
  const { setCurrentJob } = useJobStore();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    loadFromYAML,
    clearCanvas,
    viewMode,
    setViewMode,
  } = useCanvasStore();
  const {
    selectedFilePath,
    selectedFileContent,
    activeSourceId,
    fileTree,
  } = useSourceStore();
  const { selectedWorkspace } = useWorkspaceStore();

  const [inventoryPath, setInventoryPath] = useState<string>("");

  // Reload canvas when view mode changes
  useEffect(() => {
    if (
      selectedFileContent &&
      selectedFilePath &&
      (selectedFilePath.endsWith(".yml") || selectedFilePath.endsWith(".yaml"))
    ) {
      loadFromYAML(selectedFileContent, selectedFilePath, activeSourceId || "default");
    }
  }, [selectedFilePath, selectedFileContent, loadFromYAML, activeSourceId, viewMode]);

  const inventoryPaths = useMemo(() => {
    if (!fileTree?.children) return [];
    const paths: string[] = [];
    for (const child of fileTree.children) {
      paths.push(...collectInventoryPaths(child, ""));
    }
    return paths;
  }, [fileTree]);

  useEffect(() => {
    if (!inventoryPath && inventoryPaths.length > 0) {
      setInventoryPath(inventoryPaths[0]);
    }
  }, [inventoryPaths, inventoryPath]);

  const proOptions = { hideAttribution: true };

  // Count meaningful nodes (tasks + roles)
  const nodeStats = useMemo(() => {
    let tasks = 0;
    let roles = 0;
    let plays = 0;
    for (const n of nodes) {
      if (n.data.type === "simpleTask") tasks++;
      else if (n.data.type === "roleNode") roles++;
      else if (n.data.type === "headNode") plays++;
    }
    return { tasks, roles, plays };
  }, [nodes]);

  return (
    <div className="flex-1 h-full bg-muted/70 overflow-auto relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
        className="bg-muted/70"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.state) {
              case "running":
                return "#3b82f6";
              case "success":
                return "#22c55e";
              case "failed":
                return "#ef4444";
              case "skipped":
                return "#eab308";
              default:
                if (node.data.type === "taskGroup") return "#64748b";
                if (node.data.type === "roleNode") return "#10b981";
                return "#94a3b8";
            }
          }}
        />

        {/* Top-left: Clear + View Toggle */}
        <Panel position="top-left" className="flex items-center gap-2">
          <Button variant="canvas" onClick={clearCanvas}>
            Clear Canvas
          </Button>

          <div className="flex items-center bg-background/90 backdrop-blur rounded-lg border overflow-hidden">
            {VIEW_MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setViewMode(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Top-right: File info + Execute */}
        {selectedFilePath && nodes.length > 0 && (
          <Panel position="top-right" className="min-w-38">
            <div className="bg-background/90 backdrop-blur px-3 py-2 rounded-lg border text-sm space-y-2">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <div className="font-semibold">{selectedFilePath}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                    {nodeStats.plays > 0 && (
                      <span>{nodeStats.plays} plays</span>
                    )}
                    {nodeStats.tasks > 0 && (
                      <span>{nodeStats.tasks} tasks</span>
                    )}
                    {nodeStats.roles > 0 && (
                      <span>{nodeStats.roles} roles</span>
                    )}
                  </div>
                </div>

                <Button
                  disabled={!inventoryPath || !activeSourceId}
                  onClick={async () => {
                    if (
                      !activeSourceId ||
                      !selectedFilePath ||
                      !inventoryPath ||
                      !selectedWorkspace
                    )
                      return;

                    const job = await executeJob({
                      workspace_id: selectedWorkspace.id,
                      source_id: activeSourceId,
                      playbook_path: selectedFilePath,
                      inventory_path: inventoryPath,
                      ansible_version: "2.17",
                    });
                    if (job) {
                      setCurrentJob(job);
                    }
                  }}
                >
                  <Play />
                </Button>
              </div>

              {inventoryPaths.length > 0 ? (
                <select
                  value={inventoryPath}
                  onChange={(e) => setInventoryPath(e.target.value)}
                  className="w-full text-xs bg-muted border border-border rounded px-2 py-1 text-foreground"
                >
                  {inventoryPaths.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-muted-foreground">
                  No inventory files detected
                </div>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
