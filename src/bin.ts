#!/usr/bin/env node
import { Cli } from "./cli/cli";
import { IO } from "./cli/io";

const cli = new Cli({
  io: new IO(console),
  env: process.env,
  cwd: process.cwd()
});

process.exitCode = await cli.run(process.argv.slice(2));
