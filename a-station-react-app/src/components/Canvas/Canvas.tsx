import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "@/stores/canvasStore.ts";
import { usePlaybookStore } from "@/stores/playbookStore";
import { useJobStore } from "@/stores/jobStore";
import { nodeTypes } from "@/components/Canvas/nodeTypes";

import { Button } from "@/components/ui";
import { useEffect } from "react";
import { Play } from "lucide-react";
import { useJobExecution } from "@/hooks";

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
  } = useCanvasStore();
  const { playbooks, selectedPlaybookId } = usePlaybookStore();
  const selectedPlaybook = playbooks.find((pb) => pb.id === selectedPlaybookId);

  useEffect(() => {
    if (selectedPlaybook?.yaml_content) {
      loadFromYAML(selectedPlaybook.yaml_content);
    }
  }, [selectedPlaybook?.id, selectedPlaybook?.yaml_content, loadFromYAML]);

  const proOptions = { hideAttribution: true };
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
                return "#94a3b8";
            }
          }}
        />
        <Panel position="top-left" className="flex items-center gap-2">
          <Button variant="canvas" onClick={() => {}}>
            Clear Canvas
          </Button>
        </Panel>

        {selectedPlaybook && (
          <Panel position="top-right" className={"min-w-38"}>
            <div className="bg-background/90 backdrop-blur px-3 py-2 rounded-lg border text-sm flex justify-between align-middle items-center">
              <div>
                <div className="font-semibold">{selectedPlaybook.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {nodes.length} tasks
                </div>
              </div>

              <div>
                <Button
                  onClick={async () => {
                    const job = await executeJob({
                      playbook_id: selectedPlaybook.id,
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
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
