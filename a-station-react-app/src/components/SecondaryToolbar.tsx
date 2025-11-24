import { useState } from "react";
import { usePlaybookStore } from "@/stores/playbookStore.ts";
import { useJobStore } from "@/stores/jobStore";
import { YamlCodeViewer } from "@/components";
import { PlaybookLogs } from "./PlaybookLogs";
type Tab = "logs" | "yaml" | "llm";

export const SecondaryToolbar = () => {
  const [activeTab, setActiveTab] = useState<Tab>("yaml");
  const { playbooks, selectedPlaybookId } = usePlaybookStore();
  const { currentJob } = useJobStore();
  const selectedPlaybook = playbooks.find((pb) => pb.id === selectedPlaybookId);
  const yamlContent = selectedPlaybook?.yaml_content ?? "";

  return (
    <div className="flex flex-col w-96 h-full bg-card border-l border-border">
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
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden h-full">
        {activeTab === "logs" && <PlaybookLogs jobId={currentJob?.id} />}
        {activeTab === "yaml" && (
          <YamlCodeViewer content={yamlContent} readOnly={true} height="100%" />
        )}
        {activeTab === "llm" && (
          <div className="text-sm text-muted-foreground p-4">
            LLM output will appear here
          </div>
        )}
      </div>
    </div>
  );
};
