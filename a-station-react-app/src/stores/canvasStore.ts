import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { toast } from "sonner";
import {
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import type { OnNodesChange, OnEdgesChange, OnConnect } from "@xyflow/react";
import type {
  TaskNodeData,
  HeadNodeData,
  TaskGroupNodeData,
  RoleNodeData,
  ExecutionState,
  AnyNodeData,
  ViewMode,
  ParseResult,
  TaskGroupType,
} from "@/types/nodes";
import { playbookParser } from "@/services/yaml-parser";

// Layout constants
const HEADNODE_HEIGHT = 200;
const TASK_HEIGHT = 100;
const TASK_WIDTH = 260;
const GROUP_HEADER_HEIGHT = 60;
const COLUMN_GAP = 40;
const PLAY_GAP = 80;

const GROUP_ORDER: TaskGroupType[] = [
  "pre_tasks",
  "roles",
  "tasks",
  "post_tasks",
  "handlers",
];

interface CanvasStore {
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
  viewMode: ViewMode;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  loadFromYAML: (
    yamlContent: string,
    playbookFile?: string,
    playbookId?: string,
  ) => void;
  loadMultiplePlaybooks: (
    playbooks: Array<{ content: string; filename: string; id: string }>,
  ) => void;

  setViewMode: (mode: ViewMode) => void;
  toggleHeadNodeExpansion: (headNodeId: string) => void;

  updateTaskState: (taskId: string, state: ExecutionState) => void;
  updateTaskStateByName: (taskName: string, state: ExecutionState) => void;
  updateHeadNodeStateByPlayName: (
    playName: string,
    state: ExecutionState,
  ) => void;
  resetAllTaskStates: () => void;
  clearCanvas: () => void;
}

// ─── Layout helpers ───

function buildFlatLayout(result: ParseResult): {
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<AnyNodeData>[] = [];
  const edges: Edge[] = [];

  let currentX = 300;

  for (const headNode of result.headNodes) {
    let currentY = 100;

    // HeadNode
    nodes.push({
      id: headNode.id,
      type: "headNode",
      position: { x: currentX, y: currentY },
      data: {
        ...headNode,
        state: "idle" as ExecutionState,
        isExpanded: false,
        taskGroupSummary: buildGroupSummary(result, headNode.id),
        type: "headNode" as const,
      },
    });
    currentY += HEADNODE_HEIGHT;

    // Tasks for this play (all groups flattened in order)
    const playTasks = result.tasks.filter(
      (t) => t.parentHeadNodeId === headNode.id,
    );
    const playRoles = result.roles.filter(
      (r) => r.parentHeadNodeId === headNode.id,
    );

    // Interleave roles and tasks in execution order
    const allItems: Array<{ type: "task" | "role"; order: number; data: any }> =
      [];
    for (const t of playTasks) {
      allItems.push({ type: "task", order: t.order, data: t });
    }
    for (const r of playRoles) {
      allItems.push({ type: "role", order: r.order, data: r });
    }
    allItems.sort((a, b) => a.order - b.order);

    let prevId = headNode.id;
    for (const item of allItems) {
      if (item.type === "task") {
        const task = item.data;
        nodes.push({
          id: task.id,
          type: "simpleTask",
          position: { x: currentX + 45, y: currentY },
          data: {
            taskId: task.id,
            name: task.name,
            module: task.module,
            state: "idle" as ExecutionState,
            playName: task.playName,
            playbookFile: task.playbookFile,
            playbookId: task.playbookId,
            parentHeadNodeId: task.parentHeadNodeId,
            taskGroup: task.taskGroup,
            roleName: task.roleName,
            blockType: task.blockType,
            type: "simpleTask" as const,
          },
        });
        edges.push({
          id: `edge-${prevId}-${task.id}`,
          source: prevId,
          target: task.id,
          type: "smoothstep",
        });
        prevId = task.id;
        currentY += TASK_HEIGHT;
      } else {
        const role = item.data;
        nodes.push({
          id: role.id,
          type: "roleNode",
          position: { x: currentX + 45, y: currentY },
          data: {
            roleId: role.id,
            name: role.name,
            state: "idle" as ExecutionState,
            parentHeadNodeId: role.parentHeadNodeId,
            playbookFile: role.playbookFile,
            playbookId: role.playbookId,
            vars: role.vars,
            tags: role.tags,
            when: role.when,
            type: "roleNode" as const,
          },
        });
        edges.push({
          id: `edge-${prevId}-${role.id}`,
          source: prevId,
          target: role.id,
          type: "smoothstep",
        });
        prevId = role.id;
        currentY += TASK_HEIGHT;
      }
    }

    currentX += 500;
  }

  return { nodes, edges };
}

function buildGroupedLayout(result: ParseResult): {
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<AnyNodeData>[] = [];
  const edges: Edge[] = [];

  let playStartX = 300;

  for (const headNode of result.headNodes) {
    const playGroups = result.taskGroups.filter(
      (g) => g.parentHeadNodeId === headNode.id,
    );
    const playTasks = result.tasks.filter(
      (t) => t.parentHeadNodeId === headNode.id,
    );
    const playRoles = result.roles.filter(
      (r) => r.parentHeadNodeId === headNode.id,
    );

    // Calculate total columns needed for this play
    const activeGroups = GROUP_ORDER.filter((gt) =>
      playGroups.some((g) => g.type === gt),
    );
    const totalWidth =
      activeGroups.length * (TASK_WIDTH + COLUMN_GAP) - COLUMN_GAP;

    // Center the HeadNode above the columns
    const headX = playStartX + Math.max(0, (totalWidth - 350) / 2);
    const headY = 100;

    nodes.push({
      id: headNode.id,
      type: "headNode",
      position: { x: headX, y: headY },
      data: {
        ...headNode,
        state: "idle" as ExecutionState,
        isExpanded: false,
        taskGroupSummary: buildGroupSummary(result, headNode.id),
        type: "headNode" as const,
      },
    });

    let colX = playStartX;
    const groupStartY = headY + HEADNODE_HEIGHT;

    for (const groupType of activeGroups) {
      const group = playGroups.find((g) => g.type === groupType);
      if (!group) continue;

      // TaskGroup header node
      nodes.push({
        id: group.id,
        type: "taskGroup",
        position: { x: colX, y: groupStartY },
        data: {
          groupId: group.id,
          groupType: group.type,
          label: group.label,
          parentHeadNodeId: headNode.id,
          state: "idle" as ExecutionState,
          type: "taskGroup" as const,
        },
      });

      // Edge from HeadNode to group header
      edges.push({
        id: `edge-${headNode.id}-${group.id}`,
        source: headNode.id,
        target: group.id,
        type: "smoothstep",
      });

      let itemY = groupStartY + GROUP_HEADER_HEIGHT;
      let prevItemId = group.id;

      if (groupType === "roles") {
        // Render role nodes in this column
        for (const role of playRoles) {
          nodes.push({
            id: role.id,
            type: "roleNode",
            position: { x: colX, y: itemY },
            data: {
              roleId: role.id,
              name: role.name,
              state: "idle" as ExecutionState,
              parentHeadNodeId: role.parentHeadNodeId,
              playbookFile: role.playbookFile,
              playbookId: role.playbookId,
              vars: role.vars,
              tags: role.tags,
              when: role.when,
              type: "roleNode" as const,
            },
          });
          edges.push({
            id: `edge-${prevItemId}-${role.id}`,
            source: prevItemId,
            target: role.id,
            type: "smoothstep",
          });
          prevItemId = role.id;
          itemY += TASK_HEIGHT;
        }
      } else {
        // Render task nodes in this column
        const groupTasks = playTasks.filter(
          (t) => t.taskGroup === groupType,
        );
        for (const task of groupTasks) {
          nodes.push({
            id: task.id,
            type: "simpleTask",
            position: { x: colX, y: itemY },
            data: {
              taskId: task.id,
              name: task.name,
              module: task.module,
              state: "idle" as ExecutionState,
              playName: task.playName,
              playbookFile: task.playbookFile,
              playbookId: task.playbookId,
              parentHeadNodeId: task.parentHeadNodeId,
              taskGroup: task.taskGroup,
              roleName: task.roleName,
              blockType: task.blockType,
              type: "simpleTask" as const,
            },
          });
          edges.push({
            id: `edge-${prevItemId}-${task.id}`,
            source: prevItemId,
            target: task.id,
            type: "smoothstep",
          });
          prevItemId = task.id;
          itemY += TASK_HEIGHT;
        }
      }

      colX += TASK_WIDTH + COLUMN_GAP;
    }

    playStartX += totalWidth + PLAY_GAP + 100;
  }

  return { nodes, edges };
}

// Approximate rendered size of each node type — used for frame bbox math.
function nodeSize(type: string): { w: number; h: number } {
  switch (type) {
    case "headNode":
      return { w: 380, h: 160 };
    case "taskGroup":
      return { w: 280, h: 60 };
    case "simpleTask":
    case "roleNode":
      return { w: 280, h: 100 };
    default:
      return { w: 280, h: 100 };
  }
}

// Walks the laid-out nodes, groups them by playbookId, and prepends
// a playbookFrame node sized to the bounding box of each group. Frame
// nodes have zIndex -1 so real nodes sit on top and remain clickable.
function withPlaybookFrames(
  layoutNodes: Node<AnyNodeData>[],
): Node<AnyNodeData>[] {
  type Box = {
    file: string;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  const boxes = new Map<string, Box>();

  // First pass: build a map of headNodeId → playbookId so taskGroup nodes
  // (which only carry parentHeadNodeId) can be attributed correctly.
  const headToPlaybook = new Map<string, { id: string; file: string }>();
  for (const n of layoutNodes) {
    if (n.data.type === "headNode") {
      headToPlaybook.set(n.id, {
        id: n.data.playbookId,
        file: n.data.playbookFile,
      });
    }
  }

  for (const n of layoutNodes) {
    let pid: string | undefined;
    let pfile: string | undefined;

    if (
      n.data.type === "headNode" ||
      n.data.type === "simpleTask" ||
      n.data.type === "roleNode"
    ) {
      pid = n.data.playbookId;
      pfile = n.data.playbookFile;
    } else if (n.data.type === "taskGroup") {
      const parent = headToPlaybook.get(n.data.parentHeadNodeId);
      if (parent) {
        pid = parent.id;
        pfile = parent.file;
      }
    }

    if (!pid) continue;

    const { w, h } = nodeSize(n.data.type);
    const x1 = n.position.x;
    const y1 = n.position.y;
    const x2 = x1 + w;
    const y2 = y1 + h;

    const existing = boxes.get(pid);
    if (existing) {
      existing.minX = Math.min(existing.minX, x1);
      existing.minY = Math.min(existing.minY, y1);
      existing.maxX = Math.max(existing.maxX, x2);
      existing.maxY = Math.max(existing.maxY, y2);
    } else {
      boxes.set(pid, {
        file: pfile ?? pid,
        minX: x1,
        minY: y1,
        maxX: x2,
        maxY: y2,
      });
    }
  }

  const PAD = 36;
  const TITLE_PAD = 24;

  const frames: Node<AnyNodeData>[] = [];
  for (const [pid, box] of boxes) {
    const x = box.minX - PAD;
    const y = box.minY - PAD - TITLE_PAD;
    const width = box.maxX - box.minX + PAD * 2;
    const height = box.maxY - box.minY + PAD * 2 + TITLE_PAD;
    frames.push({
      id: `frame-${pid}`,
      type: "playbookFrame",
      position: { x, y },
      data: {
        type: "playbookFrame",
        playbookId: pid,
        playbookFile: box.file,
        width,
        height,
        state: "idle",
      },
      draggable: false,
      selectable: false,
      zIndex: -1,
    });
  }

  return [...frames, ...layoutNodes];
}

function buildGroupSummary(result: ParseResult, headNodeId: string): string {
  const groups = result.taskGroups.filter(
    (g) => g.parentHeadNodeId === headNodeId,
  );
  const tasks = result.tasks.filter(
    (t) => t.parentHeadNodeId === headNodeId,
  );
  const roles = result.roles.filter(
    (r) => r.parentHeadNodeId === headNodeId,
  );

  const parts: string[] = [];
  if (tasks.length > 0) parts.push(`${tasks.length} tasks`);
  if (roles.length > 0) parts.push(`${roles.length} roles`);
  if (groups.length > 0) parts.push(`${groups.length} groups`);
  return parts.join(", ");
}

// ─── Store ───

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      viewMode: "flat" as ViewMode,

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as Node<AnyNodeData>[],
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection) => {
        set({
          edges: [...get().edges, { ...connection, id: `edge-${Date.now()}` }],
        });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      loadFromYAML: (
        yamlContent,
        playbookFile = "playbook.yml",
        playbookId = "default",
      ) => {
        const result = playbookParser.parse(
          yamlContent,
          playbookFile,
          playbookId,
        );

        if (!result.success) {
          toast.error(`Failed to parse ${playbookFile}`, {
            description: result.error ?? "Unknown parser error",
          });
          set({ nodes: [], edges: [] });
          return;
        }

        const layout =
          get().viewMode === "grouped"
            ? buildGroupedLayout(result)
            : buildFlatLayout(result);

        set({ nodes: withPlaybookFrames(layout.nodes), edges: layout.edges });
      },

      loadMultiplePlaybooks: (playbooks) => {
        const result = playbookParser.parseMultiple(playbooks);

        if (!result.success) {
          toast.error("Failed to parse playbooks", {
            description: result.error ?? "Unknown parser error",
          });
          set({ nodes: [], edges: [] });
          return;
        }

        if (result.partialErrors && result.partialErrors.length > 0) {
          const n = result.partialErrors.length;
          const first = result.partialErrors[0];
          toast.warning(
            `${n} playbook${n === 1 ? "" : "s"} failed to parse`,
            {
              description: `${first.filename}: ${first.error}${
                n > 1 ? ` (+${n - 1} more)` : ""
              }`,
            },
          );
        }

        const layout =
          get().viewMode === "grouped"
            ? buildGroupedLayout(result)
            : buildFlatLayout(result);

        set({ nodes: withPlaybookFrames(layout.nodes), edges: layout.edges });
      },

      toggleHeadNodeExpansion: (headNodeId) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === headNodeId && node.data.type === "headNode"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    isExpanded: !(node.data as HeadNodeData).isExpanded,
                  } as HeadNodeData,
                }
              : node,
          ),
        });
      },

      updateTaskState: (taskId, state) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === taskId
              ? { ...node, data: { ...node.data, state } }
              : node,
          ),
        });
      },

      updateTaskStateByName: (taskName, state) => {
        set({
          nodes: get().nodes.map((node) => {
            if ("name" in node.data && node.data.name === taskName) {
              return { ...node, data: { ...node.data, state } };
            }
            return node;
          }),
        });
      },

      updateHeadNodeStateByPlayName: (playName, state) => {
        set({
          nodes: get().nodes.map((node) =>
            node.data.type === "headNode" &&
            (node.data as HeadNodeData).playName === playName
              ? { ...node, data: { ...node.data, state } }
              : node,
          ),
        });
      },

      resetAllTaskStates: () => {
        set({
          nodes: get().nodes.map((node) => ({
            ...node,
            data: { ...node.data, state: "idle" },
          })),
        });
      },

      clearCanvas: () => {
        set({ nodes: [], edges: [] });
      },
    }),
    {
      name: "canvas-storage",
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    },
  ),
  ),
);
