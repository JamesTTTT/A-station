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
import { Label } from "@/components/ui/label";
import { useSourceStore } from "@/stores/sourceStore";

interface AddSourceProps {
  workspaceId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const AddSource = ({
  workspaceId,
  onSuccess,
  trigger,
}: AddSourceProps) => {
  const addSource = useSourceStore((state) => state.addSource);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<"git" | "local">("git");
  const [gitUrl, setGitUrl] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [localPath, setLocalPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (sourceType === "git" && !gitUrl.trim()) {
      setError("Git URL is required");
      return;
    }

    if (sourceType === "local" && !localPath.trim()) {
      setError("Local path is required");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await addSource(workspaceId, {
      name: name.trim(),
      source_type: sourceType,
      ...(sourceType === "git"
        ? { git_url: gitUrl.trim(), git_branch: gitBranch.trim() || "main" }
        : { local_path: localPath.trim() }),
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      resetForm();
      onSuccess?.();
    } else {
      setError(result.error || "Failed to add source");
    }
  };

  const resetForm = () => {
    setName("");
    setSourceType("git");
    setGitUrl("");
    setGitBranch("main");
    setLocalPath("");
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Add Source</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Project Source</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="source-name">Name</Label>
              <Input
                id="source-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Ansible Repo"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-3">
              <Label>Source Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="source-type"
                    value="git"
                    checked={sourceType === "git"}
                    onChange={() => setSourceType("git")}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Git Repository</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="source-type"
                    value="local"
                    checked={sourceType === "local"}
                    onChange={() => setSourceType("local")}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Local Path</span>
                </label>
              </div>
            </div>

            {sourceType === "git" ? (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="git-url">Repository URL</Label>
                  <Input
                    id="git-url"
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    placeholder="https://github.com/org/ansible-repo.git"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="git-branch">Branch</Label>
                  <Input
                    id="git-branch"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    placeholder="main"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-3">
                <Label htmlFor="local-path">Directory Path</Label>
                <Input
                  id="local-path"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="/path/to/ansible/project"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
