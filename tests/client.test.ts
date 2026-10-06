import { describe, expect, it } from "vitest";
import { A22A } from "../src/client";
import { Runs } from "../src/resources/runs";
import { Projects } from "../src/resources/projects";

describe("A22A", () => {
  it("mounts the resources", () => {
    const a22a = new A22A({ apiKey: "key_1" });

    expect(a22a.projects).toBeInstanceOf(Projects);
    expect(a22a.runs).toBeInstanceOf(Runs);
  });
});
