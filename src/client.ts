import {
  A22AError,
  APIConnectionError,
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  InvalidResponseError,
  InvalidWebhookPayloadError,
  InvalidWebhookSignatureError,
  NotFoundError
} from "./error";
import { HttpClient } from "./http";
import { Projects } from "./resources/projects";
import { Runs } from "./resources/runs";
import { Webhooks } from "./resources/webhooks";

export type ClientOptions = {
  apiKey: string;
};

export class A22A {
  static errors = {
    A22AError,
    APIError,
    APIConnectionError,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    InvalidResponseError,
    InvalidWebhookPayloadError,
    InvalidWebhookSignatureError,
    NotFoundError
  };

  readonly projects: Projects;
  readonly runs: Runs;
  readonly webhooks: Webhooks;

  constructor(options: ClientOptions) {
    const http = new HttpClient(options.apiKey);
    this.projects = new Projects(http);
    this.runs = new Runs(http);
    this.webhooks = new Webhooks();
  }
}
