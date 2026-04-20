import { Link } from "@tanstack/react-router";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Button } from "@/components/ui";
import { Cloud, Settings2, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ComingSoonDialog } from "./Modals/ComingSoonDialog";
import { ACloudDialog } from "./Modals/ACloudDialog";
import { AccountDialog } from "./Modals/AccountDialog";

export const DashboardTopBar = () => {
  const { selectedWorkspace } = useWorkspaceStore();

  return (
    <div className="flex items-center justify-between h-10 pl-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-primary">
          <Link to={"/workspaces/select"}>A-Station</Link>
        </h1>
        {selectedWorkspace && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-lg font-medium text-foreground">
              {selectedWorkspace.name}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-0 h-10">
        <ThemeToggle />

        <ComingSoonDialog
          feature="Settings"
          description="Workspace and user settings — themes, keyboard shortcuts, integrations, and more — are on the way."
          trigger={
            <Button
              aria-label="Settings"
              title="Settings"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-muted-foreground text-sm">
                <Settings2 />
              </span>
            </Button>
          }
        />

        <AccountDialog
          trigger={
            <Button
              aria-label="Account"
              title="Account"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-muted-foreground text-sm">
                <User />
              </span>
            </Button>
          }
        />

        <ACloudDialog
          trigger={
            <Button
              aria-label="A-Station Cloud"
              title="A-Station Cloud — hosted version"
              className="flex items-center gap-1.5 h-10 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              <Cloud className="w-4 h-4" />
              <span className="text-sm font-medium">A-Station Cloud</span>
            </Button>
          }
        />
      </div>
    </div>
  );
};
