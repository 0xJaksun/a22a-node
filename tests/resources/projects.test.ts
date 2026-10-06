import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../../src/http";
import {
  type Manifest,
  type Project,
  Projects
} from "../../src/resources/projects";
import { mockFetch, sentRequest } from "../helpers";

const manifest: Manifest = {
  project: "acme",
  workflows: {
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

const mockProject: Project = {
  id: "1d4f6c3e-8a2b-4c7d-9e1f-0a1b2c3d4e5f",
  project: "acme",
  version: 2,
  manifest: {
    project: "acme",
    workflows: {
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

describe("Projects.deploy", () => {
  it("POSTs the manifest to /v1/deploy and returns what was deployed", async () => {
    const api = vi.fn<(req: Request) => Response>(() =>
      Response.json({ project: "acme", version: 2, workflows: ["summarise"] })
    );
    const projects = new Projects(new HttpClient("key_1", mockFetch(api)));

    await expect(projects.deploy(manifest)).resolves.toStrictEqual({
      project: "acme",
      version: 2,
      workflows: ["summarise"]
    });

    const req = sentRequest(api);
    expect(req).toMatchObject({
      method: "POST",
      url: "https://api.a22a.sh/v1/deploy"
    });
    await expect(req.json()).resolves.toStrictEqual(manifest);
  });

  it("rejects with BadRequestError when the manifest is invalid", async () => {
    const projects = new Projects(
      new HttpClient(
        "key_1",
        mockFetch(() =>
          Response.json({ error: "invalid_structure" }, { status: 400 })
        )
      )
    );

    await expect(projects.deploy(manifest)).rejects.toMatchObject({
      type: "BadRequestError",
      status: 400,
      code: "invalid_structure"
    });
  });

  it("rejects with InvalidResponseError when the body isn't what was deployed", async () => {
    const projects = new Projects(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ ok: true }))
      )
    );

    await expect(projects.deploy(manifest)).rejects.toMatchObject({
      type: "InvalidResponseError",
      status: 200
    });
  });
});

describe("Projects.retrieve", () => {
  it("GETs /v1/deploy/:project and returns the project", async () => {
    const api = vi.fn<(req: Request) => Response>(() =>
      Response.json(mockProject)
    );
    const projects = new Projects(new HttpClient("key_1", mockFetch(api)));

    await expect(projects.retrieve("acme")).resolves.toStrictEqual(mockProject);
    expect(sentRequest(api)).toMatchObject({
      method: "GET",
      url: "https://api.a22a.sh/v1/deploy/acme"
    });
  });

  it("rejects with NotFoundError when the project doesn't exist", async () => {
    const projects = new Projects(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ error: "not_found" }, { status: 404 }))
      )
    );

    await expect(projects.retrieve("nope")).rejects.toMatchObject({
      type: "NotFoundError",
      status: 404,
      code: "not_found"
    });
  });

  it("rejects with InvalidResponseError when the body isn't a project", async () => {
    const projects = new Projects(
      new HttpClient(
        "key_1",
        mockFetch(() => Response.json({ id: "x", project: "acme" }))
      )
    );

    await expect(projects.retrieve("acme")).rejects.toMatchObject({
      type: "InvalidResponseError",
      status: 200
    });
  });
});
