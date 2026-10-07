import { VERSION } from "../version";
import type { IO } from "./io";
import { DIR, Projects } from "./projects";

const USAGE = `usage: a22a <command>

  list [project]     list every project under ./${DIR}/ and its workflows, or the one named
  deploy [project]   deploy every project under ./${DIR}/, or the one named

  --dir <path>       the projects folder, default ./${DIR}
  --api-key <key>    for deploy, else A22A_API_KEY
  -v, --version
  -h, --help`;

export type Env = { A22A_API_KEY?: string };

export class Cli {
  constructor(private readonly deps: { io: IO; env: Env; cwd: string }) {}

  public async run(args: string[]): Promise<number> {
    const { io, env } = this.deps;
    const command = io.parse(args);

    switch (command.name) {
      case "version":
        io.out(VERSION);
        return 0;
      case "help":
        io.out(USAGE);
        return 0;
      case "list":
        return io.result(
          await this.projects(command.dir).list(command.project)
        );
      case "deploy": {
        const apiKey = command.apiKey ?? env.A22A_API_KEY;
        if (apiKey === undefined) {
          return this.usage("no api key: pass --api-key or set A22A_API_KEY");
        }
        return io.result(
          await this.projects(command.dir).deploy(command.project, apiKey)
        );
      }
      case "invalid":
        return this.usage(command.message);
    }
  }

  private projects(dir = DIR): Projects {
    return new Projects(this.deps.cwd, dir);
  }

  /** The problem, then how to call us. */
  private usage(message: string): number {
    this.deps.io.err(message);
    this.deps.io.out(USAGE);
    return 2;
  }
}
