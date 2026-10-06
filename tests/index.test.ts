import { describe, expect, it } from "vitest";
import { A22A } from "../src/client";
import { A22AError, NotFoundError } from "../src/error";
import * as a22a from "../src/index";

describe("index", () => {
  it("exports the client and nothing else at runtime", () => {
    expect(Object.keys(a22a).sort()).toStrictEqual(["A22A", "default"]);
    expect(a22a.default).toBe(A22A);
  });

  it("reaches every error through A22A.errors, the same classes the SDK throws", () => {
    expect(Object.keys(A22A.errors).sort()).toStrictEqual([
      "A22AError",
      "APIConnectionError",
      "APIError",
      "AuthenticationError",
      "BadRequestError",
      "InternalServerError",
      "InvalidResponseError",
      "InvalidWebhookPayloadError",
      "InvalidWebhookSignatureError",
      "NotFoundError"
    ]);
    expect(A22A.errors.NotFoundError).toBe(NotFoundError);
    expect(A22A.errors.A22AError).toBe(A22AError);
  });
});
