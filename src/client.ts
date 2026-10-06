import * as Errors from "./error";
import { HttpClient } from "./http";
import { Projects } from "./resources/projects";
import { Runs } from "./resources/runs";
import { Webhooks } from "./resources/webhooks";

export type ClientOptions = {
  apiKey: string;
};

export class A22A {
  static errors = Errors;

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

/** The error classes as types, so `A22A.errors.NotFoundError` annotates as well as narrows. */
export namespace A22A {
  export namespace errors {
    export type A22AError = Errors.A22AError;
    export type APIError = Errors.APIError;
    export type APIConnectionError = Errors.APIConnectionError;
    export type AuthenticationError = Errors.AuthenticationError;
    export type BadRequestError = Errors.BadRequestError;
    export type InternalServerError = Errors.InternalServerError;
    export type InvalidResponseError = Errors.InvalidResponseError;
    export type InvalidWebhookPayloadError = Errors.InvalidWebhookPayloadError;
    export type InvalidWebhookSignatureError =
      Errors.InvalidWebhookSignatureError;
    export type NotFoundError = Errors.NotFoundError;
  }
}
