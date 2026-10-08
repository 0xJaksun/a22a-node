import { type ParseArgsConfig, parseArgs } from "node:util";
import type { Result } from "./result";

export type Output = Pick<Console, "log" | "error">;

export type Command =
  | { name: "version" }
  | { name: "help" }
  | { name: "list"; project?: string }
  | { name: "deploy"; project?: string }
  | { name: "invalid"; message: string };

/** The command, and the options that apply to any command. */
export type Parsed = { command: Command; dir?: string };

const OPTIONS = {
  version: { type: "boolean", short: "v" },
  help: { type: "boolean", short: "h" },
  dir: { type: "string" }
} satisfies ParseArgsConfig["options"];

const STRING_OPTIONS = Object.entries(OPTIONS)
  .filter(([, option]) => option.type === "string")
  .map(([name]) => name);

export class IO {
  constructor(private readonly output: Output) {}

  public parse(args: string[]): Parsed {
    const { positionals, tokens } = parseArgs({
      args,
      options: OPTIONS,
      allowPositionals: true,
      strict: false,
      tokens: true
    });

    const options = tokens.filter((token) => token.kind === "option");
    const unknown = options.find((option) => !(option.name in OPTIONS));
    if (unknown) return this.invalid(`unknown option "${unknown.rawName}"`);
    const bare = options.find(
      (option) => STRING_OPTIONS.includes(option.name) && !option.value
    );
    if (bare) return this.invalid(`${bare.rawName} needs a value`);

    const dir = options.find((option) => option.name === "dir")?.value;
    if (options.some((option) => option.name === "version")) {
      return { command: { name: "version" }, dir };
    }
    if (options.some((option) => option.name === "help")) {
      return { command: { name: "help" }, dir };
    }

    const [command = "help", project] = positionals;
    switch (command) {
      case "help":
        return { command: { name: "help" }, dir };
      case "list":
        return { command: { name: "list", project }, dir };
      case "deploy":
        return { command: { name: "deploy", project }, dir };
      default:
        return this.invalid(`unknown command "${command}"`);
    }
  }

  private invalid(message: string): Parsed {
    return { command: { name: "invalid", message } };
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
