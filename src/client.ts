import { HttpClient } from "./http";
import { Deployments } from "./resources/deployments";

export type ClientOptions = {
  apiKey: string;
};

export class A22A {
  readonly deployments: Deployments;

  constructor(options: ClientOptions) {
    const http = new HttpClient(options.apiKey);
    this.deployments = new Deployments(http);
  }
}
