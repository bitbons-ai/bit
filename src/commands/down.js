import { execSync } from 'child_process';
import kleur from 'kleur';
import { ensureProjectRoot } from '../utils/common.js';

async function downProject(projectRoot) {
  try {
    if (!projectRoot) {
      process.exit(1);
    }

    console.log(kleur.cyan('\nStopping and removing containers...\n'));
    execSync('docker compose down', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: 'true'
      }
    });
    console.log(kleur.green('Development environment removed'));
  } catch (error) {
    console.error(kleur.red('Failed to remove development environment'));
    process.exit(1);
  }
}

export function downCommand(program) {
  program
    .command('down')
    .description('Stop and remove development containers')
    .action((options) => {
      const projectRoot = ensureProjectRoot();
      downProject(projectRoot);
    });
}