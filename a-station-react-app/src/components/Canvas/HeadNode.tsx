import { Handle, Position } from "@xyflow/react";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Check,
  CircleX,
  RefreshCcw,
  SkipForward,
} from "lucide-react";
import type { HeadNodeData } from "@/types/nodes";
import { useCanvasStore } from "@/stores/canvasStore";
import { cn } from "@/lib/utils";

interface HeadNodeProps {
  id: string;
  data: HeadNodeData;
  selected: boolean;
}

export const HeadNode = ({ id, data, selected }: HeadNodeProps) => {
  const toggleExpansion = useCanvasStore(
    (state) => state.toggleHeadNodeExpansion,
  );

  const handleToggle = () => {
    toggleExpansion(id);
  };

  const getStateIcon = () => {
    switch (data.state) {
      case "running":
        return <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "success":
        return <Check className="w-4 h-4 text-green-500" />;
      case "failed":
        return <CircleX className="w-4 h-4 text-red-500" />;
      case "skipped":
        return <SkipForward className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "border-2 rounded-lg shadow-lg min-w-[350px] transition-all duration-200 border-border bg-card",
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      {/* Top Handle for dependencies */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-green-500 !w-3 !h-3"
      />

      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {getStateIcon()}
            <span className="text-xs font-mono text-muted-foreground">
              #{data.order}
            </span>
            <span className="text-xs font-semibold text-primary">
              {data.playbookFile}
            </span>
          </div>
          <button
            onClick={handleToggle}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {data.isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        <h3 className="text-sm font-bold mt-2">{data.playName}</h3>
      </div>

      {/* Expandable Content */}
      {data.isExpanded && (
        <div className="px-4 py-3 space-y-2 text-sm">
          {data.hosts && (
            <div>
              <span className="font-semibold text-muted-foreground">
                Hosts:{" "}
              </span>
              <span className="font-mono">
                {Array.isArray(data.hosts) ? data.hosts.join(", ") : data.hosts}
              </span>
            </div>
          )}

          {data.become !== undefined && (
            <div>
              <span className="font-semibold text-muted-foreground">
                Become:{" "}
              </span>
              <span className={data.become ? "text-green-500" : "text-red-500"}>
                {data.become ? "Yes" : "No"}
              </span>
              {data.becomeUser && (
                <span className="ml-2 font-mono">({data.becomeUser})</span>
              )}
            </div>
          )}

          {data.gather_facts !== undefined && (
            <div>
              <span className="font-semibold text-muted-foreground">
                Gather Facts:{" "}
              </span>
              <span
                className={
                  data.gather_facts ? "text-green-500" : "text-red-500"
                }
              >
                {data.gather_facts ? "Yes" : "No"}
              </span>
            </div>
          )}

          {data.tags && data.tags.length > 0 && (
            <div>
              <span className="font-semibold text-muted-foreground">
                Tags:{" "}
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.vars && Object.keys(data.vars).length > 0 && (
            <div>
              <span className="font-semibold text-muted-foreground">
                Variables:{" "}
              </span>
              <pre className="mt-1 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                {JSON.stringify(data.vars, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Collapsed Summary */}
      {!data.isExpanded && (
        <div className="px-4 py-2 text-xs text-muted-foreground">
          {data.hosts && (
            <span>
              Hosts:{" "}
              {Array.isArray(data.hosts) ? data.hosts.join(", ") : data.hosts}
            </span>
          )}
        </div>
      )}

      {/* Bottom Handle for children */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-3 !h-3"
      />
    </div>
  );
};
