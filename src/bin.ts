#!/usr/bin/env node
import { Cli } from "./cli/cli";
import { IO } from "./cli/io";
import { Projects } from "./cli/projects";

const cli = new Cli({
  projects: new Projects(process.cwd()),
  io: new IO(console),
  env: process.env
});

process.exitCode = await cli.run(process.argv.slice(2));
