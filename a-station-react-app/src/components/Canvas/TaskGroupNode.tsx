import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { TaskGroupNodeData } from "@/types/nodes";
import { cn } from "@/lib/utils";
import {
  ListChecks,
  Blocks,
  ClipboardList,
  ClipboardCheck,
  Bell,
} from "lucide-react";

const GROUP_STYLES: Record<
  string,
  { icon: typeof ListChecks; color: string; bg: string; border: string }
> = {
  pre_tasks: {
    icon: ListChecks,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
  },
  roles: {
    icon: Blocks,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-300 dark:border-emerald-700",
  },
  tasks: {
    icon: ClipboardList,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-700",
  },
  post_tasks: {
    icon: ClipboardCheck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-300 dark:border-purple-700",
  },
  handlers: {
    icon: Bell,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-300 dark:border-rose-700",
  },
};

export const TaskGroupNode = ({
  data,
  selected,
}: NodeProps<TaskGroupNodeData>) => {
  const style = GROUP_STYLES[data.groupType] ?? GROUP_STYLES.tasks;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "rounded-lg border-2 min-w-[220px] transition-all duration-200",
        style.border,
        style.bg,
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-3 !h-3"
      />

      <div className="px-3 py-2 flex items-center gap-2">
        <Icon className={cn("w-4 h-4", style.color)} />
        <span className={cn("text-xs font-bold uppercase tracking-wide", style.color)}>
          {data.label}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3"
      />
    </div>
  );
};
