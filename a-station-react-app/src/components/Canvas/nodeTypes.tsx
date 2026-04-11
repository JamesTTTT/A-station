import { SimpleTaskNode } from "./SimpleTaskNode";
import { HeadNode } from "./HeadNode";
import { TaskGroupNode } from "./TaskGroupNode";
import { RoleNode } from "./RoleNode";
import { PlaybookFrameNode } from "./PlaybookFrameNode";

export const nodeTypes = {
  simpleTask: SimpleTaskNode,
  headNode: HeadNode,
  taskGroup: TaskGroupNode,
  roleNode: RoleNode,
  playbookFrame: PlaybookFrameNode,
};
