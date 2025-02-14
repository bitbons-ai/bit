import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execSync } from 'child_process';

async function downProject() {
  const spinner = ora('Removing development environment...').start();

  try {
    // Check if docker-compose.yml exists
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    await fs.access(composePath);

    // Remove everything including volumes
    execSync('docker compose down -v', { 
      stdio: 'inherit'
    });

    spinner.succeed(kleur.green('Development environment removed!'));
    console.log(kleur.white('\nAll containers and volumes have been removed.'));
    console.log(kleur.white('Use ') + kleur.blue('bit start') + kleur.white(' to start fresh\n'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      spinner.fail(kleur.red('No docker-compose.yml found in current directory'));
    } else {
      spinner.fail(kleur.red(`Failed to remove development environment: ${error.message}`));
    }
    process.exit(1);
  }
}

export function downCommand(program) {
  program
    .command('down')
    .description('Remove all containers and volumes')
    .action(downProject);
}