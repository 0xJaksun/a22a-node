import { describe, expect, it } from "vitest";
import { Projects } from "../../src/cli/projects";
import { A22A } from "../../src/client";
import { folder } from "./helpers";

/** Projects over the given files, read from a22a/ unless told otherwise. */
const a22a = new A22A({ apiKey: "k", baseURL: "http://localhost:1" });

async function projects(files: Record<string, string>, dir = "a22a") {
  return new Projects(await folder(files), dir, a22a);
}

describe("Projects", () => {
  describe("list", () => {
    it("lists every project under a22a/ with its workflow files, sorted", async () => {
      const subject = await projects({
        "a22a/README.md": "",
        "a22a/zeta/run.json": "{}",
        "a22a/acme/summarise.json": "{}",
        "a22a/acme/classify.json": "{}",
        "a22a/acme/notes.txt": ""
      });

      await expect(subject.list()).resolves.toStrictEqual({
        ok: true,
        value: ["acme: classify.json, summarise.json", "zeta: run.json"]
      });
    });

    it("lists only the project named", async () => {
      const subject = await projects({
        "a22a/acme/summarise.json": "{}",
        "a22a/zeta/run.json": "{}"
      });

      await expect(subject.list("zeta")).resolves.toStrictEqual({
        ok: true,
        value: ["zeta: run.json"]
      });
    });

    it("skips dot folders and names an empty project", async () => {
      const subject = await projects({
        "a22a/.git/HEAD": "",
        "a22a/empty/notes.txt": "",
        "a22a/acme/summarise.json": "{}"
      });

      await expect(subject.list()).resolves.toStrictEqual({
        ok: true,
        value: ["acme: summarise.json", "empty: no workflows"]
      });
    });

    it("reads the folder it is given", async () => {
      const subject = await projects(
        { "workflows/acme/summarise.json": "{}" },
        "workflows"
      );

      await expect(subject.list()).resolves.toStrictEqual({
        ok: true,
        value: ["acme: summarise.json"]
      });
    });

    it("fails on a project that isn't there", async () => {
      const subject = await projects({ "a22a/acme/summarise.json": "{}" });

      await expect(subject.list("ghost")).resolves.toStrictEqual({
        ok: false,
        error: 'no project "ghost" under a22a/'
      });
    });

    it("fails without the folder", async () => {
      const subject = await projects({});

      await expect(subject.list()).resolves.toStrictEqual({
        ok: false,
        error: "no a22a/ folder here"
      });
    });
  });

  describe("deploy", () => {
    it("refuses without a client", async () => {
      const subject = new Projects(await folder({}), "a22a");

      await expect(subject.deploy()).resolves.toStrictEqual({
        ok: false,
        error: "no api key: set A22A_API_KEY"
      });
    });

    it("names the file that isn't JSON before sending anything", async () => {
      const subject = await projects({
        "a22a/acme/summarise.json": "{ steps: ["
      });

      await expect(subject.deploy()).resolves.toStrictEqual({
        ok: false,
        error: "a22a/acme/summarise.json: not valid JSON"
      });
    });

    it("names the file it cannot read", async () => {
      const subject = await projects({ "a22a/acme/summarise.json/inner": "" });

      await expect(subject.deploy()).resolves.toStrictEqual({
        ok: false,
        error: "a22a/acme/summarise.json: cannot read"
      });
    });

    it("names the file and field that isn't a workflow", async () => {
      const subject = await projects({
        "a22a/acme/summarise.json": JSON.stringify({
          steps: [{ id: "extract", prompt: 1, model: "openai/gpt-5-nano" }]
        })
      });

      await expect(subject.deploy()).resolves.toStrictEqual({
        ok: false,
        error:
          "a22a/acme/summarise.json: ✖ Invalid input: expected string, received number\n  → at steps[0].prompt"
      });
    });

    it("names the step asking for too many retries", async () => {
      const subject = await projects({
        "a22a/acme/summarise.json": JSON.stringify({
          steps: [
            {
              id: "extract",
              prompt: "p",
              model: "openai/gpt-5-nano",
              retries: 6
            }
          ]
        })
      });

      await expect(subject.deploy()).resolves.toStrictEqual({
        ok: false,
        error:
          "a22a/acme/summarise.json: ✖ Too big: expected number to be <=5\n  → at steps[0].retries"
      });
    });

    it("names the step with no model", async () => {
      const subject = await projects({
        "a22a/acme/summarise.json": JSON.stringify({
          steps: [{ id: "extract", prompt: "p" }]
        })
      });

      await expect(subject.deploy()).resolves.toStrictEqual({
        ok: false,
        error:
          "a22a/acme/summarise.json: ✖ Invalid input: expected string, received undefined\n  → at steps[0].model"
      });
    });

    it("refuses a project name the API would", async () => {
      const subject = await projects({ "a22a/Bad Name/run.json": "{}" });

      await expect(subject.deploy()).resolves.toStrictEqual({
        ok: false,
        error:
          "a22a/Bad Name: project name must be lowercase letters, digits and dashes, up to 32"
      });
    });

    it("refuses a workflow name the API would", async () => {
      const subject = await projects({ "a22a/acme/My Flow.json": "{}" });

      await expect(subject.deploy()).resolves.toStrictEqual({
        ok: false,
        error:
          "a22a/acme/My Flow.json: workflow name must be lowercase letters, digits and dashes, up to 32"
      });
    });

    it("refuses a project with no workflows", async () => {
      const subject = await projects({ "a22a/empty/notes.txt": "" });

      await expect(subject.deploy("empty")).resolves.toStrictEqual({
        ok: false,
        error: "a22a/empty: no workflows"
      });
    });
  });
});
