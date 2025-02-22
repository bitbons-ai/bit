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
  if (!projectRoot) {
    console.error(kleur.red('Not in a bit project'));
    process.exit(1);
  }

  const spinner = ora('Starting development environment...').start();

  try {
    // Check if docker-compose.yml exists
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    try {
      await fs.access(composePath);
    } catch (error) {
      spinner.fail(kleur.red('docker-compose.yml not found'));
      console.error(kleur.yellow(`Expected at: ${composePath}`));
      process.exit(1);
    }

    // Build and start services
    spinner.text = 'Starting services...';
    
    try {
      // Start services in detached mode
      execSync('docker compose up -d --build', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          FORCE_COLOR: 'true'
        }
      });
    } catch (error) {
      spinner.fail(kleur.red('Failed to start Docker services'));
      console.error(kleur.yellow('Try running `docker compose up` to see detailed error messages'));
      process.exit(1);
    }

    // Wait for services to be ready
    spinner.text = 'Waiting for services to be ready...';
    
    // Give services time to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      // Check if services are running
      const { stdout } = execSync('docker compose ps --format json', {
        env: {
          ...process.env,
          FORCE_COLOR: 'true'
        }
      });
      
      const containers = JSON.parse(stdout);
      const allRunning = containers.every(container => container.State === 'running');
      
      if (!allRunning) {
        spinner.fail(kleur.red('Some services failed to start'));
        console.error(kleur.yellow('Try running `docker compose logs` to see what went wrong'));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(kleur.red('Failed to verify service status'));
      console.error(kleur.yellow('Try running `docker compose ps` to check container status'));
      process.exit(1);
    }

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
      if (!projectRoot) {
        process.exit(1);
      }
      startProject(projectRoot);
    });

  // Add restart command
  program
    .command('restart')
    .description('Restart the web container (useful after installing new packages)')
    .action((options) => {
      const projectRoot = ensureProjectRoot();
      if (!projectRoot) {
        process.exit(1);
      }
      restartWebContainer(projectRoot);
    });
}
