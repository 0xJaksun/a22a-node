import { z } from "zod";
import type { HttpClient } from "../http";

const InvokedRun = z.object({
  run_id: z.string()
});

export type InvokedRun = z.infer<typeof InvokedRun>;

const StepBase = z.object({ step_id: z.string() });
const Step = z.discriminatedUnion("status", [
  StepBase.extend({ status: z.literal("pending") }),
  StepBase.extend({ status: z.literal("running") }),
  StepBase.extend({ status: z.literal("completed"), output: z.string() }),
  StepBase.extend({ status: z.literal("failed"), error: z.string() })
]);

export type Step = z.infer<typeof Step>;

const RunBase = z.object({ run_id: z.string(), steps: z.array(Step) });
const Run = z.discriminatedUnion("status", [
  RunBase.extend({ status: z.literal("queued") }),
  RunBase.extend({ status: z.literal("running") }),
  RunBase.extend({ status: z.literal("completed") }),
  RunBase.extend({ status: z.literal("failed"), error: z.string() })
]);

export type Run = z.infer<typeof Run>;

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

  public async retrieve(id: string): Promise<Run> {
    return this.http.get(`/v1/runs/${id}`, Run);
  }
}
