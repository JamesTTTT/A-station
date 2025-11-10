// @flow

import { Link } from "@tanstack/react-router";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Button } from "@/components/ui";
import { Settings2, User } from "lucide-react";

export const DashboardNavbar = () => {
  const { selectedWorkspace } = useWorkspaceStore();

  return (
    <div className="flex items-center justify-between h-16 px-4 bg-card border-b border-border">
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
      <div className="flex items-center gap-2">
        <Button className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors">
          <span className="text-muted-foreground text-sm">
            <Settings2 />
          </span>
        </Button>
        <Button className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors">
          <span className="text-muted-foreground text-sm">
            <User />
          </span>
        </Button>
      </div>
    </div>
  );
};
