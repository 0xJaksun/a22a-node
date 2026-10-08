import { describe, expect, it } from "vitest";
import { IO } from "../../src/cli/io";
import { output } from "./helpers";

describe("IO", () => {
  describe("parse", () => {
    it.each([
      [["--version"], { name: "version" }],
      [["-v"], { name: "version" }],
      [["--help"], { name: "help" }],
      [["-h"], { name: "help" }],
      [[], { name: "help" }],
      [["help"], { name: "help" }],
      [["list"], { name: "list", project: undefined }],
      [["list", "acme"], { name: "list", project: "acme" }],
      [["deploy"], { name: "deploy", project: undefined }],
      [["deploy", "acme"], { name: "deploy", project: "acme" }],
      [["nope"], { name: "invalid", message: 'unknown command "nope"' }],
      [["--nope"], { name: "invalid", message: 'unknown option "--nope"' }],
      [["list", "-x"], { name: "invalid", message: 'unknown option "-x"' }],
      [["list", "--dir"], { name: "invalid", message: "--dir needs a value" }],
      [
        ["list", "--dir", ""],
        { name: "invalid", message: "--dir needs a value" }
      ]
    ])("%j", (args, command) => {
      expect(new IO(output()).parse(args).command).toStrictEqual(command);
    });

    it("keeps --dir beside the command", () => {
      expect(
        new IO(output()).parse(["deploy", "acme", "--dir", "w"])
      ).toStrictEqual({
        command: { name: "deploy", project: "acme" },
        dir: "w"
      });
    });
  });

  it("writes out to stdout as is", () => {
    const out = output();

    new IO(out).out("hello");
    expect(out.stdout).toStrictEqual(["hello"]);
    expect(out.stderr).toStrictEqual([]);
  });

  it("writes err to stderr under the a22a prefix", () => {
    const out = output();

    new IO(out).err("went wrong");
    expect(out.stdout).toStrictEqual([]);
    expect(out.stderr).toStrictEqual(["a22a: went wrong"]);
  });

  it("prints an ok result line by line and exits 0", () => {
    const out = output();

    expect(new IO(out).result({ ok: true, value: ["one", "two"] })).toBe(0);
    expect(out.stdout).toStrictEqual(["one", "two"]);
    expect(out.stderr).toStrictEqual([]);
  });

  it("prints a failed result to stderr and exits 2", () => {
    const out = output();

    expect(new IO(out).result({ ok: false, error: "went wrong" })).toBe(2);
    expect(out.stdout).toStrictEqual([]);
    expect(out.stderr).toStrictEqual(["a22a: went wrong"]);
  });
});
