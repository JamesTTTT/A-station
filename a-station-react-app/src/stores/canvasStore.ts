import {create} from "zustand";
import {persist} from "zustand/middleware";
import {
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import type {OnNodesChange, OnEdgesChange, OnConnect} from "@xyflow/react";
import type {TaskNodeData, ExecutionState, HeadNodeData} from "@/types/nodes";
import {playbookParser} from "@/services/yaml-parser";

interface CanvasStore {
  // State
  nodes: Node<TaskNodeData | HeadNodeData>[];
  edges: Edge[];

  // React Flow handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Playbook loading
  loadFromYAML: (yamlContent: string, playbookFile?: string, playbookId?: string) => void;
  loadMultiplePlaybooks: (playbooks: Array<{ content: string, filename: string, id: string }>) => void;

  // HeadNode management
  toggleHeadNodeExpansion: (headNodeId: string) => void;

  // Execution state management
  updateTaskState: (taskId: string, state: ExecutionState) => void;
  updateTaskStateByName: (taskName: string, state: ExecutionState) => void;
  resetAllTaskStates: () => void;

  // Canvas management
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as Node<TaskNodeData>[],
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection) => {
        set({
          edges: [...get().edges, {...connection, id: `edge-${Date.now()}`}],
        });
      },

      loadFromYAML: (yamlContent, playbookFile = "playbook.yml", playbookId = "default") => {
        const result = playbookParser.parse(yamlContent, playbookFile, playbookId);

        if (!result.success) {
          console.error("Failed to parse YAML:", result.error);
          set({nodes: [], edges: []});
          return;
        }

        if (result.headNodes && result.headNodes.length > 0) {
          get().loadMultiplePlaybooks([{ content: yamlContent, filename: playbookFile, id: playbookId }]);
          return;
        }

        const nodes: Node<TaskNodeData>[] = result.tasks.map((task, index) => ({
          id: task.id,
          type: "simpleTask",
          position: {
            x: 300,
            y: 100 + index * 120,
          },
          data: {
            taskId: task.id,
            name: task.name,
            module: task.module,
            state: "idle",
            playName: task.playName || "",
            playbookFile: task.playbookFile,
            playbookId: task.playbookId,
            parentHeadNodeId: task.parentHeadNodeId,
            type: "simpleTask"
          },
        }));

        const edges: Edge[] = [];
        for (let i = 0; i < result.tasks.length - 1; i++) {
          edges.push({
            id: `edge-${i}`,
            source: result.tasks[i].id,
            target: result.tasks[i + 1].id,
            type: "smoothstep",
            animated: false,
          });
        }

        set({nodes, edges});
      },

      loadMultiplePlaybooks: (playbooks) => {
        const result = playbookParser.parseMultiple(playbooks);

        if (!result.success) {
          console.error("Failed to parse playbooks:", result.error);
          set({nodes: [], edges: []});
          return;
        }

        const nodes: Node<TaskNodeData | HeadNodeData>[] = [];
        const edges: Edge[] = [];

        let currentY = 100;
        const HEADNODE_HEIGHT = 200;  // Height when collapsed
        const TASK_HEIGHT = 120;
        const X_POSITION = 300;

        for (const headNode of result.headNodes) {
          nodes.push({
            id: headNode.id,
            type: "headNode",
            position: {x: X_POSITION, y: currentY},
            data: {
              ...headNode,
              isExpanded: false,
              type: "headNode" as const,
            },
          });

          currentY += HEADNODE_HEIGHT;

          const headNodeTasks = result.tasks.filter(
            (task) => task.parentHeadNodeId === headNode.id
          );

          for (const task of headNodeTasks) {
            nodes.push({
              id: task.id,
              type: "simpleTask",
              position: {x: X_POSITION + 50, y: currentY},
              data: {
                taskId: task.id,
                name: task.name,
                module: task.module,
                state: "idle",
                playName: task.playName,
                playbookFile: task.playbookFile,
                playbookId: task.playbookId,
                parentHeadNodeId: task.parentHeadNodeId,
                type: "simpleTask" as const,
              },
            });

            currentY += TASK_HEIGHT;
          }

          currentY += 100;
        }

        // Create Head edges
        for (const headNode of result.headNodes) {
          const headNodeTasks = result.tasks.filter(
            (task) => task.parentHeadNodeId === headNode.id
          );

          if (headNodeTasks.length > 0) {
            edges.push({
              id: `edge-${headNode.id}-to-first-task`,
              source: headNode.id,
              target: headNodeTasks[0].id,
              type: "smoothstep",
              animated: false,
            });
          }
        }

        // Create Task → Task edges
        for (let i = 0; i < result.tasks.length - 1; i++) {
          const currentTask = result.tasks[i];
          const nextTask = result.tasks[i + 1];

          if (currentTask.parentHeadNodeId === nextTask.parentHeadNodeId) {
            edges.push({
              id: `edge-task-${i}`,
              source: currentTask.id,
              target: nextTask.id,
              type: "smoothstep",
              animated: false,
            });
          }
        }
        // Connects head edges
        // for (let i = 0; i < result.headNodes.length - 1; i++) {
        //   const currentHead = result.headNodes[i];
        //   const nextHead = result.headNodes[i + 1];
        //
        //   edges.push({
        //     id: `edge-head-${i}`,
        //     source: currentHead.id,
        //     target: nextHead.id,
        //     type: "smoothstep",
        //     animated: true,  // Animate to show flow
        //     style: {stroke: "#22c55e", strokeWidth: 2},  // Green for dependencies
        //   });
        // }

        set({nodes, edges});
      },

      toggleHeadNodeExpansion: (headNodeId) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === headNodeId && node.data.type === "headNode"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    isExpanded: !(node.data as HeadNodeData).isExpanded
                  } as HeadNodeData
                }
              : node
          ),
        });
      },

      updateTaskState: (taskId, state) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === taskId
              ? {...node, data: {...node.data, state}}
              : node,
          ),
        });
      },
      updateTaskStateByName: (taskName, state) => {
        set({
          nodes: get().nodes.map((node) =>
            node.data.name === taskName
              ? {...node, data: {...node.data, state}}
              : node,
          ),
        });
      },

      resetAllTaskStates: () => {
        set({
          nodes: get().nodes.map((node) => ({
            ...node,
            data: {...node.data, state: "idle"},
          })),
        });
      },

      clearCanvas: () => {
        set({
          nodes: [],
          edges: [],
        });
      },
    }),
    {
      name: "canvas-storage",
      partialize: (state) => ({
        nodes: state.nodes.map((node) => ({
          ...node,
          data: {...node.data, state: "idle"},
        })),
        edges: state.edges,
      }),
    },
  ),
);
