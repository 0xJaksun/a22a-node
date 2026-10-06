import { z } from "zod";
import type { HttpClient } from "../http";

const ProjectSchema = z.object({
  id: z.string(),
  project: z.string(),
  version: z.number().int(),
  manifest: z.object({
    project: z.string(),
    workflows: z.record(
      z.string(),
      z.object({
        steps: z.array(
          z.object({
            id: z.string(),
            prompt: z.string(),
            needs: z.array(z.string()),
            output: z.record(z.string(), z.unknown()).optional()
          })
        )
      })
    )
  })
});

export type Project = z.infer<typeof ProjectSchema>;

const ProjectSummarySchema = z.object({
  project: z.string(),
  version: z.number().int(),
  workflows: z.array(z.string())
});

export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

export type Manifest = {
  project: string;
  workflows: Record<
    string,
    {
      steps: {
        id: string;
        prompt: string;
        needs?: string[];
        output?: Record<string, unknown>;
      }[];
    }
  >;
};

export class Projects {
  constructor(private readonly http: HttpClient) {}

  public async deploy(manifest: Manifest): Promise<ProjectSummary> {
    return this.http.post("/v1/deploy", manifest, ProjectSummarySchema);
  }

  public async retrieve(project: string): Promise<Project> {
    return this.http.get(`/v1/deploy/${project}`, ProjectSchema);
  }
}
