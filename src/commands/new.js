import inquirer from 'inquirer';
import ora from 'ora';
import kleur from 'kleur';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';
import { intro, outro, text, password, isCancel } from '@clack/prompts';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let pbCredsFromConfig = false;

function resolveTemplatesDir() {
  // Determine the base path for template resolution
  const baseModulePath = path.dirname(fileURLToPath(import.meta.url));

  // Get the global node_modules path
  const globalNodeModulesPath = path.join(process.env.HOME, '.nvm', 'versions', 'node',
    `v${process.version.slice(1)}`, 'lib', 'node_modules');

  // Check potential template locations in order of preference
  const potentialPaths = [
    // 1. Local project templates (current working directory)
    path.join(process.cwd(), 'src', 'templates'),

    // 2. Relative to current script (local development)
    path.join(baseModulePath, '..', 'templates'),

    // 3. Global installation paths
    path.join(baseModulePath, 'templates'),
    path.join(baseModulePath, '..', 'lib', 'templates'),

    // 4. Absolute global installation paths
    path.join(baseModulePath, '..', '..', 'templates'),

    // 5. Fallback using Node.js module resolution
    path.join(globalNodeModulesPath, '@mauricio.wolff', 'bit', 'src', 'templates'),
    path.join(globalNodeModulesPath, '@mauricio.wolff', 'bit', 'templates')
  ];

  for (const templatePath of potentialPaths) {
    try {
      // Normalize the path to resolve any symlinks or relative components
      const normalizedPath = path.resolve(templatePath);

      // Check if the templates directory exists and is readable
      fsSync.accessSync(normalizedPath, fsSync.constants.R_OK);

      // Additional check to ensure it's a directory
      const stats = fsSync.statSync(normalizedPath);
      if (stats.isDirectory()) {
        // Verify the directory contains expected template files
        const templateFiles = fsSync.readdirSync(normalizedPath);
        const requiredTemplates = ['README.md', 'package.json'];
        const hasRequiredTemplates = requiredTemplates.every(file =>
          templateFiles.includes(file)
        );

        if (hasRequiredTemplates) {
          return normalizedPath;
        }
      }
    } catch (error) {
      // Silently continue to next path
      continue;
    }
  }

  // If no valid template directory is found, throw an error with more context
  throw new Error(`Could not locate project templates. 
    Global Node Modules Path: ${globalNodeModulesPath}
    Please check your bit CLI installation.`);
}

const TEMPLATES_DIR = resolveTemplatesDir();

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

async function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

async function checkPortsAndHandleContainers(ports, spinner) {
  const busyPorts = [];
  const containersByPort = new Map();

  // Check which ports are in use
  for (const port of ports) {
    const available = await checkPort(port);
    if (!available) {
      busyPorts.push(port);
    }
  }

  if (busyPorts.length === 0) return true;

  // Find Docker containers using these ports
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}']);
    
    // Parse docker ps output and match against our busy ports
    const containers = stdout.split('\n').filter(Boolean);
    for (const container of containers) {
      const [id, name, ports] = container.split('\t');
      for (const busyPort of busyPorts) {
        if (ports.includes(`:${busyPort}`)) {
          containersByPort.set(busyPort, { id, name });
        }
      }
    }

    if (containersByPort.size > 0) {
      // Stop the spinner before showing interactive content
      spinner.stop();
      
      console.log(kleur.yellow().bold('\n⚠️  The following ports are in use by Docker containers:'));
      for (const [port, container] of containersByPort) {
        console.log(
          kleur.white('  • Port ') + 
          kleur.cyan().bold(port) + 
          kleur.white(': Container ') + 
          kleur.magenta().bold(container.name) + 
          kleur.gray(` (${container.id})`)
        );
      }

      const { shouldStop } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldStop',
        message: 'Would you like to stop these containers?',
        default: true
      }]);

      if (shouldStop) {
        spinner.text = 'Stopping containers...';
        spinner.start();
        try {
          for (const { id } of containersByPort.values()) {
            await execa('docker', ['stop', id]);
          }
          spinner.succeed('Containers stopped successfully');
          return true;
        } catch (error) {
          spinner.fail('Failed to stop containers');
          console.error(kleur.red(error.message));
          return false;
        }
      }
      return false;
    } else {
      spinner.stop();
      console.log(kleur.yellow(`\nPorts ${busyPorts.join(', ')} are in use, but not by Docker containers.`));
      console.log(kleur.white('Please free up these ports and try again.'));
    }
  } catch (error) {
    spinner.fail('Failed to check Docker containers: ' + error.message);
  }

  return false;
}

async function verifyDockerEnvironment() {
  const spinner = ora('Checking Docker environment...').start();

  try {
    const { execa } = await import('execa');

    // Check if Docker is installed
    try {
      await execa('docker', ['--version']);
    } catch (error) {
      spinner.fail(kleur.red('Docker is not installed'));
      console.log(kleur.yellow('\nPlease install Docker from https://www.docker.com/products/docker-desktop'));
      process.exit(1);
    }

    // Check if Docker daemon is running
    try {
      await execa('docker', ['info']);
    } catch (error) {
      spinner.fail(kleur.red('Docker daemon is not running'));
      console.log(kleur.yellow('\nPlease start Docker Desktop and try again'));
      process.exit(1);
    }

    // Check port availability
    const ports = [4321, 8090]; // Astro and PocketBase ports
    
    spinner.text = 'Checking port availability...';
    const portsAvailable = await checkPortsAndHandleContainers(ports, spinner);
    
    if (!portsAvailable) {
      spinner.fail(kleur.red('Required ports are not available'));
      process.exit(1);
    }

    spinner.succeed(kleur.blue('Docker environment ready'));
  } catch (error) {
    spinner.fail(kleur.red('Failed to verify Docker environment'));
    console.error(error.message);
    process.exit(1);
  }
}

async function validateProjectName(name) {
  // Allow domain names (e.g., example.com) or simple project names (e.g., my-project)
  if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$/.test(name)) {
    throw new Error('Project name must be a valid domain name (e.g., example.com) or contain only lowercase letters, numbers, and hyphens');
  }

  const projectPath = path.resolve(process.cwd(), name);

  try {
    const stats = await fs.stat(projectPath);

    if (stats.isDirectory()) {
      console.error(kleur.red(`\n❌ Error: Directory '${name}' already exists in the current directory.`));
      console.error(kleur.yellow('Please choose a different project name or remove the existing directory.\n'));
      process.exit(1);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Directory does not exist, which is good
      return true;
    }
    // Rethrow any other unexpected errors
    throw error;
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? undefined : 'Please enter a valid email address';
}

function getGitEmail() {
  try {
    return execSync('git config user.email').toString().trim();
  } catch (error) {
    return null;
  }
}

async function getPocketBaseCredentials() {
  try {
    // Try to read from config file first
    const { homedir } = await import('os');
    const configPath = path.join(homedir(), '.bit.conf');

    try {
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      if (config?.pocketbase?.admin?.email && config?.pocketbase?.admin?.password) {
        console.log(kleur.cyan('\n🔐  Using PocketBase admin credentials from ~/.bit.conf\n'));
        pbCredsFromConfig = true;
        return {
          email: config.pocketbase.admin.email,
          pass: config.pocketbase.admin.password
        };
      }
    } catch (err) {
      // Config file doesn't exist or is invalid, continue with prompts
    }

    // If no config file, prompt for credentials
    console.log(kleur.cyan('\n🔐  PocketBase Admin Setup'));
    console.log(kleur.white('These credentials will be used to access the PocketBase Admin UI'));
    console.log(kleur.white('where you can manage your database, collections and files.\n'));

    // Try to get git email for prefill
    const gitEmail = getGitEmail();

    const email = await text({
      message: 'Enter admin email:',
      ...(gitEmail && { initialValue: gitEmail }),
      validate: (value) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(value) ? undefined : 'Please enter a valid email address';
      }
    });

    if (isCancel(email)) {
      process.exit(1);
    }

    const rand = () => Math.floor(Math.random() * 1e6).toString(24);
    const randomPassword = `${rand()}-${rand()}`;

    const pass = await text({
      message: 'Enter admin password (press Enter for randomly generated one):',
      initialValue: randomPassword,
      validate: (value) => {
        if (value.length < 5) return 'Password must be at least 5 characters';
        return;
      }
    });

    if (isCancel(pass)) {
      process.exit(1);
    }

    return { email, pass };
  } catch (error) {
    console.error(kleur.red('Error getting PocketBase credentials:'), error);
    process.exit(1);
  }
}

function sanitizeProjectName(name) {
  // Replace dots and any other invalid characters with hyphens
  // fly.io app names can only contain lowercase letters, numbers, and hyphens
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

async function createProjectStructure(projectPath, name, options, pbCreds) {
  const spinner = ora('Creating project structure...').start();
  const projectName = sanitizeProjectName(name);

  try {
    console.log('Creating base directories...');
    // Create base directories
    await fs.mkdir(projectPath, { recursive: true });
    await fs.mkdir(path.join(projectPath, 'apps'), { recursive: true });

    console.log('Copying root files...');
    // Copy root level files
    const rootFiles = ['package.json', 'docker-compose.yml', 'README.md'];
    for (const file of rootFiles) {
      let content = await fs.readFile(path.join(TEMPLATES_DIR, file), 'utf-8');
      if (file === 'package.json') {
        // Use sanitized name for package.json (for fly.io compatibility)
        content = content.replace(/{{name}}/g, projectName);
      } else if (file === 'docker-compose.yml') {
        // Keep dots in the name for Docker Compose
        content = content.replace(/{{name}}/g, name.toLowerCase());
      } else {
        // Use original name for display in other files
        content = content.replace(/{{name}}/g, name);
      }
      await fs.writeFile(path.join(projectPath, file), content);
    }

    console.log('Creating Astro project...');
    // Create and initialize Astro project
    const webPath = path.join(projectPath, 'apps/web');
    await fs.mkdir(webPath, { recursive: true });

    // Initialize Astro project
    const { spawn } = await import('child_process');
    await new Promise((resolve, reject) => {
      const astroInit = spawn(
        "npm",
        [
          "create",
          "astro@latest",
          ".",
          "--",
          "--template=minimal",
          "--no-git",
          "--no-install",
          "--typescript",
          "--fancy",
          "--yes",
        ],
        {
          cwd: webPath,
          stdio: "inherit"
        }
      );

      astroInit.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Astro initialization failed with code ${code}`));
        }
      });
      astroInit.on('error', reject);
    });

    // Get latest versions for all dependencies
    const versions = await getAllDependencyVersions();

    console.log('Copying template files...');
    // Copy our template files over the base Astro project
    await copyDir(
      path.join(TEMPLATES_DIR, 'web'),
      webPath,
      { name, sanitizedName: projectName, ...versions }
    );

    console.log('Setting up PocketBase...');
    // Create and copy PocketBase files
    const pbPath = path.join(projectPath, 'apps/pb');
    await fs.mkdir(pbPath, { recursive: true });
    await copyDir(
      path.join(TEMPLATES_DIR, 'pb'),
      pbPath,
      { name, sanitizedName: projectName, pbVersion: options.pb }
    );

    // Update docker-compose environment with provided credentials
    const envContent = `SUPERUSER_EMAIL=${pbCreds.email}\nSUPERUSER_PASSWORD=${pbCreds.pass}`;
    await fs.writeFile(path.join(projectPath, '.env'), envContent);

    console.log('Creating additional directories...');
    // Create essential directories (if they don't exist)
    const dirs = [
      'apps/web/src/components',
      'apps/web/src/css',
      'apps/web/src/layouts',
      'apps/web/src/lib',
      'apps/web/src/pages',
      'apps/web/public',
      'apps/pb/pb_data',
      'apps/pb/pb_migrations'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }
    console.log('Project structure creation complete.');
    spinner.succeed(kleur.blue('Project structure created'));
  } catch (error) {
    spinner.fail(kleur.red('Failed to create project structure'));
    console.error(error.message);
    process.exit(1);
  }
}

async function getLatestPackageVersion(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    const data = await response.json();
    return data.version;
  } catch (error) {
    console.warn(`Failed to fetch latest version for ${packageName}, using fallback version`);
    return null;
  }
}

async function getAllDependencyVersions() {
  const [astroVersion, astroNodeVersion, astroIconVersion, pocketbaseVersion] = await Promise.all([
    getLatestPackageVersion('astro'),
    getLatestPackageVersion('@astrojs/node'),
    getLatestPackageVersion('astro-icon'),
    getLatestPackageVersion('pocketbase')
  ]);

  return {
    astroVersion: astroVersion || '5.2.3',
    astroNodeVersion: astroNodeVersion || '9.0.2',
    astroIconVersion: astroIconVersion || '1.1.5',
    pocketbaseVersion: pocketbaseVersion || '0.25.1'
  };
}

async function getLatestAstroVersion() {
  const version = await getLatestPackageVersion('astro');
  return version || '4.2.1';
}

async function getLatestPocketBaseVersion() {
  try {
    const response = await fetch('https://api.github.com/repos/pocketbase/pocketbase/releases/latest');
    const data = await response.json();
    return data.tag_name.replace('v', '');
  } catch (error) {
    console.warn('Failed to fetch latest PocketBase version, using fallback version');
    return '0.25.1';
  }
}

async function checkServiceReady(url, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (error) {
      // Service not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
  }
  return false;
}

export function newCommand(program) {
  program
    .command('new <project-name>')
    .description('Create a new project')
    .option('--pb <version>', 'PocketBase version', async () => await getLatestPocketBaseVersion())
    .option('--astro <version>', 'Astro version', async () => await getLatestAstroVersion())
    .action(async (name, options) => {
      try {
        intro(kleur.cyan('∴ Creating your new project...'));

        // Verify Docker environment before proceeding
        await verifyDockerEnvironment();

        await validateProjectName(name);
        const pbCreds = await getPocketBaseCredentials();

        if (!pbCredsFromConfig) {
          console.log(kleur.yellow('\n⚠️  Please save these credentials, you\'ll need them to access the admin UI'));
          console.log(kleur.white(`Email: ${pbCreds.email}`));
          console.log(kleur.white(`Password: ${pbCreds.pass}\n`));
        }

        const projectPath = path.resolve(process.cwd(), name);

        // Create project structure
        await createProjectStructure(projectPath, name, options, pbCreds);

        // Create environment files
        const envSpinner = ora('Creating environment files...').start();

        // Root environment with PocketBase credentials
        await fs.writeFile(
          path.join(projectPath, '.env.development'),
          `SUPERUSER_EMAIL=${pbCreds.email}\nSUPERUSER_PASSWORD=${pbCreds.pass}\n`
        );

        envSpinner.succeed(kleur.blue('Environment files created'));

        outro(kleur.green('\n✨ Project created successfully!'));
        
        // Start services in detached mode
        const spinner = ora('Starting services...').start();
        const { execa } = await import('execa');
        try {
          const subprocess = execa('bit', ['start'], {
            stdio: 'ignore',  // Don't show logs
            detached: true,   // Run in background
            env: { ...process.env, FORCE_COLOR: 'true' },
            cwd: projectPath  // Run in the project directory
          });
          
          // Unref the child process to allow Node.js to exit
          subprocess.unref();

          // Wait briefly for services to start
          await new Promise(resolve => setTimeout(resolve, 2000));
          spinner.succeed(kleur.green('🚀 Services started successfully'));

          // Show service information in a more organized way
          console.log(kleur.green().bold('\nServices:'));
          console.log(kleur.green('  • Web App'));
          console.log(kleur.white('    ') + kleur.cyan().underline('http://localhost:4321'));
          console.log(kleur.green('  • PocketBase'));
          console.log(kleur.white('    ') + kleur.cyan().underline('http://localhost:8090'));
          console.log(kleur.white('    Admin: ') + kleur.cyan().underline('http://localhost:8090/_/'));
          
          // Commands section - ordered by typical workflow
          console.log(kleur.white('\nCommands:'));
          console.log(kleur.white('  • ') + kleur.cyan().bold('bit logs') + kleur.white(' - Watch development logs'));
          console.log(kleur.white('    Press ') + kleur.yellow().bold('Ctrl+C') + kleur.white(' when done, services will keep running'));
          console.log(kleur.white('  • ') + kleur.cyan().bold('bit deploy') + kleur.white(' - Launch your site on fly.io'));
          console.log(kleur.white('  • ') + kleur.cyan().bold('bit stop') + kleur.white(' - Shut down the development environment'));
          
          // Wait a bit longer before opening browser
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Open web app in browser
          try {
            await execa('open', ['http://localhost:4321']);
          } catch (error) {
            // Silently handle error - we already showed the URLs above
          }

          // Change to the project directory by starting a new shell
          try {
            await execa('exec', ['$SHELL'], { 
              shell: true, 
              stdio: 'inherit',
              cwd: projectPath
            });
          } catch (error) {
            // If shell fails, just exit normally
            process.exit(0);
          }
        } catch (error) {
          spinner.fail(kleur.red('Failed to start services'));
          console.error(error.message);
          process.exit(1);
        }
      } catch (error) {
        console.error(kleur.red('\nError:'), error.message);
        process.exit(1);
      }
    });
}
