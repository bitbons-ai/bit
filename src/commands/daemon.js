import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import kleur from 'kleur';

async function daemonProject() {
  const spinner = ora('Starting development environment in daemon mode...').start();

  try {
    // Check if docker-compose.yml exists
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    await fs.access(composePath);

    // Build and start services in daemon mode
    console.log(kleur.cyan('\nStarting services in background...\n'));
    
    execSync('docker compose up -d --build', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: 'true' // Ensure color output in logs
      }
    });

    spinner.succeed(kleur.green('Development environment started in daemon mode!'));
    console.log(kleur.blue('\nServices:'));
    console.log(kleur.white('  - Web App: ') + kleur.green('http://localhost:4321'));
    console.log(kleur.white('  - PocketBase: ') + kleur.green('http://localhost:8090'));
    console.log(kleur.white('  - PocketBase Admin: ') + kleur.green('http://localhost:8090/_/'));
    console.log(kleur.white('\nTo view logs: ') + kleur.yellow('docker compose logs -f'));
    console.log(kleur.white('To stop: ') + kleur.yellow('bit stop'));

  } catch (error) {
    spinner.fail(kleur.red('Failed to start development environment'));
    if (error.message.includes('ENOENT')) {
      console.log(kleur.yellow('\nNo docker-compose.yml found in current directory.'));
      console.log(kleur.white('Make sure you are in a bit project directory.'));
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

export function daemonCommand(program) {
  program
    .command('daemon')
    .description('Start the development environment in daemon mode')
    .action(daemonProject);
}
