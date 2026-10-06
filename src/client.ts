import { HttpClient } from "./http";
import { Deployments } from "./resources/deployments";
import { Runs } from "./resources/runs";

export type ClientOptions = {
  apiKey: string;
};

export class A22A {
  readonly deployments: Deployments;
  readonly runs: Runs;

  constructor(options: ClientOptions) {
    const http = new HttpClient(options.apiKey);
    this.deployments = new Deployments(http);
    this.runs = new Runs(http);
  }
}
