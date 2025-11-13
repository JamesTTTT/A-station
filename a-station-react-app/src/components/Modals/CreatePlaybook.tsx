import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { createPlaybook } from "@/api/playbook-api";

interface CreatePlaybookProps {
  workspaceId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const CreatePlaybook = ({
  workspaceId,
  onSuccess,
  trigger,
}: CreatePlaybookProps) => {
  const { authState } = useAuth();
  const [open, setOpen] = useState(false);
  const [playbookName, setPlaybookName] = useState("");
  const [yamlContent, setYamlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!playbookName.trim()) {
      setError("Playbook name is required");
      return;
    }

    if (!yamlContent.trim()) {
      setError("YAML content is required");
      return;
    }

    if (!authState.token) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createPlaybook(
        workspaceId,
        {
          name: playbookName.trim(),
          yaml_content: yamlContent.trim(),
        },
        authState.token
      );

      if (result.success) {
        setOpen(false);
        setPlaybookName("");
        setYamlContent("");
        setError(null);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error?.message || result.error?.detail || "Failed to create playbook");
      }
    } catch (err) {
      console.error("Error creating playbook:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setPlaybookName("");
      setYamlContent("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Create Playbook</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create new playbook</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="playbook-name">Playbook name</Label>
              <Input
                id="playbook-name"
                name="name"
                value={playbookName}
                onChange={(e) => setPlaybookName(e.target.value)}
                placeholder="My Ansible Playbook"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="yaml-content">YAML content</Label>
              <Textarea
                id="yaml-content"
                name="yaml_content"
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                placeholder="---&#10;- name: Example playbook&#10;  hosts: all&#10;  tasks:&#10;    - name: Example task&#10;      debug:&#10;        msg: 'Hello World'"
                disabled={loading}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};