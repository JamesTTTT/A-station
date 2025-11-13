import { useWorkspaceStore } from "@/stores/workspaceStore";
import { CreatePlaybook } from "./Modals/CreatePlaybook";
import { Button } from "@/components/ui";
import { usePlaybookStore } from "@/stores/playbookStore.ts";
import { LucideNotepadText } from "lucide-react";
import { useEffect } from "react";

export const FileTree = () => {
  const { selectedWorkspace } = useWorkspaceStore();
  const { playbooks, fetchPlaybooks, selectPlaybook, error, loading } =
    usePlaybookStore();

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

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
          onSuccess={fetchPlaybooks}
          workspaceId={selectedWorkspace.id}
          trigger={
            <Button className="flex items-center justify-center w-6 h-6 rounded bg-transparent hover:bg-accent transition-colors">
              <span className="text-muted-foreground text-xs">+</span>
            </Button>
          }
        />
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-1">
          {playbooks.length === 0 ? (
            <p className={"text-sm"}>Playbooks empty...</p>
          ) : (
            <div>
              {playbooks.map((playbook) => (
                <button
                  onClick={() => {
                    selectPlaybook(playbook.id);
                  }}
                  key={playbook.id}
                  className="flex w-full items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                >
                  <span className="text-muted-foreground text-xs">
                    <LucideNotepadText />
                  </span>
                  <span className="text-sm text-foreground">
                    {playbook.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
