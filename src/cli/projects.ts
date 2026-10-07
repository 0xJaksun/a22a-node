import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { z } from "zod";
import { A22A } from "../client";
import { A22AError } from "../error";
import type { Manifest } from "../resources/projects";
import type { Result } from "./result";

export const DIR = "a22a";

type Project = { name: string; workflows: string[] };

const WorkflowSchema = z.strictObject({
  steps: z.array(
    z.strictObject({
      id: z.string(),
      prompt: z.string(),
      needs: z.array(z.string()).optional(),
      output: z.record(z.string(), z.unknown()).optional()
    })
  )
});

export class Projects {
  constructor(private readonly cwd: string) {}

  public async list(only?: string): Promise<Result<string[], string>> {
    const projects = await this.find(only);
    if (!projects.ok) return projects;

    const value = projects.value.map(
      ({ name, workflows }) =>
        `${name}: ${workflows.join(", ") || "no workflows"}`
    );
    return { ok: true, value };
  }

  public async deploy(
    only: string | undefined,
    apiKey: string
  ): Promise<Result<string[], string>> {
    const projects = await this.find(only);
    if (!projects.ok) return projects;

    const api = new A22A({ apiKey });
    const value: string[] = [];
    for (const project of projects.value) {
      const manifest = await this.manifest(project);
      if (!manifest.ok) return manifest;

      try {
        const { version, workflows } = await api.projects.deploy(
          manifest.value
        );
        value.push(`${project.name} v${version}: ${workflows.join(", ")}`);
      } catch (error) {
        if (!(error instanceof A22AError)) throw error;
        return { ok: false, error: `${project.name}: ${error.message}` };
      }
    }
    return { ok: true, value };
  }

  private async find(only?: string): Promise<Result<Project[], string>> {
    const names = await this.entries(join(this.cwd, DIR));
    if (names === null) {
      return { ok: false, error: `no ${DIR}/ folder here` };
    }

    const wanted = names
      .filter((name) => !name.startsWith(".") && (only ?? name) === name)
      .sort();
    const read = await Promise.all(wanted.map((p) => this.read(p)));
    const value = read.filter((p) => p !== null);
    if (only !== undefined && value.length === 0) {
      return { ok: false, error: `no project "${only}" under ${DIR}/` };
    }
    return { ok: true, value };
  }

  private async read(name: string): Promise<Project | null> {
    const files = await this.entries(join(this.cwd, DIR, name));
    if (files === null) return null;
    return {
      name,
      workflows: files.filter((file) => file.endsWith(".json")).sort()
    };
  }

  private async manifest({
    name,
    workflows
  }: Project): Promise<Result<Manifest, string>> {
    if (workflows.length === 0) {
      return { ok: false, error: `${join(DIR, name)}: no workflows` };
    }

    const value: Manifest = { project: name, workflows: {} };
    for (const file of workflows) {
      const path = join(DIR, name, file);
      const json = await this.json(path);
      if (!json.ok) return json;

      const parsed = WorkflowSchema.safeParse(json.value);
      if (!parsed.success) {
        return {
          ok: false,
          error: `${path}: ${z.prettifyError(parsed.error)}`
        };
      }
      value.workflows[basename(file, ".json")] = parsed.data;
    }
    return { ok: true, value };
  }

  private async json(path: string): Promise<Result<unknown, string>> {
    try {
      const text = await readFile(join(this.cwd, path), "utf8");
      return { ok: true, value: JSON.parse(text) };
    } catch {
      return { ok: false, error: `${path}: not valid JSON` };
    }
  }

  private async entries(dir: string): Promise<string[] | null> {
    try {
      return await readdir(dir);
    } catch {
      return null;
    }
  }
}
