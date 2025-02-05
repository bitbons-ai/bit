import { execSync } from 'child_process';
import kleur from 'kleur';

async function logsProject() {
  try {
    execSync('docker compose logs -f', { 
      stdio: 'inherit',
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
    .description('Show logs from all services')
    .action(logsProject);
}