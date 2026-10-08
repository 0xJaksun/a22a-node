import { A22A } from "../client";
import { VERSION } from "../version";
import type { IO } from "./io";
import { DIR, Projects } from "./projects";

const USAGE = `usage: a22a <command>

  list [project]     list every project under ./${DIR}/ and its workflows, or the one named
  deploy [project]   deploy every project under ./${DIR}/, or the one named

  --dir <path>       the projects folder, default ./${DIR}
  -v, --version
  -h, --help

  A22A_API_KEY       needed by deploy
  A22A_DIR           the projects folder when --dir isn't given`;

export type Env = {
  A22A_API_KEY?: string;
  A22A_BASE_URL?: string;
  A22A_DIR?: string;
};

export class Cli {
  private readonly a22a?: A22A;
  private readonly dir: string;

  constructor(private readonly deps: { io: IO; env: Env; cwd: string }) {
    const { A22A_API_KEY: apiKey, A22A_BASE_URL: baseURL } = deps.env;
    if (apiKey !== undefined) this.a22a = new A22A({ apiKey, baseURL });
    this.dir = deps.env.A22A_DIR ?? DIR;
  }

  public async run(args: string[]): Promise<number> {
    const { io, cwd } = this.deps;
    const { command, dir = this.dir } = io.parse(args);
    const projects = new Projects(cwd, dir, this.a22a);

    switch (command.name) {
      case "version":
        io.out(VERSION);
        return 0;
      case "help":
        io.out(USAGE);
        return 0;
      case "list":
        return io.result(await projects.list(command.project));
      case "deploy":
        return io.result(await projects.deploy(command.project));
      case "invalid":
        return this.usage(command.message);
    }
  }

  /** The problem, then how to call us. */
  private usage(message: string): number {
    this.deps.io.err(message);
    this.deps.io.out(USAGE);
    return 2;
  }
}
