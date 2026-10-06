import { z } from "zod";
import type { HttpClient } from "../http";

const InvokedRunSchema = z.object({
  run_id: z.string()
});

export type InvokedRun = z.infer<typeof InvokedRunSchema>;

const StepBaseSchema = z.object({ step_id: z.string() });
const StepSchema = z.discriminatedUnion("status", [
  StepBaseSchema.extend({ status: z.literal("pending") }),
  StepBaseSchema.extend({ status: z.literal("running") }),
  StepBaseSchema.extend({ status: z.literal("completed"), output: z.string() }),
  StepBaseSchema.extend({ status: z.literal("failed"), error: z.string() })
]);

export type Step = z.infer<typeof StepSchema>;

const RunBaseSchema = z.object({
  run_id: z.string(),
  steps: z.array(StepSchema)
});
export const RunSchema = z.discriminatedUnion("status", [
  RunBaseSchema.extend({ status: z.literal("queued") }),
  RunBaseSchema.extend({ status: z.literal("running") }),
  RunBaseSchema.extend({ status: z.literal("completed") }),
  RunBaseSchema.extend({ status: z.literal("failed"), error: z.string() })
]);

export type Run = z.infer<typeof RunSchema>;

export type InvokeParams = {
  project: string;
  workflow: string;
  input?: Record<string, unknown>;
};

export class Runs {
  constructor(private readonly http: HttpClient) {}

  public async invoke(params: InvokeParams): Promise<InvokedRun> {
    const { project, workflow, input } = params;
    return this.http.post(
      `/v1/run/${project}/${workflow}`,
      { input },
      InvokedRunSchema
    );
  }

  public async retrieve(id: string): Promise<Run> {
    return this.http.get(`/v1/runs/${id}`, RunSchema);
  }
}
