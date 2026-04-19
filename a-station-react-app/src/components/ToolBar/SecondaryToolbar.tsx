import { useState } from "react";
import { ChevronRight, PanelRightOpen } from "lucide-react";
import { PlaybookLogs } from "../PlaybookLogs.tsx";
import { YamlTab } from "@/components/ToolBar/YamlTab.tsx";
import { useJobStore } from "@/stores/jobStore.ts";

type Tab = "logs" | "yaml" | "llm";

interface SecondaryToolbarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SecondaryToolbar = ({
  collapsed = false,
  onToggleCollapse,
}: SecondaryToolbarProps) => {
  const { currentJob } = useJobStore();
  const [activeTab, setActiveTab] = useState<Tab>("yaml");

  // Collapsed rail: mirror of the FileTree collapsed state.
  if (collapsed) {
    return (
      <div className="flex flex-col items-center h-full w-full bg-card border-l border-border py-2 gap-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Expand tools panel"
          aria-label="Expand tools panel"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
        <div
          className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground select-none"
          style={{ writingMode: "vertical-rl" }}
        >
          Tools
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-card border-l border-border min-w-0">
      {/* Tab Headers */}
      <div className="flex items-center border-b border-border">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "logs"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab("yaml")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "yaml"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          YAML
        </button>
        <button
          onClick={() => setActiveTab("llm")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "llm"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          LLM
        </button>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-9 h-full px-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-l border-border"
            title="Collapse tools panel"
            aria-label="Collapse tools panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === "logs" && <PlaybookLogs jobId={currentJob?.id} />}
        {activeTab === "yaml" && <YamlTab />}
        {activeTab === "llm" && (
          <div className="text-sm text-muted-foreground p-4">
            LLM output will appear here
          </div>
        )}
      </div>
    </div>
  );
};
