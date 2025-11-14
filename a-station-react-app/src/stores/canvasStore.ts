import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import type { OnNodesChange, OnEdgesChange, OnConnect } from "@xyflow/react";
import type { TaskNodeData, ExecutionState } from "@/types/nodes";
import { playbookParser } from "@/services/yaml-parser";

interface CanvasStore {
  // State
  nodes: Node<TaskNodeData>[];
  edges: Edge[];

  // React Flow handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Playbook loading
  loadFromYAML: (yamlContent: string) => void;

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
          edges: [...get().edges, { ...connection, id: `edge-${Date.now()}` }],
        });
      },

      loadFromYAML: (yamlContent) => {
        const result = playbookParser.parse(yamlContent);

        if (!result.success) {
          console.error("Failed to parse YAML:", result.error);
          set({ nodes: [], edges: [] });
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
            playName: task.playName,
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

        set({ nodes, edges });
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
          nodes: get().nodes.map((node) =>
            node.data.name === taskName
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
          data: { ...node.data, state: "idle" },
        })),
        edges: state.edges,
      }),
    },
  ),
);
