import { describe, expect, it } from "vitest";
import {
  A22AError,
  APIConnectionError,
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  InvalidResponseError,
  InvalidWebhookSignatureError,
  NotFoundError
} from "../src/error";

describe("APIError.generate", () => {
  const cases = [
    {
      status: 400,
      body: { error: "invalid_body" },
      cls: BadRequestError,
      type: "BadRequestError",
      code: "invalid_body",
      message: "400 invalid_body"
    },
    {
      status: 401,
      body: { error: "unauthorized" },
      cls: AuthenticationError,
      type: "AuthenticationError",
      code: "unauthorized",
      message: "401 unauthorized"
    },
    {
      status: 404,
      body: { error: "not_found" },
      cls: NotFoundError,
      type: "NotFoundError",
      code: "not_found",
      message: "404 not_found"
    },
    {
      status: 500,
      body: { error: "internal_error" },
      cls: InternalServerError,
      type: "InternalServerError",
      code: "internal_error",
      message: "500 internal_error"
    },
    {
      status: 500,
      body: {},
      cls: InternalServerError,
      type: "InternalServerError",
      code: undefined,
      message: "500 unknown error"
    },
    {
      status: 502,
      body: "<html>Bad Gateway</html>",
      cls: InternalServerError,
      type: "InternalServerError",
      code: undefined,
      message: "502 unknown error"
    },
    {
      status: 418,
      body: undefined,
      cls: APIError,
      type: "APIError",
      code: undefined,
      message: "418 unknown error"
    }
  ];

  it.each(cases)(
    "maps $status to $type",
    ({ status, body, cls, type, code, message }) => {
      const err = APIError.generate(status, body, "req_123");

      expect(err).toBeInstanceOf(cls);
      expect(err).toBeInstanceOf(A22AError);
      expect(err.type).toBe(type);
      expect(err.status).toBe(status);
      expect(err.code).toBe(code);
      expect(err.body).toBe(body);
      expect(err.requestId).toBe("req_123");
      expect(err.message).toBe(message);
    }
  );
});

describe("InvalidResponseError and APIConnectionError", () => {
  const requestId = "req_123";
  const cause = new Error("underlying");

  const cases = [
    {
      err: new InvalidResponseError({
        status: 200,
        body: {},
        requestId,
        cause
      }),
      type: "InvalidResponseError",
      message: "Invalid response",
      status: 200
    },
    {
      err: new APIConnectionError({ requestId, cause }),
      type: "APIConnectionError",
      message: "Connection error",
      status: undefined
    }
  ];

  it.each(cases)("$type", ({ err, type, message, status }) => {
    expect(err).toBeInstanceOf(APIError);
    expect(err.type).toBe(type);
    expect(err.message).toBe(message);
    expect(err.status).toBe(status);
    expect(err.cause).toBe(cause);
  });
});

describe("InvalidWebhookSignatureError", () => {
  it("is an A22AError but not an APIError", () => {
    const err = new InvalidWebhookSignatureError("Signature mismatch");

    expect(err).toBeInstanceOf(A22AError);
    expect(err).not.toBeInstanceOf(APIError);
    expect(err.type).toBe("InvalidWebhookSignatureError");
  });
});
