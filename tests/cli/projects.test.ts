import { describe, expect, it } from "vitest";
import { Projects } from "../../src/cli/projects";
import { folder } from "./folder";

describe("Projects", () => {
  it("lists every project under a22a/ with its workflow files, sorted", async () => {
    const projects = new Projects(
      await folder({
        "a22a/README.md": "",
        "a22a/zeta/run.json": "{}",
        "a22a/acme/summarise.json": "{}",
        "a22a/acme/classify.json": "{}",
        "a22a/acme/notes.txt": ""
      })
    );

    await expect(projects.list()).resolves.toStrictEqual({
      ok: true,
      value: ["acme: classify.json, summarise.json", "zeta: run.json"]
    });
  });

  it("lists only the project named", async () => {
    const projects = new Projects(
      await folder({
        "a22a/acme/summarise.json": "{}",
        "a22a/zeta/run.json": "{}"
      })
    );

    await expect(projects.list("zeta")).resolves.toStrictEqual({
      ok: true,
      value: ["zeta: run.json"]
    });
  });

  it("skips dot folders and names an empty project", async () => {
    const projects = new Projects(
      await folder({
        "a22a/.git/HEAD": "",
        "a22a/empty/notes.txt": "",
        "a22a/acme/summarise.json": "{}"
      })
    );

    await expect(projects.list()).resolves.toStrictEqual({
      ok: true,
      value: ["acme: summarise.json", "empty: no workflows"]
    });
  });

  it("fails on a project that isn't there", async () => {
    const projects = new Projects(
      await folder({ "a22a/acme/summarise.json": "{}" })
    );

    await expect(projects.list("ghost")).resolves.toStrictEqual({
      ok: false,
      error: 'no project "ghost" under a22a/'
    });
  });

  it("fails without an a22a/ folder", async () => {
    const projects = new Projects(await folder({}));

    await expect(projects.list()).resolves.toStrictEqual({
      ok: false,
      error: "no a22a/ folder here"
    });
  });
});
