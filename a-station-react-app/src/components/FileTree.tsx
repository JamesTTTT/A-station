// @flow

export const FileTree = () => {
  return (
    <div className="flex flex-col w-64 h-full bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Playbooks</h2>
        <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-accent transition-colors">
          <span className="text-muted-foreground text-xs">+</span>
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Placeholder tree structure */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
            <span className="text-muted-foreground text-xs">▸</span>
            <span className="text-sm text-foreground">Group 1</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
            <span className="text-muted-foreground text-xs">▸</span>
            <span className="text-sm text-foreground">Group 2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
