#!/usr/bin/env node
import meow from "meow";
import kleur from "kleur";
import process from "node:process";
import { checkRequiredTools } from "./utils/check-tools.js";
import { createProject } from "./commands/new.js";
import { handleDbCommand } from "./commands/db.js";
import { handlePocketBaseCommand } from "./commands/pb.js";
import { handleStartCommand } from "./commands/start.js";
import { handleVersionCommand } from "./commands/version.js";
import { handleUpgradeCommand } from "./commands/upgrade.js";

const cli = meow(
  `
  ${kleur.cyan("🌱 bit")}  ${kleur.gray("Better Install This")}

  ${kleur.bold("Usage:")}
    ${kleur.green("$")} bit <command> [options]

  ${kleur.bold("Commands:")}
    ${kleur.blue("new")} [name]      Create a new project
    ${kleur.blue("start")}          Start development environment
    ${kleur.blue("version")}        Show current version
    ${kleur.blue("upgrade")}        Upgrade to latest version

    ${kleur.bold("PocketBase Commands:")}
    ${kleur.blue("pb setup")}        First-time PocketBase setup
    ${kleur.blue("pb start")}        Start PocketBase
    ${kleur.blue("pb stop")}         Stop PocketBase
    ${kleur.blue("pb logs")}         Show PocketBase logs
    ${kleur.blue("pb shell")}        Access PocketBase shell
    ${kleur.blue("pb cleanup")}      Clean up containers and data

    ${kleur.bold("Database Commands:")}
    ${kleur.blue("db studio")}       Open PocketBase Admin UI
    ${kleur.blue("db backup")}       Create database backup
    ${kleur.blue("db migrate")}      Create new migration

  ${kleur.bold("Examples:")}
    ${kleur.green("$")} bit new my-awesome-app
    ${kleur.green("$")} bit pb setup
    ${kleur.green("$")} bit start
    ${kleur.green("$")} bit pb logs -f

  ${kleur.gray("For more info, visit: https://github.com/bitbonsai/bit")}
`,
  {
    importMeta: import.meta,
    flags: {},
    description: false,
  },
);

async function run() {
  const command = cli.input[0];
  const subcommand = cli.input[1];
  const args = cli.input.slice(2);

  if (!command) {
    cli.showHelp(0);
    process.exit(0);
  }

  // Check required tools before executing command
  await checkRequiredTools(command);

  switch (command) {
    case "new": {
      const projectName = subcommand;
      if (!projectName) {
        console.error(kleur.red("Project name is required"));
        process.exit(1);
      }
      await createProject(projectName);
      break;
    }
    case "start": {
      await handleStartCommand();
      break;
    }
    case "version": {
      await handleVersionCommand();
      break;
    }
    case "upgrade": {
      await handleUpgradeCommand();
      break;
    }
    case "pb": {
      if (!subcommand) {
        console.error(kleur.red("PocketBase subcommand is required"));
        console.log(kleur.blue("\nAvailable commands:"));
        console.log("  setup    First-time PocketBase setup");
        console.log("  start    Start PocketBase");
        console.log("  stop     Stop PocketBase");
        console.log("  cleanup  Clean up containers and data");
        process.exit(1);
      }
      await handlePocketBaseCommand(subcommand, args);
      break;
    }
    case "docker": {
      if (!subcommand) {
        console.error(kleur.red("Docker subcommand is required"));
        console.log(kleur.blue("\nAvailable commands:"));
        console.log("  build    Build Docker image");
        console.log("  up       Start container");
        console.log("  down     Stop container");
        console.log("  logs     Show container logs");
        console.log("  shell    Access container shell");
        process.exit(1);
      }
      await handleDockerCommand(subcommand, args);
      break;
    }
    case "db": {
      if (!subcommand) {
        console.error(kleur.red("Database subcommand is required"));
        console.log(kleur.blue("\nAvailable commands:"));
        console.log("  studio   Open PocketBase Admin UI");
        console.log("  backup   Create database backup");
        console.log("  migrate  Create new migration");
        process.exit(1);
      }
      await handleDbCommand(subcommand, args);
      break;
    }
    default: {
      console.log(kleur.red(`Unknown command: ${command}`));
      cli.showHelp(0);
      process.exit(1);
    }
  }
}

run().catch((error) => {
  console.error(kleur.red("Error:"), error.message);
  process.exit(1);
});
