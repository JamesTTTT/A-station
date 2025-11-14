import yaml from "js-yaml";
import type { PlaybookTask, ParseResult } from "@/types/nodes";

export class PlaybookParser {
  public parse(yamlContent: string): ParseResult {
    if (!yamlContent || yamlContent.trim() === "") {
      return {
        success: true,
        tasks: [],
      };
    }

    try {
      const parsed = yaml.load(yamlContent) as any;
      if (!Array.isArray(parsed)) {
        return {
          success: false,
          tasks: [],
          error: "Playbook must be a list of plays",
        };
      }

      const tasks: PlaybookTask[] = [];
      let globalOrder = 0;

      for (const play of parsed) {
        const playName = play.name || "Unnamed Play";
        if (play.tasks && Array.isArray(play.tasks)) {
          for (const task of play.tasks) {
            const extracted = this.extractTask(task, globalOrder, playName);
            if (extracted) {
              tasks.push(extracted);
              globalOrder++;
            }
          }
        }
        if (play.handlers && Array.isArray(play.handlers)) {
          for (const handler of play.handlers) {
            const extracted = this.extractTask(
              handler,
              globalOrder,
              `${playName} (Handlers)`,
            );
            if (extracted) {
              tasks.push(extracted);
              globalOrder++;
            }
          }
        }
        if (play.pre_tasks && Array.isArray(play.pre_tasks)) {
          for (const preTask of play.pre_tasks) {
            const extracted = this.extractTask(
              preTask,
              globalOrder,
              `${playName} (Pre-tasks)`,
            );
            if (extracted) {
              tasks.push(extracted);
              globalOrder++;
            }
          }
        }
        if (play.post_tasks && Array.isArray(play.post_tasks)) {
          for (const postTask of play.post_tasks) {
            const extracted = this.extractTask(
              postTask,
              globalOrder,
              `${playName} (Post-tasks)`,
            );
            if (extracted) {
              tasks.push(extracted);
              globalOrder++;
            }
          }
        }
      }

      return {
        success: true,
        tasks,
      };
    } catch (error) {
      return {
        success: false,
        tasks: [],
        error: error instanceof Error ? error.message : "Failed to parse YAML",
      };
    }
  }

  private extractTask(
    task: any,
    order: number,
    playName: string,
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
