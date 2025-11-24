import { useEffect, useRef, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { useJobStore } from "@/stores/jobStore.ts";

interface PlaybookLogsProps {
  jobId?: string;
}

export const PlaybookLogs = ({ jobId }: PlaybookLogsProps) => {
  const { logs, isRunning, error } = useJobStore();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleClear = () => {
    setCopySuccess(false);
    useJobStore.getState().clearLogs();
  };

  const handleCopy = async () => {
    const text = logs.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy logs:", err);
    }
  };

  const getLogLineStyle = (line: string): string => {
    // Ansible-specific log patterns
    if (line.startsWith("PLAY [")) {
      return "text-[oklch(0.55_0.25_264)]"; // Primary purple
    }
    if (line.startsWith("TASK [")) {
      return "text-[oklch(0.5_0.2_264)]"; // Lighter purple
    }
    if (line.startsWith("PLAY RECAP")) {
      return "text-[oklch(0.55_0.25_264)] font-semibold"; // Primary purple, bold
    }
    if (line.includes("ok:") || line.includes("ok=")) {
      return "text-[oklch(0.5_0.15_145)]"; // Green for success
    }
    if (line.includes("changed:") || line.includes("changed=")) {
      return "text-[oklch(0.828_0.189_84.429)]"; // Yellow/amber for changed
    }
    if (
      line.includes("failed:") ||
      line.includes("failed=") ||
      line.includes("FAILED")
    ) {
      return "text-destructive"; // Red for failures
    }
    if (line.includes("skipping:") || line.includes("skipped=")) {
      return "text-muted-foreground"; // Muted for skipped
    }
    if (line.includes("WARN") || line.includes("WARNING")) {
      return "text-[oklch(0.769_0.188_70.08)]"; // Orange for warnings
    }
    if (line.startsWith("fatal:")) {
      return "text-destructive font-semibold"; // Bold red for fatal
    }
    if (line.trim().startsWith("---") || line.trim().startsWith("...")) {
      return "text-muted-foreground"; // Muted for YAML separators
    }

    return "text-foreground"; // Default
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {isRunning ? (
              <>
                <span className="inline-block w-2 h-2 mr-1 bg-[oklch(0.5_0.15_145)] rounded-full animate-pulse" />
                Running
              </>
            ) : logs.length > 0 ? (
              "Completed"
            ) : (
              "No logs"
            )}
          </span>
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({logs.length} lines)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={logs.length === 0}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy logs"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            disabled={logs.length === 0}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs container */}
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-card p-3">
        {error && (
          <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive font-mono">
            Error: {error}
          </div>
        )}

        {logs.length === 0 && !error ? (
          <div className="text-xs text-muted-foreground font-mono">
            {jobId
              ? "Waiting for log output..."
              : "No job selected. Run a playbook to see logs."}
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((line, index) => (
              <div
                key={index}
                className={`text-xs font-mono leading-relaxed ${getLogLineStyle(
                  line,
                )}`}
              >
                {line}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Copy success notification */}
      {copySuccess && (
        <div className="absolute top-12 right-4 px-3 py-2 bg-primary text-primary-foreground text-xs rounded shadow-lg animate-fade-in">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};
