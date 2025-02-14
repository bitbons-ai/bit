import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execa } from 'execa';
import { checkCliToolInstalled } from '../utils/common.js';

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

async function deployWebApp(spinner) {
  const webConfigPath = path.join(process.cwd(), 'apps', 'web', 'fly.toml');
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
      cwd: path.join(process.cwd(), 'apps', 'web'),
      stdio: 'inherit'
    });
  }

  // Deploy with streaming output
  await execa('flyctl', ['deploy', '--ha=false'], {
    cwd: path.join(process.cwd(), 'apps', 'web'),
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  console.log(kleur.green('Web app deployment completed successfully!'));
}

async function deployProject(target) {
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

    // Validate target
    const validTargets = ['web', 'pb', 'all'];
    if (!validTargets.includes(target)) {
      spinner.fail(kleur.red(`Invalid target: ${target}`));
      console.log(kleur.yellow(`Valid targets are: ${validTargets.join(', ')}`));
      process.exit(1);
    }

    const { execa } = await import('execa');

    // Deployment logic based on target
    switch (target) {
      case 'web':
        if (!hasWebConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/web'));
          process.exit(1);
        }

        console.log(kleur.cyan('\n🚀 Deploying web app on Fly.io'));
        await deployWebApp(spinner);
        break;

      case 'pb':
        if (!hasPbConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/pb'));
          process.exit(1);
        }

        console.log(kleur.cyan('\n🚀 Deploying PocketBase on Fly.io'));
        const pbConfigPath = path.join(process.cwd(), 'apps', 'pb', 'fly.toml');
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
          await execa('flyctl', ['launch', '--name', pbAppName, '--no-deploy'], {
            cwd: path.join(process.cwd(), 'apps', 'pb'),
            stdio: 'inherit'
          });
        }

        // Deploy with streaming output
        await execa('flyctl', ['deploy'], {
          cwd: path.join(process.cwd(), 'apps', 'pb'),
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: 'true' }
        });

        spinner.succeed(kleur.green('PocketBase deployment completed successfully!'));
        break;

      case 'all':
        if (!hasPbConfig && !hasWebConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/web or apps/pb'));
          process.exit(1);
        }

        // Stop spinner to prevent blinking during output
        spinner.stop();

        if (hasPbConfig) {
          console.log(kleur.cyan('\n🚀 Deploying PocketBase on Fly.io'));
          const pbConfigPath = path.join(process.cwd(), 'apps', 'pb', 'fly.toml');
          const pbAppName = await getAppNameFromConfig(pbConfigPath);
          
          if (!pbAppName) {
            spinner.fail(kleur.red('Could not find app name in fly.toml'));
            process.exit(1);
          }

          // Launch app if it doesn't exist
          const pbAppExists = await checkFlyAppExists(pbAppName);
          if (!pbAppExists) {
            console.log(kleur.yellow('PocketBase app not found. Launching...'));
            await execa('flyctl', ['launch', '--name', pbAppName, '--no-deploy'], {
              cwd: path.join(process.cwd(), 'apps', 'pb'),
              stdio: 'inherit'
            });
          }

          // Deploy with streaming output
          await execa('flyctl', ['deploy'], {
            cwd: path.join(process.cwd(), 'apps', 'pb'),
            stdio: 'inherit',
            env: { ...process.env, FORCE_COLOR: 'true' }
          });

          console.log(kleur.green('PocketBase deployment completed successfully!'));
        }

        if (hasWebConfig) {
          console.log(kleur.cyan('\n🚀 Deploying web app on Fly.io'));
          await deployWebApp(spinner);
        }
        break;
    }
  } catch (error) {
    spinner.fail(kleur.red(`Deployment failed: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

export function deployCommand(program) {
  program
    .command('deploy')
    .description('Deploy the project to Fly.io')
    .argument('[target]', 'Target to deploy (web or pb)', 'all')
    .action((target) => {
      // Normalize the target
      const normalizedTarget = target.replace(':', '').toLowerCase();
      deployProject(normalizedTarget);
    });
}
