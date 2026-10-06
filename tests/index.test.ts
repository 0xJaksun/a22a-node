import { describe, expect, it } from "vitest";
import { A22A } from "../src/client";
import { A22AError, NotFoundError } from "../src/error";
import * as a22a from "../src/index";

const errors = [
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
];

describe("index", () => {
  it("exports the client and the errors by name", () => {
    expect(Object.keys(a22a).sort()).toStrictEqual(
      ["A22A", "default", ...errors].sort()
    );
    expect(a22a.default).toBe(A22A);
    expect(a22a.NotFoundError).toBe(NotFoundError);
  });

  it("reaches the same errors through A22A.errors", () => {
    expect(Object.keys(A22A.errors).sort()).toStrictEqual(errors);
    expect(A22A.errors.NotFoundError).toBe(NotFoundError);
    expect(A22A.errors.A22AError).toBe(A22AError);
  });
});
