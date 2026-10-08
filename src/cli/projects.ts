import { readdir, readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { z } from "zod";
import type { A22A } from "../client";
import { A22AError } from "../error";
import type { Manifest } from "../resources/projects";
import type { Result } from "./result";

export const DIR = "a22a";

type Project = { name: string; workflows: string[] };

const NAME = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const NAME_RULE = "lowercase letters, digits and dashes, up to 32";

const WorkflowSchema = z.strictObject({
  steps: z.array(
    z.strictObject({
      id: z.string(),
      prompt: z.string(),
      model: z.string().min(1),
      needs: z.array(z.string()).optional(),
      output: z.record(z.string(), z.unknown()).optional()
    })
  )
});

export class Projects {
  constructor(
    private readonly cwd: string,
    private readonly dir: string,
    private readonly a22a?: A22A
  ) {}

  public async list(only?: string): Promise<Result<string[], string>> {
    const projects = await this.find(only);
    if (!projects.ok) return projects;

    const value = projects.value.map(
      ({ name, workflows }) =>
        `${name}: ${workflows.join(", ") || "no workflows"}`
    );
    return { ok: true, value };
  }

  public async deploy(only?: string): Promise<Result<string[], string>> {
    const { a22a } = this;
    if (a22a === undefined) {
      return {
        ok: false,
        error: "no api key: set A22A_API_KEY"
      };
    }

    const projects = await this.find(only);
    if (!projects.ok) return projects;

    const manifests: Manifest[] = [];
    for (const project of projects.value) {
      const manifest = await this.manifest(project);
      if (!manifest.ok) return manifest;
      manifests.push(manifest.value);
    }

    const value = ["Deployed:"];
    for (const manifest of manifests) {
      try {
        const { project, version, workflows } =
          await a22a.projects.deploy(manifest);
        value.push(
          `  ${project} v${version}`,
          ...this.endpoints(a22a.baseURL, project, workflows)
        );
      } catch (error) {
        if (!(error instanceof A22AError)) throw error;
        return { ok: false, error: `${manifest.project}: ${error.message}` };
      }
    }
    return { ok: true, value };
  }

  private endpoints(
    baseURL: string,
    project: string,
    workflows: string[]
  ): string[] {
    const width = Math.max(...workflows.map((workflow) => workflow.length));
    return workflows.map(
      (workflow) =>
        `    ${workflow.padEnd(width)}   POST ${baseURL}/v1/run/${project}/${workflow}`
    );
  }

  private async find(only?: string): Promise<Result<Project[], string>> {
    const names = await this.entries(resolve(this.cwd, this.dir));
    if (names === null) {
      return { ok: false, error: `no ${this.dir}/ folder here` };
    }

    const wanted = names
      .filter((name) => !name.startsWith("."))
      .filter((name) => only === undefined || name === only)
      .sort();
    const read = await Promise.all(wanted.map((p) => this.read(p)));
    const value = read.filter((p) => p !== null);
    if (only !== undefined && value.length === 0) {
      return { ok: false, error: `no project "${only}" under ${this.dir}/` };
    }
    return { ok: true, value };
  }

  private async read(name: string): Promise<Project | null> {
    const files = await this.entries(resolve(this.cwd, this.dir, name));
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
      return { ok: false, error: `${join(this.dir, name)}: no workflows` };
    }
    if (!NAME.test(name)) {
      return {
        ok: false,
        error: `${join(this.dir, name)}: project name must be ${NAME_RULE}`
      };
    }

    const value: Manifest = { project: name, workflows: {} };
    for (const file of workflows) {
      const path = join(this.dir, name, file);
      const workflow = basename(file, ".json");
      if (!NAME.test(workflow)) {
        return {
          ok: false,
          error: `${path}: workflow name must be ${NAME_RULE}`
        };
      }

      const json = await this.json(path);
      if (!json.ok) return json;

      const parsed = WorkflowSchema.safeParse(json.value);
      if (!parsed.success) {
        return {
          ok: false,
          error: `${path}: ${z.prettifyError(parsed.error)}`
        };
      }
      value.workflows[workflow] = parsed.data;
    }
    return { ok: true, value };
  }

  private async json(path: string): Promise<Result<unknown, string>> {
    const text = await this.text(path);
    if (!text.ok) return text;

    try {
      return { ok: true, value: JSON.parse(text.value) };
    } catch {
      return { ok: false, error: `${path}: not valid JSON` };
    }
  }

  private async text(path: string): Promise<Result<string, string>> {
    try {
      return {
        ok: true,
        value: await readFile(resolve(this.cwd, path), "utf8")
      };
    } catch {
      return { ok: false, error: `${path}: cannot read` };
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
