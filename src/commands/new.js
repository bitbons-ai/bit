import inquirer from 'inquirer';
import ora from 'ora';
import kleur from 'kleur';
import fs from 'fs/promises';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';
import { intro, outro, text, password, isCancel } from '@clack/prompts';

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
    const busyPorts = [];
    
    for (const port of ports) {
      const available = await checkPort(port);
      if (!available) {
        busyPorts.push(port);
      }
    }
    
    if (busyPorts.length > 0) {
      spinner.fail(kleur.red(`The following ports are already in use: ${busyPorts.join(', ')}`));
      console.log(kleur.yellow('\nPlease free up these ports and try again:'));
      console.log(kleur.white('- 4321: Used by Astro development server'));
      console.log(kleur.white('- 8090: Used by PocketBase server'));
      console.log(kleur.yellow('\nTo find processes using these ports:'));
      console.log(kleur.white(`  lsof -i :${busyPorts.join(',')} # List processes`));
      console.log(kleur.yellow('\nTo stop Docker containers using these ports:'));
      console.log(kleur.white('  docker ps          # List running containers'));
      console.log(kleur.white('  docker stop <id>   # Stop a specific container'));
      process.exit(1);
    }
    
    spinner.succeed(kleur.blue('✔ Docker environment ready'));
  } catch (error) {
    spinner.fail(kleur.red('Failed to verify Docker environment'));
    console.error(error.message);
    process.exit(1);
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

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

async function getPocketBaseCredentials() {
  let email;
  while (!email) {
    email = await text({
      message: 'Enter superuser email:',
      validate: (value) => {
        if (!validateEmail(value)) {
          return 'Please enter a valid email address';
        }
      }
    });
    
    if (isCancel(email)) {
      process.exit(1);
    }
  }

  const pass = await password({
    message: 'Enter superuser password:',
  });
  
  if (isCancel(pass)) {
    process.exit(1);
  }

  return { email, pass };
}

async function createPocketBaseStructure(projectPath, version) {
  const pbPath = path.join(projectPath, 'apps', 'pb');
  
  // Create directory structure
  await fs.mkdir(pbPath, { recursive: true });
  await fs.mkdir(path.join(pbPath, 'pb_data'), { recursive: true });
  await fs.mkdir(path.join(pbPath, 'pb_migrations'), { recursive: true });

  // Copy Dockerfile and fly.toml
  await copyDir(
    path.join(TEMPLATES_DIR, 'pb'),
    pbPath
  );
}

async function createAstroStructure(projectPath, version) {
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
        "--skip-houston",
        "--no-git",
        "--no-install",
        "--no-typescript",
        "--template=minimal",
        "--yes"
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
  } catch (error) {
    console.error(kleur.red('Failed to initialize Astro project:'), error);
    throw error;
  }
}

export function newCommand(program) {
  program
    .command('new')
    .description('Create a new project')
    .argument('<name>', 'Project name')
    .option('--pb <version>', 'PocketBase version', '0.25.1')
    .option('--astro <version>', 'Astro version', '5.1.8')
    .action(async (name, options) => {
      try {
        intro(kleur.cyan('🌱 Creating your new project...'));
        
        // Verify Docker environment before proceeding
        await verifyDockerEnvironment();
        
        await validateProjectName(name);
        const { email, pass } = await getPocketBaseCredentials();
        
        console.log(kleur.yellow('\n⚠️  Please save these credentials, you\'ll need them to access the admin UI'));
        console.log(kleur.white(`Email: ${email}`));
        console.log(kleur.white(`Password: ${'*'.repeat(pass.length)}\n`));
        
        const projectPath = path.resolve(process.cwd(), name);
        
        // PocketBase setup
        const pbSpinner = ora('Installing PocketBase...').start();
        await createPocketBaseStructure(projectPath, options.pb);
        pbSpinner.succeed(kleur.blue('✔ PocketBase installed'));
        
        // Astro setup
        const astroSpinner = ora('Installing Astro...').start();
        await createAstroStructure(projectPath, options.astro);
        astroSpinner.succeed(kleur.blue('✔ Astro installed with bit\'s template'));
        
        // Create .env.development
        const envSpinner = ora('Creating environment files...').start();
        await fs.writeFile(
          path.join(projectPath, 'apps/pb/.env.development'),
          `SUPERUSER_EMAIL=${email}\nSUPERUSER_PASSWORD=${pass}\n`
        );
        envSpinner.succeed(kleur.blue('✔ Environment files created'));
        
        // Install dependencies
        const depsSpinner = ora('Installing dependencies...').start();
        const { execa } = await import('execa');
        await execa('bun', ['install'], { cwd: projectPath });
        await execa('bun', ['install'], { cwd: path.join(projectPath, 'apps/web') });
        depsSpinner.succeed(kleur.blue('✔ Dependencies installed'));
        
        outro(kleur.green('\n✨ Project created successfully!\n'));
        console.log(kleur.cyan('Next steps:'));
        console.log(kleur.white(`  cd ${name}`));
        console.log(kleur.white('  bun run dev    # Start development environment'));
        console.log(kleur.white('\nPocketBase admin UI will be available at:'));
        console.log(kleur.white('  http://localhost:8090/_/'));
        
      } catch (error) {
        console.error(kleur.red('\nError:'), error.message);
        process.exit(1);
      }
    });
}
