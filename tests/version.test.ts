import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { VERSION } from "../src/version";

const Package = z.object({ version: z.string() });

describe("VERSION", () => {
  it("matches package.json", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));

    expect(Package.safeParse(pkg)).toStrictEqual({
      success: true,
      data: { version: VERSION },
    });
  });
});
