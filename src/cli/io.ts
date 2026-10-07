import { parseArgs } from "node:util";
import type { Result } from "./result";

export type Output = Pick<Console, "log" | "error">;

export type Command =
  | { name: "version" }
  | { name: "help" }
  | { name: "list"; project?: string }
  | { name: "unknown"; command: string };

export class IO {
  constructor(private readonly output: Output) {}

  public parse(args: string[]): Command {
    const { values, positionals } = parseArgs({
      args,
      options: {
        version: { type: "boolean", short: "v" },
        help: { type: "boolean", short: "h" }
      },
      allowPositionals: true
    });

    if (values.version) return { name: "version" };
    if (values.help) return { name: "help" };

    const [command = "help", project] = positionals;
    switch (command) {
      case "help":
        return { name: "help" };
      case "list":
        return { name: "list", project };
      default:
        return { name: "unknown", command };
    }
  }

  public out(text: string): void {
    this.output.log(text);
  }

  public err(message: string): void {
    this.output.error(`a22a: ${message}`);
  }

  public result(result: Result<string[], string>): number {
    if (!result.ok) {
      this.err(result.error);
      return 2;
    }

    for (const line of result.value) this.out(line);
    return 0;
  }
}
