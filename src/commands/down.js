import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execSync } from 'child_process';
import { ensureProjectRoot } from '../utils/common.js';

async function downProject() {
  try {
    // Ensure we're in the project root
    if (!ensureProjectRoot()) {
      process.exit(1);
    }

    const spinner = ora('Removing development environment...').start();

    // Check if docker-compose.yml exists
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    await fs.access(composePath);

    console.log(kleur.cyan('\nStopping and removing containers...\n'));
    execSync('docker compose down -v', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: 'true'
      }
    });

    spinner.succeed(kleur.green('Development environment removed!'));
    console.log(kleur.white('\nAll containers and volumes have been removed.'));
    console.log(kleur.white('Use ') + kleur.blue('bit start') + kleur.white(' to start fresh\n'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(kleur.red('No docker-compose.yml found in current directory'));
    } else {
      console.error(kleur.red(`Failed to remove development environment: ${error.message}`));
    }
    process.exit(1);
  }
}

export function downCommand(program) {
  program
    .command('down')
    .description('Stop and remove development containers')
    .action(downProject);
}