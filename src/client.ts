import * as Errors from "./error";
import { HttpClient } from "./http";
import { Projects } from "./resources/projects";
import { Runs } from "./resources/runs";
import { Webhooks } from "./resources/webhooks";

export type ClientOptions = {
  apiKey: string;
  baseURL?: string;
};

export class A22A {
  static errors = Errors;

  readonly baseURL: string;
  readonly projects: Projects;
  readonly runs: Runs;
  readonly webhooks: Webhooks;

  constructor(options: ClientOptions) {
    const http = new HttpClient(
      options.apiKey,
      globalThis.fetch,
      options.baseURL
    );
    this.baseURL = http.baseURL;
    this.projects = new Projects(http);
    this.runs = new Runs(http);
    this.webhooks = new Webhooks();
  }
}
