import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  type Node,
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
import type { ViewMode, AnyNodeData } from "@/types/nodes";

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

const isYamlPath = (p: string) => p.endsWith(".yml") || p.endsWith(".yaml");

const playbookIdFor = (sourceId: string | null, path: string) =>
  `${sourceId ?? "default"}::${path}`;

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
    loadMultiplePlaybooks,
    clearCanvas,
    viewMode,
    setViewMode,
  } = useCanvasStore();
  const {
    selectedFilePaths,
    fileContents,
    focusedFilePath,
    setFocusedFile,
    activeSourceId,
    fileTree,
  } = useSourceStore();
  const { selectedWorkspace } = useWorkspaceStore();

  const [inventoryPath, setInventoryPath] = useState<string>("");

  // Reload canvas when selection / contents / view mode change
  useEffect(() => {
    const yamlPaths = selectedFilePaths.filter(isYamlPath);
    if (yamlPaths.length === 0) return;

    // Wait until all selected files have content cached
    const allLoaded = yamlPaths.every((p) => fileContents[p] !== undefined);
    if (!allLoaded) return;

    if (yamlPaths.length === 1) {
      const p = yamlPaths[0];
      loadFromYAML(fileContents[p], p, playbookIdFor(activeSourceId, p));
      return;
    }

    loadMultiplePlaybooks(
      yamlPaths.map((p) => ({
        content: fileContents[p],
        filename: p,
        id: playbookIdFor(activeSourceId, p),
      })),
    );
  }, [
    selectedFilePaths,
    fileContents,
    activeSourceId,
    viewMode,
    loadFromYAML,
    loadMultiplePlaybooks,
  ]);

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

  // Count meaningful nodes (tasks + roles + plays)
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

  // Click any node → its playbook becomes the focused one (drives YAML pane)
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<AnyNodeData>) => {
      const data = node.data;
      if (
        data.type === "headNode" ||
        data.type === "simpleTask" ||
        data.type === "roleNode" ||
        data.type === "playbookFrame"
      ) {
        setFocusedFile(data.playbookFile);
      }
      // taskGroup nodes have no playbookFile of their own — leave focus alone
    },
    [setFocusedFile],
  );

  // Execute uses the focused playbook, but only if it's actually a YAML
  // that's currently on the canvas.
  const runnablePath =
    focusedFilePath &&
    isYamlPath(focusedFilePath) &&
    selectedFilePaths.includes(focusedFilePath)
      ? focusedFilePath
      : null;

  return (
    <div className="w-full h-full bg-muted/70 overflow-auto relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
        className="bg-muted/70"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.type === "playbookFrame") return "transparent";
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
        {selectedFilePaths.length > 0 && nodes.length > 0 && (
          <Panel position="top-right" className="min-w-38">
            <div className="bg-background/90 backdrop-blur px-3 py-2 rounded-lg border text-sm space-y-2">
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate max-w-[260px]">
                    {focusedFilePath ?? `${selectedFilePaths.length} playbooks`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                    {selectedFilePaths.length > 1 && (
                      <span>{selectedFilePaths.length} playbooks</span>
                    )}
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
                  disabled={!inventoryPath || !activeSourceId || !runnablePath}
                  title={
                    runnablePath
                      ? `Run ${runnablePath}`
                      : "Click a playbook node to choose what to run"
                  }
                  onClick={async () => {
                    if (
                      !activeSourceId ||
                      !runnablePath ||
                      !inventoryPath ||
                      !selectedWorkspace
                    )
                      return;

                    const job = await executeJob({
                      workspace_id: selectedWorkspace.id,
                      source_id: activeSourceId,
                      playbook_path: runnablePath,
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
