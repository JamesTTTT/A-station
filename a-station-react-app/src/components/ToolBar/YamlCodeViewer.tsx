import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { useMemo } from "react";

interface YamlCodeViewerProps {
  content: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  highlightedLines?: number[];
  executionState?: Map<number, "running" | "success" | "error">;
  height?: string;
}

export function YamlCodeViewer({
  content,
  onChange,
  readOnly = true,
  height = "100%",
}: YamlCodeViewerProps) {
  const extensions = useMemo(() => {
    const exts = [yaml()];
    return exts;
  }, []);

  const safeContent = typeof content === "string" ? content : "";

  return (
    <div className="h-full w-full overflow-scroll mb-20">
      <CodeMirror
        value={safeContent}
        height={height}
        extensions={extensions}
        onChange={onChange}
        editable={!readOnly}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: false,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightSelectionMatches: false,
          closeBracketsKeymap: true,
          searchKeymap: false,
          foldKeymap: true,
          completionKeymap: false,
          lintKeymap: false,
        }}
      />
    </div>
  );
}
