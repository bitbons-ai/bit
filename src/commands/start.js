import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execSync, spawn } from 'child_process';

async function startProject() {
  const spinner = ora('Starting development environment...').start();

  try {
    // Check if docker-compose.yml exists
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    await fs.access(composePath);

    // Build and start services
    console.log(kleur.cyan('\nStarting services...\n'));
    
    // Start services in detached mode first
    execSync('docker compose up -d --build', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: 'true'
      }
    });

    // Wait a moment for services to initialize (skip initial setup logs)
    await new Promise(resolve => setTimeout(resolve, 3000));

    spinner.succeed(kleur.green('Development environment started!'));
    console.log(kleur.blue('\nServices:'));
    console.log(kleur.white('  - Web App: ') + kleur.green('http://localhost:4321'));
    console.log(kleur.white('  - PocketBase: ') + kleur.green('http://localhost:8090'));
    console.log(kleur.white('  - PocketBase Admin: ') + kleur.green('http://localhost:8090/_/'));

    console.log(kleur.yellow('\n→ Press Ctrl+C') + kleur.cyan(' to stop viewing logs. Services will continue running.'));
    console.log(kleur.gray('→ Use ') + kleur.blue('bit logs') + kleur.gray(' to view logs again'));
    console.log(kleur.gray('→ Use ') + kleur.blue('bit stop') + kleur.gray(' to stop all services\n'));

    // Use spawn instead of execSync for better process control
    return new Promise((resolve, reject) => {
      const logsProcess = spawn('docker', ['compose', 'logs', '-f', '--since=5s'], {
        stdio: 'inherit',
        env: {
          ...process.env,
          FORCE_COLOR: 'true'
        }
      });

      logsProcess.on('exit', (code, signal) => {
        if (signal === 'SIGINT' || code === 130) {
          console.log(kleur.green('\nStopped viewing logs. ') + kleur.red('Services are still running.') + kleur.white(' Use ') + kleur.blue('bit stop') + kleur.white(' to stop them. Use ') + kleur.blue('bit start') + kleur.white(' to start them again.\n'));
          resolve();
        } else if (code !== 0) {
          reject(new Error(`Logs process exited with code ${code}`));
        } else {
          resolve();
        }
      });

      process.on('SIGINT', () => {
        logsProcess.kill('SIGINT');
      });
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      spinner.fail(kleur.red('No docker-compose.yml found in current directory'));
    } else {
      spinner.fail(kleur.red(`Failed to start development environment: ${error.message}`));
    }
    process.exit(1);
  }
}

export function startCommand(program) {
  program
    .command('start')
    .description('Start the development environment')
    .action(startProject);
}
