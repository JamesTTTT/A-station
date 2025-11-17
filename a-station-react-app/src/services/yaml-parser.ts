import yaml from "js-yaml";
import type {PlaybookTask, ParseResult, HeadNode} from "@/types/nodes";

export class PlaybookParser {
  // Public method for backward compatibility (single playbook)
  public parse(
    yamlContent: string,
    playbookFile: string = "playbook.yml",
    playbookId: string = "default"
  ): ParseResult {
    return this.parseSingle(yamlContent, playbookFile, playbookId, 0);
  }

  private parseSingle(
    yamlContent: string,
    playbookFile: string,
    playbookId: string,
    startingOrder: number
  ): ParseResult {
    if (!yamlContent || yamlContent.trim() === "") {
      return {success: true, headNodes: [], tasks: []};
    }

    try {
      const parsed = yaml.load(yamlContent) as any;

      if (!Array.isArray(parsed)) {
        return {
          success: false,
          headNodes: [],
          tasks: [],
          error: "Playbook must be a list of plays",
        };
      }

      const headNodes: HeadNode[] = [];
      const tasks: PlaybookTask[] = [];
      let globalOrder = startingOrder;

      for (let playIndex = 0; playIndex < parsed.length; playIndex++) {
        const play = parsed[playIndex];

        // Create HeadNode for this play
        const headNodeId = `head-${playbookId}-play${playIndex}`;
        const headNode: HeadNode = {
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
        };

        headNodes.push(headNode);
        globalOrder++;

        // Extract tasks for this play
        const playTasks = this.extractPlayTasks(
          play,
          playbookId,
          playbookFile,
          headNodeId,
          play.name || "Unnamed Play",
          globalOrder
        );

        tasks.push(...playTasks);
        globalOrder += playTasks.length;
      }

      return {
        success: true,
        headNodes,
        tasks,
      };
    } catch (error) {
      return {
        success: false,
        headNodes: [],
        tasks: [],
        error: error instanceof Error ? error.message : "Failed to parse YAML",
      };
    }
  }

  public parseMultiple(
    playbooks: Array<{ content: string; filename: string; id: string }>
  ): ParseResult {
    const allHeadNodes: HeadNode[] = [];
    const allTasks: PlaybookTask[] = [];
    let globalOrder = 0;

    for (const playbook of playbooks) {
      const result = this.parseSingle(
        playbook.content,
        playbook.filename,
        playbook.id,
        globalOrder
      );

      if (!result.success) {
        return result; // Early return on error
      }

      allHeadNodes.push(...result.headNodes);
      allTasks.push(...result.tasks);
      globalOrder = allTasks.length; // Update global order
    }

    return {
      success: true,
      headNodes: allHeadNodes,
      tasks: allTasks,
    };
  }

  private extractPlayTasks(
    play: any,
    playbookId: string,
    playbookFile: string,
    parentHeadNodeId: string,
    playName: string,
    startingOrder: number
  ): PlaybookTask[] {
    const tasks: PlaybookTask[] = [];
    let order = startingOrder;

    if (play.tasks && Array.isArray(play.tasks)) {
      for (const task of play.tasks) {
        const extracted = this.extractTask(
          task,
          order,
          playName,
          playbookId,
          playbookFile,
          parentHeadNodeId
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
    parentHeadNodeId: string
  ): PlaybookTask | null {
    try {
      const taskName = task.name || this.deriveTaskName(task);
      const module = this.extractModule(task);
      const id = `task-${order}`;

      return {
        id,
        name: taskName,
        module,
        order,
        playName,
        playbookId,
        playbookFile,
        parentHeadNodeId,
      };
    } catch (error) {
      console.warn("Failed to parse task:", error);
      return null;
    }
  }

  private deriveTaskName(task: any): string {
    const module = this.extractModule(task);
    return module ? `${module} task` : "Unnamed task";
  }

  private extractModule(task: any): string {
    // Meta keys to ignore
    const metaKeys = [
      "name",
      "when",
      "with_items",
      "loop",
      "register",
      "ignore_errors",
      "changed_when",
      "failed_when",
      "tags",
      "become",
      "become_user",
      "delegate_to",
      "notify",
      "vars",
      "environment",
      "async",
      "poll",
      "retries",
      "delay",
      "until",
    ];

    const keys = Object.keys(task);
    for (const key of keys) {
      if (!metaKeys.includes(key)) {
        return key;
      }
    }

    return "unknown";
  }
}

export const playbookParser = new PlaybookParser();
