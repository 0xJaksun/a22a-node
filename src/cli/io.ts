import { type ParseArgsConfig, parseArgs } from "node:util";
import type { Result } from "./result";

export type Output = Pick<Console, "log" | "error">;

export type Command =
  | { name: "version" }
  | { name: "help" }
  | { name: "list"; project?: string }
  | { name: "deploy"; project?: string; apiKey?: string }
  | { name: "invalid"; message: string };

const OPTIONS = {
  version: { type: "boolean", short: "v" },
  help: { type: "boolean", short: "h" },
  "api-key": { type: "string" }
} satisfies ParseArgsConfig["options"];

export class IO {
  constructor(private readonly output: Output) {}

  public parse(args: string[]): Command {
    const { values, positionals, tokens } = parseArgs({
      args,
      options: OPTIONS,
      allowPositionals: true,
      strict: false,
      tokens: true
    });

    const options = tokens.filter((token) => token.kind === "option");
    const unknown = options.find((option) => !(option.name in OPTIONS));
    if (unknown) return this.invalid(`unknown option "${unknown.rawName}"`);

    if (values.version) return { name: "version" };
    if (values.help) return { name: "help" };

    const [command = "help", project] = positionals;
    switch (command) {
      case "help":
        return { name: "help" };
      case "list":
        return { name: "list", project };
      case "deploy":
        return {
          name: "deploy",
          project,
          apiKey: options.find((option) => option.name === "api-key")?.value
        };
      default:
        return this.invalid(`unknown command "${command}"`);
    }
  }

  private invalid(message: string): Command {
    return { name: "invalid", message };
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
