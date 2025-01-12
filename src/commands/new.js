import { mkdir, writeFile } from "fs/promises";
import kleur from "kleur";
import ora from "ora";
import fetch from "node-fetch";
import { spawn } from "child_process";
import path from "path";
import generatePackageJson from "../templates/pb-package.json.js";
import generateDockerfile from "../templates/dockerfile.js";
import generateFlyToml from "../templates/fly.toml.js";
import generateGithubWorkflow from "../templates/deploy.yml.js";

async function getLatestPocketBaseVersion() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/pocketbase/pocketbase/releases/latest",
    );
    const data = await response.json();
    return data.tag_name.replace("v", "");
  } catch (error) {
    console.warn(
      kleur.yellow(
        "Warning: Failed to fetch latest PocketBase version, falling back to default version",
      ),
    );
    return "0.22.25";
  }
}

async function createPocketBase(projectPath, projectName, spinner) {
  // Create PocketBase directories
  spinner.text = "Creating PocketBase directories...";
  await mkdir(path.join(projectPath, "apps", "pb", "pb_migrations"), {
    recursive: true,
  });
  await mkdir(path.join(projectPath, "apps", "pb", "pb_hooks"), {
    recursive: true,
  });
  await mkdir(path.join(projectPath, "apps", "pb", "pb_data"), {
    recursive: true,
  });
  await mkdir(path.join(projectPath, ".github", "workflows"), {
    recursive: true,
  });

  // Create .gitkeep files
  await writeFile(
    path.join(projectPath, "apps", "pb", "pb_migrations", ".gitkeep"),
    "",
  );
  await writeFile(
    path.join(projectPath, "apps", "pb", "pb_hooks", ".gitkeep"),
    "",
  );

  // Get PocketBase version
  spinner.text = "Fetching latest PocketBase version...";
  const pbVersion = await getLatestPocketBaseVersion();

  // Generate configuration files
  spinner.text = "Generating PocketBase configuration files...";
  const files = [
    [
      path.join(projectPath, "apps", "pb", "package.json"),
      generatePackageJson(projectName),
    ],
    [
      path.join(projectPath, "apps", "pb", "Dockerfile"),
      generateDockerfile(pbVersion),
    ],
    [
      path.join(projectPath, "apps", "pb", "fly.toml"),
      generateFlyToml(projectName),
    ],
  ];

  // Write all files
  try {
    await Promise.all(
      files.map(([filePath, content]) =>
        writeFile(
          filePath,
          typeof content === "string"
            ? content
            : JSON.stringify(content, null, 2),
        ),
      ),
    );
  } catch (error) {
    throw new Error(`Failed to write configuration files: ${error.message}`);
  }
}

async function createAstro(projectPath, spinner) {
  spinner.text = "Creating Astro app...";
  try {
    await mkdir(path.join(projectPath, "apps", "web"), { recursive: true });

    // Create Astro project
    await new Promise((resolve, reject) => {
      const process = spawn(
        "npm",
        [
          "create",
          "astro@latest",
          ".",
          "--",
          "--template=minimal",
          "--typescript",
          "strict",
          "--git",
          "false",
          "--install",
          "true",
          "--yes",
        ],
        {
          cwd: path.join(projectPath, "apps", "web"),
          stdio: "inherit",
        },
      );

      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Astro creation failed with code ${code}`));
        }
      });

      process.on("error", (err) => {
        reject(new Error(`Failed to start Astro creation: ${err.message}`));
      });
    });

    // Create additional directories
    spinner.text = "Creating additional Astro directories...";
    await mkdir(path.join(projectPath, "apps", "web", "src", "components"), {
      recursive: true,
    });
    await mkdir(path.join(projectPath, "apps", "web", "src", "layouts"), {
      recursive: true,
    });

    // Optionally add .gitkeep files to keep empty directories in git
    await writeFile(
      path.join(projectPath, "apps", "web", "src", "components", ".gitkeep"),
      "",
    );
    await writeFile(
      path.join(projectPath, "apps", "web", "src", "layouts", ".gitkeep"),
      "",
    );
  } catch (error) {
    throw new Error(`Failed to create Astro app: ${error.message}`);
  }
}

export async function createProject(name) {
  const projectPath = `./${name}`;
  let currentSpinner = null;

  try {
    // Create root directory
    currentSpinner = ora("Creating project directories...").start();
    await mkdir(projectPath);
    await mkdir(path.join(projectPath, "apps"));
    await mkdir(path.join(projectPath, ".github", "workflows"), {
      recursive: true,
    }); // Ensure workflows directory exists
    currentSpinner.succeed();

    // Create PocketBase setup
    currentSpinner = ora("Setting up PocketBase...").start();
    await createPocketBase(projectPath, name, currentSpinner);
    currentSpinner.succeed("PocketBase setup completed");

    // Create Astro app
    currentSpinner = ora("Setting up Astro...").start();
    await createAstro(projectPath, currentSpinner);
    currentSpinner.succeed("Astro setup completed");

    // Add GitHub workflow file
    currentSpinner = ora("Setting up GitHub workflow...").start();
    await writeFile(
      path.join(projectPath, ".github", "workflows", "deploy_pocketbase.yml"),
      generateGithubWorkflow(),
    );
    currentSpinner.succeed("GitHub workflow setup completed");

    // Final success message with CLI-based instructions
    console.log("\n" + kleur.bold("Project created successfully! 🎉"));

    console.log("\n" + kleur.bold("Next steps:"));
    console.log(kleur.blue(`  cd ${name}`));
    console.log(kleur.blue("  bit pb setup    # First-time PocketBase setup"));
    console.log(kleur.blue("  bit pb start    # Start PocketBase"));
    console.log(
      kleur.blue("  bit start       # Start both PocketBase and Astro"),
    );

    console.log("\n" + kleur.bold("Available endpoints:"));
    console.log("PocketBase:  " + kleur.green("http://localhost:8090"));
    console.log("Admin UI:    " + kleur.green("http://localhost:8090/_/"));
    console.log("Astro:       " + kleur.green("http://localhost:4321"));

    console.log("\n" + kleur.bold("Project structure:"));
    console.log(kleur.blue(`${name}/`));
    console.log(kleur.blue("├── apps/"));
    console.log(kleur.blue("│   ├── web/          # Astro app"));
    console.log(kleur.blue("│   │   ├── src/"));
    console.log(kleur.blue("│   │   │   ├── components/"));
    console.log(kleur.blue("│   │   │   ├── layouts/"));
    console.log(kleur.blue("│   │   │   └── pages/"));
    console.log(kleur.blue("│   │   └── package.json"));
    console.log(kleur.blue("│   └── pb/           # PocketBase"));
    console.log(kleur.blue("│       ├── pb_data/"));
    console.log(kleur.blue("│       ├── pb_migrations/"));
    console.log(kleur.blue("│       ├── pb_hooks/"));
    console.log(kleur.blue("│       ├── Dockerfile"));
    console.log(kleur.blue("│       └── package.json"));
    console.log(kleur.blue("└── .github/"));
    console.log(kleur.blue("    └── workflows/"));
    console.log(kleur.blue("        └── deploy_pocketbase.yml"));
  } catch (error) {
    if (currentSpinner) {
      currentSpinner.fail(kleur.red("Failed to create project"));
    }
    console.error(kleur.red(error.message));
    process.exit(1);
  }
}
