import { z } from "zod";

const ErrorBody = z.object({ error: z.string() });

type APIErrorParams<TStatus> = {
  status: TStatus;
  message: string;
  requestId?: string;
  body?: unknown;
  code?: string;
  cause?: unknown;
};

export class A22AError extends Error {
  readonly type: string = "A22AError";
}

export class APIError<
  TStatus extends number | undefined = number | undefined
> extends A22AError {
  override readonly type: string = "APIError";
  readonly status: TStatus;
  readonly body: unknown;
  readonly code: string | undefined;
  readonly requestId: string | undefined;

  constructor(params: APIErrorParams<TStatus>) {
    super(params.message, { cause: params.cause });
    this.status = params.status;
    this.requestId = params.requestId;
    this.body = params.body;
    this.code = params.code;
  }

  static generate(
    status: number,
    body: unknown,
    requestId: string | undefined
  ): APIError {
    const parsed = ErrorBody.safeParse(body);
    const code = parsed.success ? parsed.data.error : undefined;
    const message = `${status} ${code ?? "unknown error"}`;
    const params = { body, code, requestId, message };

    if (status >= 500) {
      return new InternalServerError({ status, ...params });
    }

    switch (status) {
      case 400:
        return new BadRequestError({ status, ...params });
      case 401:
        return new AuthenticationError({ status, ...params });
      case 404:
        return new NotFoundError({ status, ...params });
      default:
        return new APIError({ status, ...params });
    }
  }
}

export class BadRequestError extends APIError<400> {
  override readonly type = "BadRequestError";
}
export class AuthenticationError extends APIError<401> {
  override readonly type = "AuthenticationError";
}
export class NotFoundError extends APIError<404> {
  override readonly type = "NotFoundError";
}
export class InternalServerError extends APIError<number> {
  override readonly type = "InternalServerError";
}

export class InvalidResponseError extends APIError<number> {
  override readonly type = "InvalidResponseError";

  constructor(params: Omit<APIErrorParams<number>, "message">) {
    super({ ...params, message: "Invalid response" });
  }
}

export class APIConnectionError extends APIError<undefined> {
  override readonly type = "APIConnectionError";

  constructor(params: { cause: unknown }) {
    super({ ...params, status: undefined, message: "Connection error" });
  }
}

export class InvalidWebhookSignatureError extends A22AError {
  override readonly type = "InvalidWebhookSignatureError";
}

export class InvalidWebhookPayloadError extends A22AError {
  override readonly type = "InvalidWebhookPayloadError";
}
