// @flow
import { useState } from "react";

type Tab = "logs" | "yaml" | "llm";

export const SecondaryToolbar = () => {
  const [activeTab, setActiveTab] = useState<Tab>("logs");

  return (
    <div className="flex flex-col w-80 h-full bg-card border-l border-border">
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
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "logs" && (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono text-muted-foreground p-2 rounded bg-muted/50">
              [INFO] Log output will appear here
            </div>
          </div>
        )}
        {activeTab === "yaml" && (
          <div className="text-xs font-mono text-foreground">
            <pre className="text-muted-foreground">
              # YAML content will appear here
            </pre>
          </div>
        )}
        {activeTab === "llm" && (
          <div className="text-sm text-muted-foreground">
            LLM output will appear here
          </div>
        )}
      </div>
    </div>
  );
};
