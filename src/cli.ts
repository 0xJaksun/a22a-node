import { parseArgs } from "node:util";
import { VERSION } from "./version";

export type CliDeps = {
  out: (line: string) => void;
  err: (line: string) => void;
};

const USAGE = `usage: a22a <command>

  -v, --version
  -h, --help`;

export async function run(args: string[], deps: CliDeps): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      version: { type: "boolean", short: "v" },
      help: { type: "boolean", short: "h" }
    },
    allowPositionals: true
  });

  if (values.version) {
    deps.out(VERSION);
    return 0;
  }
  if (values.help) {
    deps.out(USAGE);
    return 0;
  }

  const [command = "help"] = positionals;

  switch (command) {
    case "help":
      deps.out(USAGE);
      return 0;
    default:
      deps.err(`a22a: unknown command "${command}"`);
      deps.out(USAGE);
      return 2;
  }
}
