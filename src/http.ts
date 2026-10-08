import type { z } from "zod";
import { APIConnectionError, APIError, InvalidResponseError } from "./error";
import { VERSION } from "./version";

const BASE_URL = "https://api.a22a.sh";
const TIMEOUT = 30_000;

interface IHttpClient {
  get<T>(path: string, response: z.ZodType<T>): Promise<T>;
  post<T>(path: string, body: object, response: z.ZodType<T>): Promise<T>;
}

export class HttpClient implements IHttpClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetch: typeof globalThis.fetch = globalThis.fetch,
    readonly baseURL: string = BASE_URL
  ) {}

  public async get<T>(path: string, response: z.ZodType<T>): Promise<T> {
    return this.request({ method: "GET", path, response });
  }

  public async post<T>(
    path: string,
    body: object,
    response: z.ZodType<T>
  ): Promise<T> {
    return this.request({
      method: "POST",
      path,
      body: JSON.stringify(body),
      response
    });
  }

  private async request<T>(params: {
    method: "GET" | "POST";
    path: string;
    body?: string;
    response: z.ZodType<T>;
  }): Promise<T> {
    const raw = await this.send(params.method, params.path, params.body);
    const requestId = raw.headers.get("x-request-id") ?? undefined;
    const json = this.parseJson(await raw.text());
    if (!raw.ok) throw APIError.generate(raw.status, json, requestId);

    const parsed = params.response.safeParse(json);
    if (!parsed.success) {
      throw new InvalidResponseError({
        status: raw.status,
        body: json,
        requestId,
        cause: parsed.error
      });
    }

    return parsed.data;
  }

  private async send(
    method: "GET" | "POST",
    path: string,
    body?: string
  ): Promise<Response> {
    try {
      return await this.fetch(new URL(path, this.baseURL), {
        method,
        body,
        headers: {
          "x-api-key": this.apiKey,
          "user-agent": `a22a-node/${VERSION}`,
          "content-type": "application/json",
          accept: "application/json"
        },
        signal: AbortSignal.timeout(TIMEOUT)
      });
    } catch (cause) {
      throw new APIConnectionError({ cause });
    }
  }

  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
