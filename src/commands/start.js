import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execSync } from 'child_process';

async function startProject() {
  const spinner = ora('Starting development environment...').start();

  try {
    // Check if docker-compose.yml exists
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    await fs.access(composePath);

    // Build and start services
    console.log(kleur.cyan('\nStarting services...\n'));
    
    // Remove the -d flag to keep watching logs
    execSync('docker compose up --build', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: 'true' // Ensure color output in logs
      }
    });

    spinner.succeed(kleur.green('Development environment started!'));
    console.log(kleur.blue('\nServices:'));
    console.log(kleur.white('  - Web App: ') + kleur.green('http://localhost:4321'));
    console.log(kleur.white('  - PocketBase: ') + kleur.green('http://localhost:8090'));
    console.log(kleur.white('  - PocketBase Admin: ') + kleur.green('http://localhost:8090/_/'));

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
