import { describe, expect, it } from "vitest";
import { A22A } from "../src/client";
import { Projects } from "../src/resources/projects";
import { Runs } from "../src/resources/runs";
import { Webhooks } from "../src/resources/webhooks";

describe("A22A", () => {
  it("mounts the resources", () => {
    const a22a = new A22A({ apiKey: "key_1" });

    expect(a22a.projects).toBeInstanceOf(Projects);
    expect(a22a.runs).toBeInstanceOf(Runs);
    expect(a22a.webhooks).toBeInstanceOf(Webhooks);
  });

  it("points at the API unless told otherwise", () => {
    expect(new A22A({ apiKey: "key_1" }).baseURL).toBe("https://api.a22a.sh");
    expect(
      new A22A({ apiKey: "key_1", baseURL: "http://localhost:8888" }).baseURL
    ).toBe("http://localhost:8888");
  });
});
