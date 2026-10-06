import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../../src/http";
import { Deployments } from "../../src/resources/deployments";
import { mockFetch } from "../helpers";

const mockDeployment = {
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

describe("Deployments.retrieve", () => {
  it("GETs /v1/deploy/:project and returns the deployment", async () => {
    const api = vi.fn(() => Response.json(mockDeployment));
    const deployments = new Deployments(
      new HttpClient("key_1", mockFetch(api))
    );

    await expect(deployments.retrieve("acme")).resolves.toStrictEqual(
      mockDeployment
    );
    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://api.a22a.dev/v1/deploy/acme"
      })
    );
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
