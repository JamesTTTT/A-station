import { useState } from "react";
import { PlaybookLogs } from "../PlaybookLogs.tsx";
import { YamlTab } from "@/components/ToolBar/YamlTab.tsx";
import { useJobStore } from "@/stores/jobStore.ts";

type Tab = "logs" | "yaml" | "llm";

export const SecondaryToolbar = () => {
  const { currentJob } = useJobStore();
  const [activeTab, setActiveTab] = useState<Tab>("yaml");

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
