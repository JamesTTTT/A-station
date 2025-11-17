import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { TaskNodeData } from "@/types/nodes";
import { cn } from "@/lib/utils";

export const SimpleTaskNode = ({ data, selected }: NodeProps<TaskNodeData>) => {
  // State-based styling
  const getStateStyles = () => {
    switch (data.state) {
      case "running":
        return "border-blue-500 bg-blue-50 shadow-lg shadow-blue-200 animate-pulse";
      case "success":
        return "border-green-500 bg-green-50";
      case "failed":
        return "border-red-500 bg-red-50";
      case "skipped":
        return "border-yellow-500 bg-yellow-50";
      default:
        return "border-border bg-background";
    }
  };

  // State icons
  const getStateIcon = () => {
    switch (data.state) {
      case "running":
        return <div className="text-blue-500 text-xl animate-spin">⟳</div>;
      case "success":
        return <div className="text-green-500 text-xl">✓</div>;
      case "failed":
        return <div className="text-red-500 text-xl">✗</div>;
      case "skipped":
        return <div className="text-yellow-500 text-xl">⊘</div>;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 min-w-[200px] transition-all duration-200",
        getStateStyles(),
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-3 !h-3"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground truncate">
            {data.name}
          </div>

          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className="font-mono">{data.module}</span>
          </div>

          {data.playName && (
            <div className="text-xs text-muted-foreground/70 mt-1 italic truncate">
              {data.playName}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">{getStateIcon()}</div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3"
      />
    </div>
  );
}
