import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../../src/http";
import { Runs } from "../../src/resources/runs";
import { mockFetch, sentRequest } from "../helpers";

describe("Runs.invoke", () => {
  it("POSTs the input to /v1/run/:project/:workflow and returns the run id", async () => {
    const api = vi.fn<(req: Request) => Response>(() =>
      Response.json({ run_id: "run_1" })
    );
    const runs = new Runs(new HttpClient("key_1", mockFetch(api)));

    await expect(
      runs.invoke({
        project: "acme",
        workflow: "summarise",
        input: { text: "hi" }
      })
    ).resolves.toStrictEqual({ run_id: "run_1" });

    const req = sentRequest(api);
    expect(req).toMatchObject({
      method: "POST",
      url: "https://api.a22a.dev/v1/run/acme/summarise"
    });
    await expect(req.json()).resolves.toStrictEqual({ input: { text: "hi" } });
  });

  it("omits input from the body when none is given", async () => {
    const api = vi.fn<(req: Request) => Response>(() =>
      Response.json({ run_id: "run_1" })
    );
    const runs = new Runs(new HttpClient("key_1", mockFetch(api)));

    await runs.invoke({ project: "acme", workflow: "summarise" });

    await expect(sentRequest(api).json()).resolves.toStrictEqual({});
  });

  it("rejects with NotFoundError when the workflow doesn't exist", async () => {
    const runs = new Runs(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ error: "not_found" }, { status: 404 }))
      )
    );

    await expect(
      runs.invoke({ project: "acme", workflow: "nope" })
    ).rejects.toMatchObject({
      type: "NotFoundError",
      status: 404,
      code: "not_found"
    });
  });

  it("rejects with BadRequestError when the input is invalid", async () => {
    const runs = new Runs(
      new HttpClient(
        "key_1",
        mockFetch(() =>
          Response.json({ error: "invalid_input" }, { status: 400 })
        )
      )
    );

    await expect(
      runs.invoke({ project: "acme", workflow: "summarise", input: { x: 1 } })
    ).rejects.toMatchObject({
      type: "BadRequestError",
      status: 400,
      code: "invalid_input"
    });
  });

  it("rejects with InvalidResponseError when the body isn't a run id", async () => {
    const runs = new Runs(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ id: "run_1" }))
      )
    );

    await expect(
      runs.invoke({ project: "acme", workflow: "summarise" })
    ).rejects.toMatchObject({
      type: "InvalidResponseError",
      status: 200
    });
  });
});

const mockFailedRun = {
  run_id: "1d4f6c3e-8a2b-4c7d-9e1f-0a1b2c3d4e5f",
  status: "failed",
  error: "Step write failed",
  steps: [
    { step_id: "extract", status: "completed", output: "facts" },
    { step_id: "write", status: "failed", error: "Insufficient credits" }
  ]
};

const mockRunningRun = {
  run_id: "2e5a7d4f-9b3c-4d8e-8f20-1b2c3d4e5f60",
  status: "running",
  steps: [
    { step_id: "extract", status: "running" },
    { step_id: "write", status: "pending" }
  ]
};

describe("Runs.retrieve", () => {
  it.each([mockFailedRun, mockRunningRun])(
    "GETs /v1/runs/:id and returns a $status run with its steps",
    async (mockRun) => {
      const api = vi.fn<(req: Request) => Response>(() =>
        Response.json(mockRun)
      );
      const runs = new Runs(new HttpClient("key_1", mockFetch(api)));

      await expect(runs.retrieve(mockRun.run_id)).resolves.toStrictEqual(
        mockRun
      );
      expect(sentRequest(api)).toMatchObject({
        method: "GET",
        url: `https://api.a22a.dev/v1/runs/${mockRun.run_id}`
      });
    }
  );

  it("rejects with NotFoundError when the run doesn't exist", async () => {
    const runs = new Runs(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ error: "not_found" }, { status: 404 }))
      )
    );

    await expect(runs.retrieve("nope")).rejects.toMatchObject({
      type: "NotFoundError",
      status: 404,
      code: "not_found"
    });
  });

  it("rejects with InvalidResponseError when a step has an unknown status", async () => {
    const runs = new Runs(
      new HttpClient(
        "key_1",
        mockFetch(() =>
          Response.json({
            ...mockRunningRun,
            steps: [{ step_id: "extract", status: "cancelled" }]
          })
        )
      )
    );

    await expect(runs.retrieve(mockRunningRun.run_id)).rejects.toMatchObject({
      type: "InvalidResponseError",
      status: 200
    });
  });
});
