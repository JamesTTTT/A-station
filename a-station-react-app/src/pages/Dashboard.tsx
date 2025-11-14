import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Canvas,
  DashboardNavbar,
  FileTree,
  SecondaryToolbar,
  Toolbar,
} from "@/components";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export const Dashboard = () => {
  const navigate = useNavigate({ from: "/dashboard" });
  const { selectedWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (!selectedWorkspace) {
      navigate({ to: "/workspaces/select", replace: true });
    }
  }, [selectedWorkspace, navigate]);

  if (!selectedWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground">Loading workspace...</div>
      </div>
    );
  }

  return (
    <main className={"flex flex-col w-screen h-screen  -mx-auto"}>
      <DashboardNavbar />
      <div className={"flex flex-row justify-between h-full"}>
        <Toolbar />
        <FileTree />
        <Canvas />
        <SecondaryToolbar />
      </div>
    </main>
  );
};
