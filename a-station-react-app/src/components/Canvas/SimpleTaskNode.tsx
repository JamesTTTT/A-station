import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { TaskNodeData } from "@/types/nodes";
import { cn } from "@/lib/utils";
import { Check, CircleX, RefreshCcw, SkipForward, Shield, RotateCcw } from "lucide-react";

const GROUP_BADGE_STYLES: Record<string, string> = {
  pre_tasks: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  tasks: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  post_tasks: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  handlers: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const BLOCK_ICONS: Record<string, { icon: typeof Shield; color: string }> = {
  rescue: { icon: Shield, color: "text-orange-500" },
  always: { icon: RotateCcw, color: "text-cyan-500" },
};

export const SimpleTaskNode = ({ data, selected }: NodeProps<TaskNodeData>) => {
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
        return "border-border bg-background";
    }
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

  const badgeStyle = GROUP_BADGE_STYLES[data.taskGroup] ?? GROUP_BADGE_STYLES.tasks;
  const blockInfo = data.blockType ? BLOCK_ICONS[data.blockType] : null;

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
        className="!bg-primary !w-3 !h-3"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Group badge + block indicator */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", badgeStyle)}>
              {data.taskGroup.replace("_", "-")}
            </span>
            {data.roleName && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {data.roleName}
              </span>
            )}
            {blockInfo && (
              <blockInfo.icon className={cn("w-3 h-3", blockInfo.color)} />
            )}
          </div>

          <div className="font-semibold text-sm text-foreground truncate">
            {data.name}
          </div>

          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className="font-mono">{data.module}</span>
          </div>
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
};
