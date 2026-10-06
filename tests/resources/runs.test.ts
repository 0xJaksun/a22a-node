import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../../src/http";
import { Runs } from "../../src/resources/runs";
import { mockFetch, sentRequest } from "../helpers";

describe("Runs.invoke", () => {
  it("POSTs the input to /v1/run/:project/:flow and returns the run id", async () => {
    const api = vi.fn<(req: Request) => Response>(() =>
      Response.json({ run_id: "run_1" })
    );
    const runs = new Runs(new HttpClient("key_1", mockFetch(api)));

    await expect(
      runs.invoke({ project: "acme", flow: "summarise", input: { text: "hi" } })
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

    await runs.invoke({ project: "acme", flow: "summarise" });

    await expect(sentRequest(api).json()).resolves.toStrictEqual({});
  });

  it("rejects with NotFoundError when the flow doesn't exist", async () => {
    const runs = new Runs(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ error: "not_found" }, { status: 404 }))
      )
    );

    await expect(
      runs.invoke({ project: "acme", flow: "nope" })
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
      runs.invoke({ project: "acme", flow: "summarise", input: { x: 1 } })
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
      runs.invoke({ project: "acme", flow: "summarise" })
    ).rejects.toMatchObject({
      type: "InvalidResponseError",
      status: 200
    });
  });
});
