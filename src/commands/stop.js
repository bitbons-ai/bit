import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execSync } from 'child_process';

async function stopProject() {
  const spinner = ora('Stopping development environment...').start();

  try {
    // Check if docker-compose.yml exists
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    await fs.access(composePath);

    // Stop services
    execSync('docker compose stop', { 
      stdio: 'inherit'
    });

    spinner.succeed(kleur.green('Development environment stopped!'));
    console.log(kleur.white('\nUse ') + kleur.blue('bit start') + kleur.white(' to start services again'));
    console.log(kleur.white('Use ') + kleur.blue('bit down') + kleur.white(' to remove all containers and volumes\n'));

  } catch (error) {
    if (error.code === 'ENOENT') {
      spinner.fail(kleur.red('No docker-compose.yml found in current directory'));
    } else {
      spinner.fail(kleur.red(`Failed to stop development environment: ${error.message}`));
    }
    process.exit(1);
  }
}

export function stopCommand(program) {
  program
    .command('stop')
    .description('Stop the development environment')
    .action(stopProject);
}