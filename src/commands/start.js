// src/commands/start.js
import { exec, spawn } from "child_process";
import { promisify } from "util";
import kleur from "kleur";
import ora from "ora";
import { join } from "path";
import { ContainerManager } from "../utils/container.js";

const execAsync = promisify(exec);

async function isPortAvailable(port) {
  try {
    const { stdout } = await execAsync(`lsof -i :${port}`);
    return stdout.trim() === "";
  } catch (error) {
    return true;
  }
}

function formatLog(source, message) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix =
    source === "pb" ? kleur.blue("[PocketBase]") : kleur.green("[Astro]");
  return `${kleur.gray(timestamp)} ${prefix} ${message}`;
}

async function streamPocketBaseLogs(container) {
  const logs = spawn("docker", ["logs", "-f", container.containerName], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  logs.stdout.on("data", (data) => {
    console.log(formatLog("pb", data.toString().trim()));
  });

  logs.stderr.on("data", (data) => {
    console.error(formatLog("pb", kleur.red(data.toString().trim())));
  });

  return logs;
}

async function startAstro(projectDir) {
  return new Promise((resolve, reject) => {
    const astroProcess = spawn("npm", ["run", "dev"], {
      cwd: join(projectDir, "apps", "web"),
      stdio: "pipe",
      shell: true,
    });

    let started = false;

    astroProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(formatLog("astro", output.trim()));

      // Check if Astro has started successfully
      if (
        !started &&
        (output.includes("Local:") || output.includes("http://localhost:"))
      ) {
        started = true;
        resolve(astroProcess);
      }
    });

    astroProcess.stderr.on("data", (data) => {
      console.error(formatLog("astro", kleur.red(data.toString().trim())));
    });

    astroProcess.on("error", (err) => {
      reject(new Error(`Failed to start Astro: ${err.message}`));
    });

    setTimeout(() => {
      if (!started) {
        reject(new Error("Astro failed to start within timeout"));
      }
    }, 30000);
  });
}

export async function handleStartCommand() {
  const projectDir = process.cwd();
  const projectName = projectDir.split("/").pop();
  const container = new ContainerManager(projectName);
  let currentSpinner = ora().start();

  try {
    // Check if we're in a project directory
    try {
      await execAsync("ls apps/pb && ls apps/web");
    } catch (error) {
      throw new Error(
        "Not in a valid bit project directory. Navigate to project root.",
      );
    }

    // Check ports
    currentSpinner.text = "Checking ports...";
    const pbPort = 8090;
    const astroPort = 4321;

    if (!(await isPortAvailable(pbPort))) {
      throw new Error(`Port ${pbPort} is already in use (PocketBase)`);
    }
    if (!(await isPortAvailable(astroPort))) {
      throw new Error(`Port ${astroPort} is already in use (Astro)`);
    }

    // Start PocketBase
    currentSpinner.text = "Starting PocketBase...";
    try {
      await container.start();
    } catch (error) {
      throw new Error(`Failed to start PocketBase: ${error.message}`);
    }
    currentSpinner.succeed("PocketBase started successfully");

    // Start log streaming for PocketBase
    const pbLogs = await streamPocketBaseLogs(container);

    // Start Astro
    currentSpinner = ora("Starting Astro...").start();
    try {
      const astroProcess = await startAstro(projectDir);
      currentSpinner.succeed("Development environment ready!");

      console.log("\nAvailable endpoints:");
      console.log("PocketBase:  " + kleur.green("http://localhost:8090"));
      console.log("Admin UI:    " + kleur.green("http://localhost:8090/_/"));
      console.log("Astro:       " + kleur.green("http://localhost:4321"));

      console.log(
        "\nPress " + kleur.cyan("Ctrl+C") + " to stop all services\n",
      );

      // Handle cleanup on process exit
      process.on("SIGINT", async () => {
        console.log(kleur.yellow("\nShutting down..."));
        astroProcess.kill();
        pbLogs.kill();
        await container.stop();
        process.exit(0);
      });
    } catch (error) {
      pbLogs.kill();
      await container.stop();
      throw new Error(`Failed to start Astro: ${error.message}`);
    }
  } catch (error) {
    currentSpinner.fail(kleur.red(error.message));

    if (error.message.includes("Not in a valid bit project directory")) {
      console.log(
        kleur.yellow("\nMake sure you are in the project root directory"),
      );
      console.log(kleur.blue("Example: cd my-project"));
    } else if (error.message.includes("Port")) {
      console.log(kleur.yellow("\nTry these commands to fix:"));
      console.log(kleur.blue("  bit pb stop        # Stop PocketBase"));
      console.log(kleur.blue("  bit pb cleanup     # Clean up containers"));
    }

    process.exit(1);
  }
}
