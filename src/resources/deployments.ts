import { z } from "zod";
import type { HttpClient } from "../http";

const Deployment = z.object({
  id: z.string(),
  project: z.string(),
  version: z.number().int(),
  manifest: z.object({
    project: z.string(),
    flows: z.record(
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

export type Deployment = z.infer<typeof Deployment>;

export class Deployments {
  constructor(private readonly http: HttpClient) {}

  public async retrieve(project: string): Promise<Deployment> {
    return this.http.get(`/v1/deploy/${project}`, Deployment);
  }
}
