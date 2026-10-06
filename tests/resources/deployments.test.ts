import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../../src/http";
import {
  type Deployment,
  Deployments,
  type Manifest
} from "../../src/resources/deployments";
import { mockFetch, sentRequest } from "../helpers";

const manifest: Manifest = {
  project: "acme",
  flows: {
    summarise: {
      steps: [
        { id: "extract", prompt: "Pull the facts from {{input.text}}" },
        {
          id: "write",
          prompt: "Summarise {{extract.output}}",
          needs: ["extract"]
        }
      ]
    }
  }
};

const mockDeployment: Deployment = {
  id: "1d4f6c3e-8a2b-4c7d-9e1f-0a1b2c3d4e5f",
  project: "acme",
  version: 2,
  manifest: {
    project: "acme",
    flows: {
      summarise: {
        steps: [
          {
            id: "extract",
            prompt: "Pull the facts from {{input.text}}",
            needs: []
          },
          {
            id: "write",
            prompt: "Summarise {{extract.output}}",
            needs: ["extract"]
          }
        ]
      }
    }
  }
};

describe("Deployments.create", () => {
  it("POSTs the manifest to /v1/deploy and returns what was deployed", async () => {
    const api = vi.fn<(req: Request) => Response>(() =>
      Response.json({ project: "acme", version: 2, flows: ["summarise"] })
    );
    const deployments = new Deployments(
      new HttpClient("key_1", mockFetch(api))
    );

    await expect(deployments.create(manifest)).resolves.toStrictEqual({
      project: "acme",
      version: 2,
      flows: ["summarise"]
    });

    const req = sentRequest(api);
    expect(req).toMatchObject({
      method: "POST",
      url: "https://api.a22a.dev/v1/deploy"
    });
    await expect(req.json()).resolves.toStrictEqual(manifest);
  });

  it("rejects with BadRequestError when the manifest is invalid", async () => {
    const deployments = new Deployments(
      new HttpClient(
        "key_1",
        mockFetch(() =>
          Response.json({ error: "invalid_structure" }, { status: 400 })
        )
      )
    );

    await expect(deployments.create(manifest)).rejects.toMatchObject({
      type: "BadRequestError",
      status: 400,
      code: "invalid_structure"
    });
  });

  it("rejects with InvalidResponseError when the body isn't a deployment", async () => {
    const deployments = new Deployments(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ ok: true }))
      )
    );

    await expect(deployments.create(manifest)).rejects.toMatchObject({
      type: "InvalidResponseError",
      status: 200
    });
  });
});

describe("Deployments.retrieve", () => {
  it("GETs /v1/deploy/:project and returns the deployment", async () => {
    const api = vi.fn<(req: Request) => Response>(() =>
      Response.json(mockDeployment)
    );
    const deployments = new Deployments(
      new HttpClient("key_1", mockFetch(api))
    );

    await expect(deployments.retrieve("acme")).resolves.toStrictEqual(
      mockDeployment
    );
    expect(sentRequest(api)).toMatchObject({
      method: "GET",
      url: "https://api.a22a.dev/v1/deploy/acme"
    });
  });

  it("rejects with NotFoundError when the project doesn't exist", async () => {
    const deployments = new Deployments(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ error: "not_found" }, { status: 404 }))
      )
    );

    await expect(deployments.retrieve("nope")).rejects.toMatchObject({
      type: "NotFoundError",
      status: 404,
      code: "not_found"
    });
  });

  it("rejects with InvalidResponseError when the body isn't a deployment", async () => {
    const deployments = new Deployments(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ id: "x", project: "acme" }))
      )
    );

    await expect(deployments.retrieve("acme")).rejects.toMatchObject({
      type: "InvalidResponseError",
      status: 200
    });
  });
});
