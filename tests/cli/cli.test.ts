import { describe, expect, it } from "vitest";
import { Cli, type Env } from "../../src/cli/cli";
import { IO } from "../../src/cli/io";
import { VERSION } from "../../src/version";
import { folder, output } from "./helpers";

async function cli(files: Record<string, string> = {}, env: Env = {}) {
  const out = output();
  const instance = new Cli({
    io: new IO(out),
    env,
    cwd: await folder(files)
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

  it("reads the folder given by --dir", async () => {
    const { run, stdout } = await cli({
      "workflows/acme/summarise.json": "{}"
    });

    await expect(run(["list", "--dir", "workflows"])).resolves.toBe(0);
    expect(stdout).toStrictEqual(["acme: summarise.json"]);
  });

  it("reads the folder named by A22A_DIR", async () => {
    const { run, stdout } = await cli(
      { "workflows/acme/summarise.json": "{}" },
      { A22A_DIR: "workflows" }
    );

    await expect(run(["list"])).resolves.toBe(0);
    expect(stdout).toStrictEqual(["acme: summarise.json"]);
  });

  it("accepts the key from the environment", async () => {
    const { run, stderr } = await cli({}, { A22A_API_KEY: "k" });

    await expect(run(["deploy"])).resolves.toBe(2);
    expect(stderr).toStrictEqual(["a22a: no a22a/ folder here"]);
  });

  it("needs an api key to deploy", async () => {
    const { run, stdout, stderr } = await cli();

    await expect(run(["deploy"])).resolves.toBe(2);
    expect(stderr).toStrictEqual(["a22a: no api key: set A22A_API_KEY"]);
    expect(stdout).toStrictEqual([]);
  });

  it("fails on an invalid command line and shows usage", async () => {
    const { run, stdout, stderr } = await cli();

    await expect(run(["nope"])).resolves.toBe(2);
    expect(stderr).toStrictEqual(['a22a: unknown command "nope"']);
    expect(stdout[0]).toMatch(/^usage: a22a <command>/);
  });
});
