import yaml from "js-yaml";
import type {
  PlaybookTask,
  ParseResult,
  HeadNode,
  TaskGroupType,
  TaskGroup,
  PlaybookRole,
} from "@/types/nodes";

const TASK_META_KEYS = new Set([
  "name",
  "when",
  "with_items",
  "with_dict",
  "with_fileglob",
  "with_first_found",
  "with_together",
  "with_subelements",
  "with_sequence",
  "with_random_choice",
  "with_nested",
  "with_indexed_items",
  "with_flattened",
  "loop",
  "loop_control",
  "register",
  "ignore_errors",
  "ignore_unreachable",
  "changed_when",
  "failed_when",
  "tags",
  "become",
  "become_user",
  "become_method",
  "become_flags",
  "delegate_to",
  "delegate_facts",
  "notify",
  "vars",
  "environment",
  "async",
  "poll",
  "retries",
  "delay",
  "until",
  "block",
  "rescue",
  "always",
  "listen",
  "no_log",
  "check_mode",
  "diff",
  "any_errors_fatal",
  "throttle",
  "run_once",
  "connection",
  "timeout",
  "collections",
  "module_defaults",
  "args",
  "debugger",
  "action",
  "local_action",
]);

const TASK_GROUP_DEFS: {
  key: string;
  type: TaskGroupType;
  label: string;
}[] = [
  { key: "pre_tasks", type: "pre_tasks", label: "Pre-Tasks" },
  { key: "roles", type: "roles", label: "Roles" },
  { key: "tasks", type: "tasks", label: "Tasks" },
  { key: "post_tasks", type: "post_tasks", label: "Post-Tasks" },
  { key: "handlers", type: "handlers", label: "Handlers" },
];

export class PlaybookParser {
  public parse(
    yamlContent: string,
    playbookFile: string = "playbook.yml",
    playbookId: string = "default",
  ): ParseResult {
    return this.parseSingle(yamlContent, playbookFile, playbookId, 0);
  }

  private parseSingle(
    yamlContent: string,
    playbookFile: string,
    playbookId: string,
    startingOrder: number,
  ): ParseResult {
    if (!yamlContent || yamlContent.trim() === "") {
      return {
        success: true,
        headNodes: [],
        tasks: [],
        taskGroups: [],
        roles: [],
      };
    }

    try {
      const parsed = yaml.load(yamlContent) as any;

      if (!Array.isArray(parsed)) {
        return {
          success: false,
          headNodes: [],
          tasks: [],
          taskGroups: [],
          roles: [],
          error: "Playbook must be a list of plays",
        };
      }

      const headNodes: HeadNode[] = [];
      const tasks: PlaybookTask[] = [];
      const taskGroups: TaskGroup[] = [];
      const roles: PlaybookRole[] = [];
      let globalOrder = startingOrder;

      for (let playIndex = 0; playIndex < parsed.length; playIndex++) {
        const play = parsed[playIndex];
        const headNodeId = `head-${playbookId}-play${playIndex}`;

        headNodes.push({
          id: headNodeId,
          playbookId,
          playbookFile,
          playName: play.name || "Unnamed Play",
          order: globalOrder,
          hosts: play.hosts,
          become: play.become,
          becomeUser: play.become_user,
          vars: play.vars,
          tags: play.tags,
          gather_facts: play.gather_facts,
        });
        globalOrder++;

        // Extract each task group in Ansible execution order
        for (const groupDef of TASK_GROUP_DEFS) {
          if (groupDef.key === "roles") {
            if (play.roles && Array.isArray(play.roles)) {
              const groupId = `group-${headNodeId}-roles`;
              taskGroups.push({
                id: groupId,
                type: "roles",
                parentHeadNodeId: headNodeId,
                label: groupDef.label,
              });

              for (let i = 0; i < play.roles.length; i++) {
                const roleDef = this.parseRoleDefinition(play.roles[i]);
                roles.push({
                  id: `role-${headNodeId}-${i}`,
                  name: roleDef.name,
                  parentHeadNodeId: headNodeId,
                  playbookId,
                  playbookFile,
                  order: globalOrder,
                  vars: roleDef.vars,
                  tags: roleDef.tags,
                  when: roleDef.when,
                });
                globalOrder++;
              }
            }
            continue;
          }

          const taskList = play[groupDef.key];
          if (!taskList || !Array.isArray(taskList)) continue;

          taskGroups.push({
            id: `group-${headNodeId}-${groupDef.type}`,
            type: groupDef.type,
            parentHeadNodeId: headNodeId,
            label: groupDef.label,
          });

          const extracted = this.extractTaskList(
            taskList,
            groupDef.type,
            playbookId,
            playbookFile,
            headNodeId,
            play.name || "Unnamed Play",
            globalOrder,
          );
          tasks.push(...extracted);
          globalOrder += extracted.length;
        }
      }

      return { success: true, headNodes, tasks, taskGroups, roles };
    } catch (error) {
      return {
        success: false,
        headNodes: [],
        tasks: [],
        taskGroups: [],
        roles: [],
        error: error instanceof Error ? error.message : "Failed to parse YAML",
      };
    }
  }

  public parseMultiple(
    playbooks: Array<{ content: string; filename: string; id: string }>,
  ): ParseResult {
    const all: ParseResult = {
      success: true,
      headNodes: [],
      tasks: [],
      taskGroups: [],
      roles: [],
    };
    let globalOrder = 0;

    for (const pb of playbooks) {
      const result = this.parseSingle(
        pb.content,
        pb.filename,
        pb.id,
        globalOrder,
      );
      if (!result.success) return result;

      all.headNodes.push(...result.headNodes);
      all.tasks.push(...result.tasks);
      all.taskGroups.push(...result.taskGroups);
      all.roles.push(...result.roles);
      globalOrder += result.tasks.length + result.roles.length;
    }

    return all;
  }

  // --- Task extraction ---

  private extractTaskList(
    taskList: any[],
    groupType: TaskGroupType,
    playbookId: string,
    playbookFile: string,
    parentHeadNodeId: string,
    playName: string,
    startingOrder: number,
  ): PlaybookTask[] {
    const tasks: PlaybookTask[] = [];
    let order = startingOrder;

    for (const task of taskList) {
      if (task.block) {
        const blockTasks = this.extractBlock(
          task,
          groupType,
          playbookId,
          playbookFile,
          parentHeadNodeId,
          playName,
          order,
        );
        tasks.push(...blockTasks);
        order += blockTasks.length;
        continue;
      }

      const extracted = this.extractTask(
        task,
        order,
        playName,
        playbookId,
        playbookFile,
        parentHeadNodeId,
        groupType,
      );
      if (extracted) {
        tasks.push(extracted);
        order++;
      }
    }

    return tasks;
  }

  private extractBlock(
    block: any,
    groupType: TaskGroupType,
    playbookId: string,
    playbookFile: string,
    parentHeadNodeId: string,
    playName: string,
    startingOrder: number,
  ): PlaybookTask[] {
    const tasks: PlaybookTask[] = [];
    let order = startingOrder;

    const sections: Array<{
      key: string;
      blockType: "block" | "rescue" | "always";
    }> = [
      { key: "block", blockType: "block" },
      { key: "rescue", blockType: "rescue" },
      { key: "always", blockType: "always" },
    ];

    for (const section of sections) {
      const list = block[section.key];
      if (!Array.isArray(list)) continue;

      for (const task of list) {
        const extracted = this.extractTask(
          task,
          order,
          playName,
          playbookId,
          playbookFile,
          parentHeadNodeId,
          groupType,
          undefined,
          section.blockType,
        );
        if (extracted) {
          tasks.push(extracted);
          order++;
        }
      }
    }

    return tasks;
  }

  private extractTask(
    task: any,
    order: number,
    playName: string,
    playbookId: string,
    playbookFile: string,
    parentHeadNodeId: string,
    taskGroup: TaskGroupType,
    roleName?: string,
    blockType?: "block" | "rescue" | "always",
  ): PlaybookTask | null {
    try {
      const taskName = task.name || this.deriveTaskName(task);
      const module = this.extractModule(task);
      const id = `task-${parentHeadNodeId}-${taskGroup}-${order}`;

      return {
        id,
        name: taskName,
        module,
        order,
        playName,
        playbookId,
        playbookFile,
        parentHeadNodeId,
        taskGroup,
        roleName,
        blockType,
      };
    } catch {
      return null;
    }
  }

  // --- Role parsing ---

  private parseRoleDefinition(role: any): {
    name: string;
    vars?: Record<string, any>;
    tags?: string[];
    when?: string;
  } {
    if (typeof role === "string") {
      return { name: role };
    }

    if (typeof role === "object" && role !== null) {
      const name = role.role || role.name || "Unknown role";
      const { role: _r, name: _n, tags, when, vars, ...inlineVars } = role;

      const allVars = { ...inlineVars, ...vars };
      const hasVars = Object.keys(allVars).length > 0;

      return {
        name,
        vars: hasVars ? allVars : undefined,
        tags: tags
          ? Array.isArray(tags)
            ? tags
            : [tags]
          : undefined,
        when: when ? String(when) : undefined,
      };
    }

    return { name: String(role) };
  }

  // --- Module detection ---

  private deriveTaskName(task: any): string {
    if (task.include_tasks) return `Include: ${task.include_tasks}`;
    if (task.import_tasks) return `Import: ${task.import_tasks}`;
    if (task.include_role) {
      const name =
        typeof task.include_role === "string"
          ? task.include_role
          : task.include_role.name;
      return `Include role: ${name}`;
    }
    if (task.import_role) {
      const name =
        typeof task.import_role === "string"
          ? task.import_role
          : task.import_role.name;
      return `Import role: ${name}`;
    }

    const module = this.extractModule(task);
    return module !== "unknown" ? `${module} task` : "Unnamed task";
  }

  private extractModule(task: any): string {
    for (const key of Object.keys(task)) {
      if (!TASK_META_KEYS.has(key)) {
        return key;
      }
    }
    return "unknown";
  }
}

export const playbookParser = new PlaybookParser();
