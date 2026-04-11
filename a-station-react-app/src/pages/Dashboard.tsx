import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { PanelImperativeHandle } from "react-resizable-panels";
import {
  Canvas,
  DashboardTopBar,
  FileTree,
  SecondaryToolbar,
  DashboardNavigation,
} from "@/components";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspaceStore";

// Threshold under which a panel is considered collapsed. Must sit between
// `collapsedSize` (3%) and `minSize` (14%) so we flip the flag exactly when
// the panel snaps to its collapsed state.
const COLLAPSED_THRESHOLD_PCT = 5;

export const Dashboard = () => {
  const navigate = useNavigate({ from: "/dashboard" });
  const { selectedWorkspace } = useWorkspaceStore();

  const fileTreePanelRef = useRef<PanelImperativeHandle>(null);
  const secondaryPanelRef = useRef<PanelImperativeHandle>(null);
  const [fileTreeCollapsed, setFileTreeCollapsed] = useState(false);
  const [secondaryCollapsed, setSecondaryCollapsed] = useState(false);

  const toggleFileTree = useCallback(() => {
    const panel = fileTreePanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }, []);

  const toggleSecondary = useCallback(() => {
    const panel = secondaryPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }, []);

  useEffect(() => {
    if (!selectedWorkspace) {
      navigate({ to: "/workspaces/select", replace: true });
    }
  }, [selectedWorkspace, navigate]);

  if (!selectedWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground">Loading workspace...</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col w-screen h-screen">
      <DashboardTopBar />
      <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
        <DashboardNavigation />
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel
            panelRef={fileTreePanelRef}
            id="file-tree"
            defaultSize="18%"
            minSize="14%"
            maxSize="36%"
            collapsible
            collapsedSize="3%"
            onResize={(size) =>
              setFileTreeCollapsed(size.asPercentage < COLLAPSED_THRESHOLD_PCT)
            }
          >
            <FileTree
              collapsed={fileTreeCollapsed}
              onToggleCollapse={toggleFileTree}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel id="canvas" defaultSize="60%" minSize="30%">
            <Canvas />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            panelRef={secondaryPanelRef}
            id="secondary-toolbar"
            defaultSize="22%"
            minSize="16%"
            maxSize="45%"
            collapsible
            collapsedSize="3%"
            onResize={(size) =>
              setSecondaryCollapsed(size.asPercentage < COLLAPSED_THRESHOLD_PCT)
            }
          >
            <SecondaryToolbar
              collapsed={secondaryCollapsed}
              onToggleCollapse={toggleSecondary}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
};
