// src/commands/pb.js
import { exec } from "child_process";
import { promisify } from "util";
import kleur from "kleur";
import ora from "ora";
import path from "path";
import fs from "fs";
import { ContainerManager } from "../utils/container.js";
import { isPortAvailable, getProcessUsingPort } from "../utils/ports.js";

const execAsync = promisify(exec);

function getPocketBaseDir() {
  // Check if we're in a bit project
  const currentDir = process.cwd();
  const pbDir = path.join(currentDir, "apps", "pb");
  const pbDirAlt = path.join(currentDir, "pb"); // In case we're already in apps directory

  if (fs.existsSync(pbDir)) {
    return pbDir;
  } else if (fs.existsSync(pbDirAlt)) {
    return pbDirAlt;
  } else {
    throw new Error(
      "Not in a valid bit project directory. Navigate to project root or apps/pb directory.",
    );
  }
}

export async function handlePocketBaseCommand(subcommand, args = []) {
  const spinner = ora().start();

  try {
    const pbDir = getPocketBaseDir();
    process.chdir(pbDir);

    const projectName = path.basename(path.dirname(path.dirname(pbDir)));
    const container = new ContainerManager(projectName);
    const requiredPort = 8090;

    switch (subcommand) {
      case "setup": {
        spinner.text = "Installing PocketBase dependencies...";
        await execAsync("npm install");

        spinner.text = "Building Docker image...";
        await container.build();
        spinner.succeed("PocketBase setup completed");
        break;
      }

      case "start": {
        spinner.text = "Starting PocketBase...";

        if (!(await isPortAvailable(requiredPort))) {
          const pid = await getProcessUsingPort(requiredPort);
          spinner.fail(
            `Port ${requiredPort} is already in use by process ${pid}`,
          );
          console.log(kleur.yellow("\nTry these commands to fix:"));
          console.log(
            kleur.blue(`  kill ${pid}  # Stop the process using the port`),
          );
          console.log(
            kleur.blue("  bit pb start  # Try starting PocketBase again"),
          );
          process.exit(1);
        }

        await container.start();
        spinner.succeed("PocketBase is running");
        console.log("\nAvailable at:");
        console.log(kleur.green("  http://localhost:8090"));
        console.log(kleur.green("  http://localhost:8090/_/") + " (Admin UI)");
        break;
      }

      case "stop": {
        spinner.text = "Stopping PocketBase...";
        await container.stop();
        spinner.succeed("PocketBase stopped");
        break;
      }

      case "logs": {
        spinner.stop();
        const follow = args.includes("-f") || args.includes("--follow");
        const { stdout } = await container.logs(follow);
        console.log(stdout);
        break;
      }

      case "shell": {
        spinner.stop(); // Important: stop the spinner before interactive shell
        try {
          await container.shell();
        } catch (error) {
          if (error.message.includes("No such container")) {
            console.error(kleur.red("Container is not running."));
            console.log(kleur.yellow("\nTry starting it first:"));
            console.log(kleur.blue("  bit pb start"));
          } else {
            throw error;
          }
        }
        break;
      }

      case "cleanup": {
        spinner.text = "Cleaning up PocketBase...";
        await container.cleanup({
          all: args.includes("--all"),
          data: args.includes("--data"),
        });

        spinner.succeed("PocketBase cleaned up successfully");
        console.log("\nCleaned:");
        console.log(kleur.blue("  ✓ Stopped container"));
        console.log(kleur.blue("  ✓ Removed container"));
        if (args.includes("--all"))
          console.log(kleur.blue("  ✓ Removed Docker image"));
        if (args.includes("--data"))
          console.log(kleur.blue("  ✓ Removed data"));
        break;
      }

      default: {
        spinner.fail(kleur.red(`Unknown PocketBase command: ${subcommand}`));
        console.log(kleur.blue("\nAvailable commands:"));
        console.log("  setup     First-time PocketBase setup");
        console.log("  start     Start PocketBase");
        console.log("  stop      Stop PocketBase");
        console.log("  logs      Show PocketBase logs");
        console.log("  shell     Access PocketBase shell");
        console.log("  cleanup   Clean up PocketBase containers and data");
        process.exit(1);
      }
    }
  } catch (error) {
    spinner.fail(kleur.red(error.message));
    if (error.message.includes("Not in a valid bit project directory")) {
      console.log(kleur.yellow("\nMake sure you are in:"));
      console.log(kleur.blue("  - The project root directory"));
      console.log(kleur.blue("  - Or the apps/pb directory"));
    }
    process.exit(1);
  }
}
