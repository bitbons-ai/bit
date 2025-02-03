import inquirer from 'inquirer';
import ora from 'ora';
import kleur from 'kleur';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

async function copyDir(src, dest, replacements = {}) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, replacements);
    } else {
      let content = await fs.readFile(srcPath, 'utf-8');
      
      // Replace placeholders
      for (const [key, value] of Object.entries(replacements)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      
      await fs.writeFile(destPath, content);
    }
  }
}

async function validateProjectName(name) {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error('Project name can only contain lowercase letters, numbers, and hyphens');
  }
  
  try {
    await fs.access(path.resolve(process.cwd(), name));
    throw new Error(`Directory ${name} already exists`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true;
    }
    throw error;
  }
}

async function createProjectStructure(projectPath, projectName, features) {
  const replacements = {
    name: projectName,
  };

  // Create base directories
  await fs.mkdir(projectPath, { recursive: true });
  await fs.mkdir(path.join(projectPath, 'apps'), { recursive: true });

  // Copy docker-compose.yml
  if (features.includes('docker')) {
    let content = await fs.readFile(path.join(TEMPLATES_DIR, 'docker-compose.yml'), 'utf-8');
    content = content.replace(/{{name}}/g, projectName);
    await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), content);
  }

  // Setup Astro frontend
  if (features.includes('astro')) {
    const webPath = path.join(projectPath, 'apps', 'web');
    
    // Create web directory
    await fs.mkdir(webPath, { recursive: true });

    // Initialize Astro project using npm create
    console.log(kleur.blue('\nInitializing Astro project...'));
    try {
      const { spawn } = await import('child_process');
      const astroInit = spawn(
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
          "false",
          "--yes",
        ],
        {
          cwd: webPath,
          stdio: "inherit",
        }
      );

      // Wait for the process to complete
      await new Promise((resolve, reject) => {
        astroInit.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Astro initialization failed with code ${code}`));
          }
        });
        astroInit.on('error', reject);
      });
      // Create essential directories
      console.log(kleur.blue('\nCreating project structure...'));
      await fs.mkdir(path.join(webPath, 'src', 'components'), { recursive: true });
      await fs.mkdir(path.join(webPath, 'src', 'css'), { recursive: true });
      await fs.mkdir(path.join(webPath, 'src', 'layouts'), { recursive: true });
      await fs.mkdir(path.join(webPath, 'src', 'lib'), { recursive: true });
      await fs.mkdir(path.join(webPath, 'src', 'pages'), { recursive: true });
      await fs.mkdir(path.join(webPath, 'public'), { recursive: true });

      // Copy our custom template files
      console.log(kleur.blue('\nCustomizing Astro setup...'));
      await copyDir(
        path.join(TEMPLATES_DIR, 'web'),
        webPath,
        replacements
      );

      // Copy .env.example to .env
      const envExamplePath = path.join(webPath, '.env.example');
      const envPath = path.join(webPath, '.env');
      if (await fs.access(envExamplePath).then(() => true).catch(() => false)) {
        await fs.copyFile(envExamplePath, envPath);
      }
    } catch (error) {
      console.error(kleur.red('Failed to initialize Astro project:'), error);
      throw error;
    }
  }

  // Setup PocketBase
  if (features.includes('pocketbase')) {
    const pbPath = path.join(projectPath, 'apps', 'pb');
    
    // Create directory structure
    await fs.mkdir(pbPath, { recursive: true });
    await fs.mkdir(path.join(pbPath, 'pb_data'), { recursive: true });
    await fs.mkdir(path.join(pbPath, 'pb_migrations'), { recursive: true });

    // Copy Dockerfile and fly.toml
    await copyDir(
      path.join(TEMPLATES_DIR, 'pb'),
      pbPath,
      replacements
    );
  }

  // Create root package.json
  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify({
      name: projectName,
      version: '0.0.1',
      private: true,
      scripts: {
        "dev": "docker compose up",
        "build": "docker compose build",
        "start": "docker compose up -d",
        "stop": "docker compose down",
        "clean": "docker compose down -v"
      }
    }, null, 2)
  );

  // Create root .gitignore
  await fs.writeFile(
    path.join(projectPath, '.gitignore'),
    `# Dependencies
node_modules
.pnp
.pnp.js

# Environment variables
.env
.env.*
!.env.example

# Build outputs
dist
.astro

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# PocketBase data
apps/pb/pb_data/
apps/pb/pb_migrations/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`
  );

  // Install dependencies
  const { execSync } = await import('child_process');
  
  console.log(kleur.blue('\nInstalling root dependencies...'));
  try {
    execSync('npm install', {
      cwd: projectPath,
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(kleur.red('Failed to install root dependencies:'), error);
    throw error;
  }

  if (features.includes('astro')) {
    console.log(kleur.blue('\nInstalling Astro dependencies...'));
    try {
      execSync('npm install', {
        cwd: path.join(projectPath, 'apps', 'web'),
        stdio: 'inherit'
      });
    } catch (error) {
      console.error(kleur.red('Failed to install Astro dependencies:'), error);
      throw error;
    }
  }

  console.log(kleur.green('\nProject setup complete! 🎉'));
}

export function newCommand(program) {
  program
    .command('new')
    .argument('<project-name>', 'Name of the project')
    .description('Create a new project')
    .action(async (projectName) => {
      const spinner = ora('Creating project...').start();
      try {
        await validateProjectName(projectName);
        const projectPath = path.resolve(process.cwd(), projectName);
        const answers = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'features',
            message: 'Select features to include:',
            choices: [
              { name: 'PocketBase Integration', value: 'pocketbase', checked: true },
              { name: 'Docker Compose Setup', value: 'docker', checked: true },
              { name: 'Monorepo Structure', value: 'monorepo', checked: true },
              { name: 'Astro Frontend', value: 'astro', checked: true }
            ]
          }
        ]);
        await createProjectStructure(projectPath, projectName, answers.features);
        spinner.succeed(kleur.green(`Project ${projectName} created successfully!`));
        console.log(kleur.green('\nNext steps:'));
        console.log(kleur.white(`  cd ${projectName}`));
        console.log(kleur.white('  npm run dev     # Start development environment'));
        console.log(kleur.white('  npm run build   # Build Docker images'));
        console.log(kleur.white('  npm run start   # Start in detached mode'));
        console.log(kleur.white('  npm run stop    # Stop containers'));
        console.log(kleur.white('  npm run clean   # Stop and remove volumes\n'));
      } catch (error) {
        spinner.fail(kleur.red(`Failed to create project: ${error.message}`));
      }
    });
}
