import { execSync } from 'child_process';
import kleur from 'kleur';
import { ensureProjectRoot } from '../utils/common.js';

async function stopProject(projectRoot) {
  try {
    if (!projectRoot) {
      process.exit(1);
    }

    console.log(kleur.cyan('\nStopping development environment...\n'));
    execSync('docker compose stop', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: 'true'
      }
    });
    console.log(kleur.green('Development environment stopped'));
  } catch (error) {
    console.error(kleur.red('Failed to stop development environment'));
    process.exit(1);
  }
}

export function stopCommand(program) {
  program
    .command('stop')
    .description('Stop development containers')
    .action((options) => {
      const projectRoot = ensureProjectRoot();
      stopProject(projectRoot);
    });
}