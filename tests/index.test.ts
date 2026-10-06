import { describe, expect, it } from "vitest";
import { A22A } from "../src/client";
import { NotFoundError } from "../src/error";
import * as a22a from "../src/index";

describe("index", () => {
  it("exports exactly the public surface", () => {
    expect(Object.keys(a22a).sort()).toStrictEqual([
      "A22A",
      "A22AError",
      "APIConnectionError",
      "APIError",
      "AuthenticationError",
      "BadRequestError",
      "InternalServerError",
      "InvalidResponseError",
      "InvalidWebhookPayloadError",
      "InvalidWebhookSignatureError",
      "NotFoundError",
      "default"
    ]);
  });

  it("exports the same classes the SDK throws, so instanceof holds", () => {
    expect(a22a.default).toBe(A22A);
    expect(a22a.NotFoundError).toBe(NotFoundError);
  });
});
