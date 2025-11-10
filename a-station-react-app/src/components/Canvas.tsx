import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "@/stores/canvasStore";
import { Button } from "@/components/ui";

export const Canvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useCanvasStore();

  return (
    <div className="flex-1 h-full bg-muted/70 overflow-auto relative">
      {/* Canvas Header/Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 absolute z-50">
        <Button className="px-3 py-1.5 text-xs rounded bg-muted hover:bg-accent transition-colors text-muted-foreground">
          Add Node
        </Button>
        <Button className="px-3 py-1.5 text-xs rounded bg-muted hover:bg-accent transition-colors text-muted-foreground">
          Clear All
        </Button>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-muted/70"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
