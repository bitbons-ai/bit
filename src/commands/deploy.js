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

async function checkFlyAppExists(appName) {
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa('flyctl', ['apps', 'list'], {
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });
    return stdout.includes(appName);
  } catch (error) {
    return false;
  }
}

function sanitizeProjectName(name) {
  // Replace dots and any other invalid characters with hyphens
  // fly.io app names can only contain lowercase letters, numbers, and hyphens
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
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

    // Get project name from package.json (already sanitized)
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const projectName = packageJson.name;  // No need to sanitize, it's already sanitized in new.js

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
        try {
          const webAppName = `${projectName}-web`;

          // Stop spinner to prevent blinking during output
          spinner.stop();

          // Launch app if it doesn't exist
          const webAppExists = await checkFlyAppExists(webAppName);
          if (!webAppExists) {
            console.log(kleur.yellow('Web app not found. Launching...'));
            await execa('flyctl', ['launch', '--name', webAppName, '--no-deploy'], {
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

          spinner.succeed(kleur.green('Web app deployment completed successfully!'));
        } catch (deployError) {
          spinner.fail(kleur.red('Web app deployment failed'));
          console.error(deployError);
          process.exit(1);
        }
        break;

      case 'pb':
        if (!hasPbConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/pb'));
          process.exit(1);
        }

        console.log(kleur.cyan('\n🚀 Deploying PocketBase on Fly.io'));
        try {
          const pbAppName = `${projectName}-pb`;

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
        } catch (deployError) {
          spinner.fail(kleur.red('PocketBase deployment failed'));
          console.error(deployError);
          process.exit(1);
        }
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
          try {
            const pbAppName = `${projectName}-pb`;

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
          } catch (deployError) {
            console.error(kleur.red('PocketBase deployment failed'));
            console.error(deployError);
            process.exit(1);
          }
        }

        if (hasWebConfig) {
          console.log(kleur.cyan('\n🚀 Deploying web app on Fly.io'));
          try {
            const webAppName = `${projectName}-web`;

            // Launch app if it doesn't exist
            const webAppExists = await checkFlyAppExists(webAppName);
            if (!webAppExists) {
              console.log(kleur.yellow('Web app not found. Launching...'));
              await execa('flyctl', ['launch', '--name', webAppName, '--no-deploy'], {
                cwd: path.join(process.cwd(), 'apps', 'web'),
                stdio: 'inherit'
              });
            }

            // Deploy with streaming output
            await execa('flyctl', ['deploy'], {
              cwd: path.join(process.cwd(), 'apps', 'web'),
              stdio: 'inherit',
              env: { ...process.env, FORCE_COLOR: 'true' }
            });

            console.log(kleur.green('Web app deployment completed successfully!'));
          } catch (deployError) {
            console.error(kleur.red('Web app deployment failed'));
            console.error(deployError);
            process.exit(1);
          }
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
