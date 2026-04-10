import type { PlaybookFrameNodeData } from "@/types/nodes";

interface PlaybookFrameNodeProps {
  data: PlaybookFrameNodeData;
}

// A backdrop "container" rendered behind a playbook's nodes so multiple
// playbooks on the canvas read as distinct units. Inner clicks pass
// through to real nodes (which sit at higher z-index); clicking the
// frame body itself sets focus via Canvas onNodeClick.
export const PlaybookFrameNode = ({ data }: PlaybookFrameNodeProps) => {
  return (
    <div
      style={{ width: data.width, height: data.height }}
      className="relative rounded-xl border-2 border-dashed border-primary/40 bg-primary/5"
    >
      <div className="absolute -top-3 left-4 px-2 py-0.5 rounded bg-background text-xs font-semibold text-primary border border-primary/30 shadow-sm max-w-[90%] truncate">
        {data.playbookFile}
      </div>
    </div>
  );
};
