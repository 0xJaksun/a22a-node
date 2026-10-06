import { HttpClient } from "./http";
import { Projects } from "./resources/projects";
import { Runs } from "./resources/runs";

export type ClientOptions = {
  apiKey: string;
};

export class A22A {
  readonly projects: Projects;
  readonly runs: Runs;

  constructor(options: ClientOptions) {
    const http = new HttpClient(options.apiKey);
    this.projects = new Projects(http);
    this.runs = new Runs(http);
  }
}
