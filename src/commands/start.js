import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execSync } from 'child_process';
import { ensureProjectRoot } from '../utils/common.js';

async function restartWebContainer(projectRoot) {
  try {
    if (!projectRoot) {
      process.exit(1);
    }

    console.log(kleur.cyan('\nRestarting web container...\n'));
    execSync('docker compose restart web', {
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: 'true'
      }
    });
    console.log(kleur.green('Web container restarted successfully!'));
  } catch (error) {
    console.error(kleur.red('Failed to restart web container:'), error.message);
  }
}

async function startProject(projectRoot) {
  const spinner = ora('Starting development environment...').start();

  try {
    if (!projectRoot) {
      spinner.fail(kleur.red('Not in a bit project'));
      process.exit(1);
    }

    // Check if docker-compose.yml exists
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    await fs.access(composePath);

    // Build and start services
    console.log(kleur.cyan('\nStarting services...\n'));
    
    // Start services in detached mode
    execSync('docker compose up -d --build', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: 'true'
      }
    });

    // Wait a moment for services to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    spinner.succeed(kleur.green('Development environment started!'));
    console.log(kleur.blue('\nServices:'));
    console.log(kleur.white('  - Web App: ') + kleur.green('http://localhost:4321'));
    console.log(kleur.white('  - PocketBase: ') + kleur.green('http://localhost:8090/_'));
    console.log(kleur.white('\nTip: Run ') + kleur.cyan().bold('bit logs') + kleur.white(' to view development logs'));
    console.log(kleur.gray('     Press ') + kleur.yellow().bold('Ctrl+C') + kleur.gray(' when done, services will keep running'));
  } catch (error) {
    spinner.fail(kleur.red('Failed to start development environment'));
    console.error(error.message);
    process.exit(1);
  }
}

export function startCommand(program) {
  program
    .command('start')
    .description('Start the development environment')
    .action((options) => {
      const projectRoot = ensureProjectRoot();
      startProject(projectRoot);
    });

  // Add restart command
  program
    .command('restart')
    .description('Restart the web container (useful after installing new packages)')
    .action((options) => {
      const projectRoot = ensureProjectRoot();
      restartWebContainer(projectRoot);
    });
}
