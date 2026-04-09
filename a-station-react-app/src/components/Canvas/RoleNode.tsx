import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { RoleNodeData } from "@/types/nodes";
import { cn } from "@/lib/utils";
import {
  Blocks,
  Check,
  CircleX,
  RefreshCcw,
  SkipForward,
} from "lucide-react";

export const RoleNode = ({ data, selected }: NodeProps<RoleNodeData>) => {
  const getStateStyles = () => {
    switch (data.state) {
      case "running":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 animate-pulse";
      case "success":
        return "border-green-500 bg-green-50 dark:bg-green-950/40";
      case "failed":
        return "border-red-500 bg-red-50 dark:bg-red-950/40";
      case "skipped":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40";
      default:
        return "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30";
    }
  };

  const getStateIcon = () => {
    switch (data.state) {
      case "running":
        return <RefreshCcw className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
      case "success":
        return <Check className="w-3.5 h-3.5 text-green-500" />;
      case "failed":
        return <CircleX className="w-3.5 h-3.5 text-red-500" />;
      case "skipped":
        return <SkipForward className="w-3.5 h-3.5 text-yellow-500" />;
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
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-emerald-500 !w-3 !h-3"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Blocks className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Role
            </span>
          </div>
          <div className="font-semibold text-sm text-foreground truncate">
            {data.name}
          </div>

          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {data.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-emerald-200/60 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 rounded text-[10px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {data.when && (
            <div className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
              when: {data.when}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">{getStateIcon()}</div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500 !w-3 !h-3"
      />
    </div>
  );
};
