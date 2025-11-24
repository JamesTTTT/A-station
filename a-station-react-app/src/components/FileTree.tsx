import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Button } from "@/components/ui";
import { usePlaybookStore } from "@/stores/playbookStore.ts";
import { LucideNotepadText } from "lucide-react";
import { useAuthStore } from "@/stores/authStore.ts";
import { useEffect } from "react";
import { DeletePlaybook, CreatePlaybook } from "@/components";

export const FileTree = () => {
  const { selectedWorkspace } = useWorkspaceStore();
  const { playbooks, fetchPlaybooks, selectPlaybook, error, loading } =
    usePlaybookStore();

  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!selectedWorkspace || !token) return;
    fetchPlaybooks(selectedWorkspace.id, token);
  }, [selectedWorkspace?.id, token, fetchPlaybooks]);

  if (!selectedWorkspace) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground">Loading playbooks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center flex-wrap">
        <div className="text-destructive text-xs">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-64 h-full bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Playbooks</h2>
        <CreatePlaybook
          onSuccess={() => fetchPlaybooks(selectedWorkspace.id, token!)}
          workspaceId={selectedWorkspace.id}
          trigger={
            <Button className="flex items-center justify-center w-6 h-6 rounded bg-transparent hover:bg-accent transition-colors">
              <span className="text-muted-foreground text-xs">+</span>
            </Button>
          }
        />
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {playbooks.length === 0 ? (
            <p className={"text-sm"}>Playbooks empty...</p>
          ) : (
            <div>
              {playbooks.map((playbook) => (
                <div
                  key={playbook.id}
                  className="group flex w-full items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer relative"
                  onClick={() => {
                    selectPlaybook(playbook.id);
                  }}
                >
                  <span className="text-muted-foreground text-xs">
                    <LucideNotepadText />
                  </span>
                  <span className="text-sm text-foreground flex-1">
                    {playbook.name}
                  </span>
                  <DeletePlaybook
                    workspaceId={selectedWorkspace.id}
                    playbookId={playbook.id}
                    playbookName={playbook.name}
                    onSuccess={() => fetchPlaybooks(selectedWorkspace.id, token!)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
