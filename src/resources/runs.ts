import { z } from "zod";
import type { HttpClient } from "../http";

const InvokedRun = z.object({
  run_id: z.string()
});

export type InvokedRun = z.infer<typeof InvokedRun>;

export type InvokeParams = {
  project: string;
  flow: string;
  input?: Record<string, unknown>;
};

export class Runs {
  constructor(private readonly http: HttpClient) {}

  public async invoke(params: InvokeParams): Promise<InvokedRun> {
    const { project, flow, input } = params;
    return this.http.post(`/v1/run/${project}/${flow}`, { input }, InvokedRun);
  }
}
