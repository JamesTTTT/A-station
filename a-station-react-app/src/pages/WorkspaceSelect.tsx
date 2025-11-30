import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { Workspace, WorkspaceWithMembers } from "@/types/workspace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateWorkspace } from "@/components/Modals/CreateWorkspace.tsx";
import { Button } from "@/components";
import { Plus } from "lucide-react";

export const WorkspaceSelect = () => {
  const token = useAuthStore((state) => state.token);

  const navigate = useNavigate({ from: "/workspaces/select" });
  const { setSelectedWorkspace, fetchWorkspaces, workspaces, loading, error } =
    useWorkspaceStore();

  // TODO: Implement fetching workspace details with members
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [workspaceDetails, _setWorkspaceDetails] = useState<
    Map<string, WorkspaceWithMembers>
  >(new Map());

  useEffect(() => {
    if (token) {
      fetchWorkspaces(token);
    }
  }, [fetchWorkspaces, token]);

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
              onSuccess={() => token && fetchWorkspaces(token)}
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
            {workspaces.map((workspace) => {
              const details = workspaceDetails.get(workspace.id);
              const memberCount = details?.members.length || 0;
              const isOwner = details?.owner_id === token;

              return (
                <Card
                  key={workspace.id}
                  className="hover:border-primary transition-colors cursor-pointer"
                  onClick={() => handleSelectWorkspace(workspace)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {workspace.name}
                      {isOwner && (
                        <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                          Owner
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Created{" "}
                      {new Date(workspace.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-foreground mb-2">
                          Members ({memberCount})
                        </div>
                        {details && details.members.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {details.members.slice(0, 3).map((member) => (
                              <div
                                key={member.user_id}
                                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                                title={`${member.username} - ${member.role}`}
                              >
                                {member.username}
                              </div>
                            ))}
                            {details.members.length > 3 && (
                              <div className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                +{details.members.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Loading members...
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
