import { describe, expect, it, vi } from "vitest";
import { run } from "../src/cli";
import { VERSION } from "../src/version";

function deps() {
  return { out: vi.fn(), err: vi.fn() };
}

describe("a22a", () => {
  it("prints the version", async () => {
    const d = deps();

    await expect(run(["--version"], d)).resolves.toBe(0);
    await expect(run(["-v"], d)).resolves.toBe(0);
    expect(d.out).toHaveBeenCalledWith(VERSION);
  });

  it("prints usage with no command, help, or --help", async () => {
    const d = deps();

    await expect(run([], d)).resolves.toBe(0);
    await expect(run(["help"], d)).resolves.toBe(0);
    await expect(run(["--help"], d)).resolves.toBe(0);
    await expect(run(["-h"], d)).resolves.toBe(0);
    expect(d.out).toHaveBeenCalledWith(expect.stringContaining("usage: a22a"));
  });

  it("exits 2 on an unknown command", async () => {
    const d = deps();

    await expect(run(["nope"], d)).resolves.toBe(2);
    expect(d.err).toHaveBeenCalledWith('a22a: unknown command "nope"');
  });
});
