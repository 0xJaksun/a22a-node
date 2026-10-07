import { describe, expect, it } from "vitest";
import { Cli, type Env } from "../../src/cli/cli";
import { IO } from "../../src/cli/io";
import { Projects } from "../../src/cli/projects";
import { VERSION } from "../../src/version";
import { folder, output } from "./folder";

async function cli(files: Record<string, string> = {}, env: Env = {}) {
  const out = output();
  const instance = new Cli({
    projects: new Projects(await folder(files)),
    io: new IO(out),
    env
  });
  return { ...out, run: (args: string[]) => instance.run(args) };
}

describe("Cli", () => {
  it("prints the version", async () => {
    const { run, stdout } = await cli();

    await expect(run(["--version"])).resolves.toBe(0);
    expect(stdout).toStrictEqual([VERSION]);
  });

  it("prints what list returns", async () => {
    const { run, stdout, stderr } = await cli({
      "a22a/acme/summarise.json": "{}"
    });

    await expect(run(["list"])).resolves.toBe(0);
    expect(stdout).toStrictEqual(["acme: summarise.json"]);
    expect(stderr).toStrictEqual([]);
  });

  it("deploys with the key from the flag", async () => {
    const { run, stderr } = await cli();

    await expect(run(["deploy", "--api-key", "k"])).resolves.toBe(2);
    expect(stderr).toStrictEqual(["a22a: no a22a/ folder here"]);
  });

  it("deploys with the key from the environment", async () => {
    const { run, stderr } = await cli({}, { A22A_API_KEY: "k" });

    await expect(run(["deploy"])).resolves.toBe(2);
    expect(stderr).toStrictEqual(["a22a: no a22a/ folder here"]);
  });

  it("needs an api key to deploy", async () => {
    const { run, stdout, stderr } = await cli();

    await expect(run(["deploy"])).resolves.toBe(2);
    expect(stderr).toStrictEqual([
      "a22a: no api key: pass --api-key or set A22A_API_KEY"
    ]);
    expect(stdout[0]).toMatch(/^usage: a22a <command>/);
  });

  it("fails on an invalid command line and shows usage", async () => {
    const { run, stdout, stderr } = await cli();

    await expect(run(["nope"])).resolves.toBe(2);
    expect(stderr).toStrictEqual(['a22a: unknown command "nope"']);
    expect(stdout[0]).toMatch(/^usage: a22a <command>/);
  });
});
