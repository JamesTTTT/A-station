import { useState } from "react";
import { Lock, Unlock, Save } from "lucide-react";

import { YamlCodeViewer } from "@/components";

import { useAutoSavePlaybook } from "@/hooks/useAutoSavePlaybook";

import { usePlaybookStore } from "@/stores/playbookStore";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function YamlTab() {
  const {
    playbooks,
    selectedPlaybookId,
    updateDraft,
    savePlaybook,
    saveStatus,
    hasUnsavedChanges,
  } = usePlaybookStore();
  const token = useAuthStore((state) => state.token);
  const selectedPlaybook = playbooks.find((pb) => pb.id === selectedPlaybookId);
  const yamlContent = selectedPlaybook?.yaml_content ?? "";
  const { selectedWorkspace } = useWorkspaceStore();
  const [readOnly, setReadOnly] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  useAutoSavePlaybook({
    enabled: autoSaveEnabled && !readOnly,
    debounceMs: 2000,
  });

  const handleManualSave = async () => {
    if (token && selectedWorkspace?.id) {
      await savePlaybook(token, selectedWorkspace.id);
    }
  };

  const toggleEditMode = async () => {
    if (!readOnly) {
      if (hasUnsavedChanges()) {
        await handleManualSave();
      }
      setAutoSaveEnabled(false);
    }
    setReadOnly(!readOnly);

    return (
      <div className={"h-full w-full"}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {readOnly ? (
                <Lock className="inline-block w-3 h-3 ml-1" />
              ) : (
                <Unlock className="inline-block w-3 h-3 ml-1" />
              )}
            </span>
            {saveStatus === "saving" && (
              <span className="text-xs text-blue-500">Saving...</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-destructive">Save failed</span>
            )}
            {!readOnly && hasUnsavedChanges() && !autoSaveEnabled && (
              <span className="text-xs text-amber-500">Unsaved changes</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!readOnly && (
              <>
                <label className="flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer hover:bg-accent rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span className="text-muted-foreground">Auto-save</span>
                </label>

                {!autoSaveEnabled && (
                  <button
                    onClick={handleManualSave}
                    disabled={!hasUnsavedChanges() || saveStatus === "saving"}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save changes"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              onClick={toggleEditMode}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors
            cursor-pointer"
              title={readOnly ? "Enable editing" : "Disable editing"}
            >
              {readOnly ? "Edit" : "Lock"}
            </button>
          </div>
        </div>

        <div>
          <YamlCodeViewer
            content={yamlContent}
            readOnly={readOnly}
            height="100%"
            onChange={(value) => {
              updateDraft(value);
            }}
          />
        </div>
      </div>
    );
  };
}
