import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deletePlaybook } from "@/api/playbook-api.ts";
import { useAuthStore } from "@/stores/authStore";
import { Trash2 } from "lucide-react";

type DeletePlaybookProps = {
  workspaceId: string;
  playbookId: string;
  playbookName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
};

export const DeletePlaybook = ({
  workspaceId,
  playbookId,
  playbookName,
  onSuccess,
  trigger,
}: DeletePlaybookProps) => {
  const token = useAuthStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deletePlaybook(workspaceId, playbookId, token);

      if (result.success) {
        setOpen(false);
        setError(null);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(
          result.error?.message ||
            result.error?.detail ||
            "Failed to delete playbook",
        );
      }
    } catch (err) {
      console.error("Error deleting playbook:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
            title="Delete playbook"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Delete Playbook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {playbookName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="py-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" type="submit" disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
