import { execSync } from 'child_process';
import kleur from 'kleur';
import { ensureProjectRoot } from '../utils/common.js';

async function logsProject(projectRoot) {
  try {
    // Ensure we're in the project root
    if (!projectRoot) {
      process.exit(1);
    }

    execSync('docker compose logs -f', { 
      stdio: 'inherit',
      cwd: projectRoot,
      env: {
        ...process.env,
        FORCE_COLOR: 'true'
      }
    });
  } catch (error) {
    console.error(kleur.red('Failed to fetch logs'));
    process.exit(1);
  }
}

export function logsCommand(program) {
  program
    .command('logs')
    .description('View development logs (press Ctrl+C to exit)')
    .action((options) => {
      const projectRoot = ensureProjectRoot();
      logsProject(projectRoot);
    });
}