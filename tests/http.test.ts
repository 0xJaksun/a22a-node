import { describe, expect, it } from "vitest";
import { z } from "zod";
import { HttpClient } from "../src/http";
import { VERSION } from "../src/version";
import { mockFetch } from "./helpers";

const Run = z.object({ id: z.string() });
const Echo = z.record(z.string(), z.unknown());

describe("HttpClient", () => {
  it("sends the key and the user-agent to the base url", async () => {
    const client = new HttpClient(
      "key_1",
      mockFetch((req) =>
        Response.json({
          url: req.url,
          headers: Object.fromEntries(req.headers)
        })
      )
    );

    await expect(client.get("/v1/runs/run_1", Echo)).resolves.toMatchObject({
      url: "https://api.a22a.sh/v1/runs/run_1",
      headers: { "x-api-key": "key_1", "user-agent": `a22a-node/${VERSION}` }
    });
  });

  it("posts the body as JSON", async () => {
    const client = new HttpClient(
      "key_1",
      mockFetch(async (req) => Response.json(await req.json()))
    );

    await expect(
      client.post("/v1/run/acme/summarise", { input: { a: 1 } }, Echo)
    ).resolves.toStrictEqual({ input: { a: 1 } });
  });

  it("maps a non-2xx to its APIError with the server's request id", async () => {
    const client = new HttpClient(
      "key_1",
      mockFetch(() =>
        Response.json(
          { error: "not_found" },
          { status: 404, headers: { "x-request-id": "req_1" } }
        )
      )
    );

    await expect(client.get("/v1/runs/nope", Run)).rejects.toMatchObject({
      type: "NotFoundError",
      status: 404,
      code: "not_found",
      requestId: "req_1"
    });
  });

  it("keeps a non-JSON body as text", async () => {
    const client = new HttpClient(
      "key_1",
      mockFetch(() => new Response("<html>Bad Gateway</html>", { status: 502 }))
    );

    await expect(client.get("/v1/runs/run_1", Run)).rejects.toMatchObject({
      type: "InternalServerError",
      status: 502,
      code: undefined,
      body: "<html>Bad Gateway</html>"
    });
  });

  it("throws InvalidResponseError when a 2xx fails the schema", async () => {
    const client = new HttpClient(
      "key_1",
      mockFetch(() => Response.json({ nope: 1 }))
    );

    await expect(client.get("/v1/runs/run_1", Run)).rejects.toMatchObject({
      type: "InvalidResponseError",
      status: 200,
      body: { nope: 1 }
    });
  });

  it("throws APIConnectionError when fetch rejects", async () => {
    const client = new HttpClient("key_1", async () => {
      throw new TypeError("fetch failed");
    });

    await expect(client.get("/v1/runs/run_1", Run)).rejects.toMatchObject({
      type: "APIConnectionError",
      status: undefined
    });
  });
});
