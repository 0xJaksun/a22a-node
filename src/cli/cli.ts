import { VERSION } from "../version";
import type { IO } from "./io";
import { DIR, type Projects } from "./projects";

const USAGE = `usage: a22a <command>

  list [project]   list every project under ./${DIR}/ and its workflows, or the one named

  -v, --version
  -h, --help`;

export class Cli {
  constructor(private readonly deps: { projects: Projects; io: IO }) {}

  public async run(args: string[]): Promise<number> {
    const { projects, io } = this.deps;
    const command = io.parse(args);

    switch (command.name) {
      case "version":
        io.out(VERSION);
        return 0;
      case "help":
        io.out(USAGE);
        return 0;
      case "list":
        return io.result(await projects.list(command.project));
      case "invalid":
        io.err(command.message);
        io.out(USAGE);
        return 2;
    }
  }
}
