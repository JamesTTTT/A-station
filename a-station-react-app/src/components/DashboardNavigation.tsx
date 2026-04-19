import { FolderTree, Server, History } from "lucide-react";
import { Button } from "@/components/ui";
import { ComingSoonDialog } from "./Modals/ComingSoonDialog";

export const DashboardNavigation = () => {
  return (
    <div className="flex flex-col items-center w-10 h-full bg-card border-r border-border">
      <div className="flex flex-col items-center">
        <ComingSoonDialog
          feature="Project Browser"
          description="A unified browser for navigating across all your playbook sources and folders is in the works."
          trigger={
            <Button
              aria-label="Project browser"
              title="Project browser"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-muted-foreground text-sm">
                <FolderTree />
              </span>
            </Button>
          }
        />

        <ComingSoonDialog
          feature="Inventory Manager"
          description="Manage hosts, groups, and variables in a visual inventory editor. Coming soon."
          trigger={
            <Button
              aria-label="Inventory manager"
              title="Inventory manager"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-muted-foreground text-sm">
                <Server />
              </span>
            </Button>
          }
        />

        <ComingSoonDialog
          feature="Run History"
          description="Browse every playbook run across this workspace, with status, logs, and diffs — on the roadmap."
          trigger={
            <Button
              aria-label="Run history"
              title="Run history"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-muted-foreground text-sm">
                <History />
              </span>
            </Button>
          }
        />
      </div>
    </div>
  );
};
