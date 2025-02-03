import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execSync } from 'child_process';

async function checkFlyInstalled() {
  try {
    execSync('flyctl version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function deployProject() {
  const spinner = ora('Preparing deployment...').start();

  try {
    // Check for Fly.io CLI
    if (!await checkFlyInstalled()) {
      spinner.fail(kleur.red('Fly.io CLI not found'));
      console.log(kleur.white('\nPlease install the Fly.io CLI:'));
      console.log(kleur.white('  curl -L https://fly.io/install.sh | sh\n'));
      return;
    }

    // Check for fly.toml files
    const webFlyConfig = path.join(process.cwd(), 'apps', 'web', 'fly.toml');
    const pbFlyConfig = path.join(process.cwd(), 'apps', 'pb', 'fly.toml');

    const hasWebConfig = await fs.access(webFlyConfig).then(() => true).catch(() => false);
    const hasPbConfig = await fs.access(pbFlyConfig).then(() => true).catch(() => false);

    if (!hasWebConfig && !hasPbConfig) {
      spinner.fail(kleur.red('No fly.toml found in apps/web or apps/pb'));
      return;
    }

    // Deploy PocketBase first if config exists
    if (hasPbConfig) {
      spinner.text = 'Deploying PocketBase...';
      execSync('cd apps/pb && flyctl deploy', { stdio: 'inherit' });
    }

    // Then deploy web app if config exists
    if (hasWebConfig) {
      spinner.text = 'Deploying web app...';
      execSync('cd apps/web && flyctl deploy', { stdio: 'inherit' });
    }

    spinner.succeed(kleur.green('Deployment completed successfully!'));
  } catch (error) {
    spinner.fail(kleur.red(`Deployment failed: ${error.message}`));
  }
}

export function deployCommand(program) {
  program
    .command('deploy')
    .description('Deploy the project to Fly.io')
    .action(deployProject);
}
