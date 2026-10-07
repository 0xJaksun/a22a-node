import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Result } from "./result";

export const DIR = "a22a";

type Project = { project: string; workflows: string[] };

export class Projects {
  constructor(private readonly cwd: string) {}

  public async list(only?: string): Promise<Result<string[], string>> {
    const projects = await this.find(only);
    if (projects === null) {
      return { ok: false, error: `no ${DIR}/ folder here` };
    }
    if (only !== undefined && projects.length === 0) {
      return { ok: false, error: `no project "${only}" under ${DIR}/` };
    }

    return { ok: true, value: projects.map((project) => this.line(project)) };
  }

  private async find(only?: string): Promise<Project[] | null> {
    const names = await this.entries(join(this.cwd, DIR));
    if (names === null) return null;

    const wanted = names
      .filter((name) => !name.startsWith(".") && (only ?? name) === name)
      .sort();
    const projects = await Promise.all(
      wanted.map((project) => this.read(project))
    );
    return projects.filter((project) => project !== null);
  }

  private async read(project: string): Promise<Project | null> {
    const files = await this.entries(join(this.cwd, DIR, project));
    if (files === null) return null;
    return {
      project,
      workflows: files.filter((name) => name.endsWith(".json")).sort()
    };
  }

  private line({ project, workflows }: Project): string {
    const list = workflows.length === 0 ? "no workflows" : workflows.join(", ");
    return `${project}: ${list}`;
  }

  private async entries(dir: string): Promise<string[] | null> {
    try {
      return await readdir(dir);
    } catch {
      return null;
    }
  }
}
