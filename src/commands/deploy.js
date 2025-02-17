import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execa } from 'execa';
import { checkCliToolInstalled, ensureProjectRoot } from '../utils/common.js';

async function checkFlyInstalled() {
  return checkCliToolInstalled('flyctl');
}

async function checkFlyAppExists(appName) {
  try {
    const { stdout } = await execa('flyctl', ['apps', 'list'], {
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });
    return stdout.includes(appName);
  } catch (error) {
    return false;
  }
}

// Function to read app name from fly.toml
async function getAppNameFromConfig(configPath) {
  try {
    const config = await fs.readFile(configPath, 'utf-8');
    const appNameMatch = config.match(/^app\s*=\s*["']([^"']+)["']/m);
    return appNameMatch ? appNameMatch[1] : null;
  } catch (error) {
    return null;
  }
}

async function deployWebApp(projectRoot, spinner) {
  const webConfigPath = path.join(projectRoot, 'apps', 'web', 'fly.toml');
  const webAppName = await getAppNameFromConfig(webConfigPath);
  
  if (!webAppName) {
    spinner.fail(kleur.red('Could not find app name in fly.toml'));
    process.exit(1);
  }

  // Stop spinner to prevent blinking during output
  spinner.stop();

  // Launch app if it doesn't exist
  const webAppExists = await checkFlyAppExists(webAppName);
  if (!webAppExists) {
    console.log(kleur.yellow('Web app not found. Launching...'));
    await execa('fly', ['launch', '--name', webAppName, '--copy-config', '--no-deploy', '--yes'], {
      cwd: path.join(projectRoot, 'apps', 'web'),
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });
  }

  // Deploy web app
  console.log(kleur.cyan('\nDeploying web app...\n'));
  await execa('fly', ['deploy'], {
    cwd: path.join(projectRoot, 'apps', 'web'),
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' }
  });
}

async function deployPocketBase(projectRoot, spinner) {
  const pbConfigPath = path.join(projectRoot, 'apps', 'pb', 'fly.toml');
  const pbAppName = await getAppNameFromConfig(pbConfigPath);
  
  if (!pbAppName) {
    spinner.fail(kleur.red('Could not find app name in fly.toml'));
    process.exit(1);
  }

  // Stop spinner to prevent blinking during output
  spinner.stop();

  // Launch app if it doesn't exist
  const pbAppExists = await checkFlyAppExists(pbAppName);
  if (!pbAppExists) {
    console.log(kleur.yellow('PocketBase app not found. Launching...'));
    await execa('fly', ['launch', '--name', pbAppName, '--copy-config', '--no-deploy', '--yes'], {
      cwd: path.join(projectRoot, 'apps', 'pb'),
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });

    // Create volume for PocketBase data
    console.log(kleur.cyan('\nCreating volume for PocketBase data...\n'));
    await execa('fly', ['volumes', 'create', 'pb_data', '--size', '1'], {
      cwd: path.join(projectRoot, 'apps', 'pb'),
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });
  }

  // Deploy PocketBase app
  console.log(kleur.cyan('\nDeploying PocketBase app...\n'));
  await execa('fly', ['deploy'], {
    cwd: path.join(projectRoot, 'apps', 'pb'),
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' }
  });
}

async function deployProject(projectRoot, target) {
  const spinner = ora('Preparing deployment...').start();

  try {
    if (!projectRoot) {
      spinner.fail(kleur.red('Not in a bit project'));
      process.exit(1);
    }

    // Check if fly is installed
    if (!await checkFlyInstalled()) {
      spinner.fail(kleur.red('Fly CLI not found. Please install it first:'));
      console.log(kleur.cyan('\n  curl -L https://fly.io/install.sh | sh\n'));
      process.exit(1);
    }

    // Check if user is logged in
    try {
      await execa('fly', ['auth', 'whoami'], { stdio: 'pipe' });
    } catch (error) {
      spinner.fail(kleur.red('Not logged in to Fly. Please run:'));
      console.log(kleur.cyan('\n  fly auth login\n'));
      process.exit(1);
    }

    // Deploy based on target
    if (target === 'web') {
      await deployWebApp(projectRoot, spinner);
    } else if (target === 'pb') {
      await deployPocketBase(projectRoot, spinner);
    } else {
      // Deploy both
      await deployPocketBase(projectRoot, spinner);
      await deployWebApp(projectRoot, spinner);
    }

    spinner.succeed(kleur.green('Deployment completed successfully!'));
  } catch (error) {
    spinner.fail(kleur.red('Deployment failed'));
    console.error(error.message);
    process.exit(1);
  }
}

export function deployCommand(program) {
  program
    .command('deploy')
    .description('Deploy the project to Fly.io')
    .argument('[target]', 'Target to deploy (web, pb, or all)', 'all')
    .action((target, options) => {
      const projectRoot = ensureProjectRoot();
      deployProject(projectRoot, target);
    });
}
