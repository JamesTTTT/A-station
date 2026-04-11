import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { Workspace } from "@/types/workspace";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateWorkspace } from "@/components/Modals/CreateWorkspace.tsx";
import { Button } from "@/components";
import { Plus } from "lucide-react";

export const WorkspaceSelect = () => {
  const navigate = useNavigate({ from: "/workspaces/select" });
  const { setSelectedWorkspace, fetchWorkspaces, workspaces, loading, error } =
    useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSelectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    navigate({ to: "/dashboard", replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground">Loading workspaces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className={"flex justify-between"}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Select a Workspace
            </h1>
            <p className="text-muted-foreground">
              Choose a workspace to continue working
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreateWorkspace
              onSuccess={fetchWorkspaces}
              trigger={
                <Button>
                  <Plus />
                  Create
                </Button>
              }
            />
          </div>
        </div>

        {workspaces.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Workspaces Found</CardTitle>
              <CardDescription>
                You don't have access to any workspaces yet. Contact your
                administrator or create a new workspace.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.id}
                className="hover:border-primary transition-colors cursor-pointer"
                onClick={() => handleSelectWorkspace(workspace)}
              >
                <CardHeader>
                  <CardTitle>{workspace.name}</CardTitle>
                  <CardDescription>
                    Created{" "}
                    {new Date(workspace.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
