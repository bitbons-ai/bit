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

// Function to read .env.development file
async function readEnvDevelopment() {
  try {
    const envPath = path.join(process.cwd(), '.env.development');
    const content = await fs.readFile(envPath, 'utf-8');
    const vars = {};
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        vars[key.trim()] = valueParts.join('=').trim();
      }
    });
    return vars;
  } catch (error) {
    return null;
  }
}

// Function to check if service is healthy
async function checkServiceHealth(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (error) {
      // Ignore errors and keep trying
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return false;
}

async function waitForDeployment(appName, type) {
  const url = `https://${appName}.fly.dev${type === 'pb' ? '/api/health' : '/'}`;
  console.log(kleur.cyan(`\n⏳ Waiting for ${type} deployment to be ready...`));
  
  const isHealthy = await checkServiceHealth(url);
  if (isHealthy) {
    console.log(kleur.green(`✓ ${type} deployment is healthy and responding at:`));
    console.log(kleur.blue(url));
  } else {
    console.log(kleur.yellow(`⚠️ ${type} deployment might not be ready yet. Check status with:`));
    console.log(kleur.white(`fly status -a ${appName}`));
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

    // Set superuser credentials from .env.development
    const envVars = await readEnvDevelopment();
    if (envVars && envVars.SUPERUSER_EMAIL && envVars.SUPERUSER_PASSWORD) {
      console.log(kleur.cyan('\n📝 Setting superuser credentials from .env.development...'));
      await execa('flyctl', [
        'secrets', 
        'set',
        `SUPERUSER_EMAIL=${envVars.SUPERUSER_EMAIL}`,
        `SUPERUSER_PASSWORD=${envVars.SUPERUSER_PASSWORD}`
      ], {
        cwd: path.join(process.cwd(), 'apps', 'pb'),
        stdio: 'inherit'
      });
    } else {
      console.log(kleur.yellow('\n⚠️ Warning: Could not find superuser credentials in .env.development'));
      console.log(kleur.white('You will need to set them manually:'));
      console.log(kleur.yellow('fly secrets set SUPERUSER_EMAIL=your@email.com SUPERUSER_PASSWORD=yourpassword'));
    }

    // First deploy guidance
    console.log(kleur.cyan('\n📝 First Deploy Notes:'));
    console.log(kleur.white('To use a custom domain:'));
    console.log(kleur.white('1. Add a CNAME record pointing to:'), kleur.yellow(`${pbAppName}.fly.dev`));
    console.log(kleur.white('2. Run:'), kleur.yellow(`fly certs add YOUR_DOMAIN`));
  }

  // Check for additional secrets from fly.secrets.example
  const pbSecrets = await checkSecretsExample(path.join(process.cwd(), 'apps', 'pb'));
  const secretsToCheck = pbSecrets.filter(s => !['SUPERUSER_EMAIL', 'SUPERUSER_PASSWORD'].includes(s));
  if (secretsToCheck.length > 0) {
    const missingSecrets = await checkSecretsSet(pbAppName, secretsToCheck);
    if (missingSecrets.length > 0) {
      console.log(kleur.yellow('\n⚠️ Missing secrets that should be set:'));
      missingSecrets.forEach(secret => {
        console.log(kleur.white(`- ${secret}`));
      });
      console.log(kleur.white('\nSet them using:'), kleur.yellow('fly secrets set NAME=VALUE\n'));
    }
  }

  // Deploy with streaming output
  await execa('flyctl', ['deploy', '--ha=false'], {
    cwd: path.join(process.cwd(), 'apps', 'web'),
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  console.log(kleur.green('Web app deployment completed successfully!'));
}

async function deployPocketBase(spinner, pbConfigPath) {
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
    await execa('flyctl', ['launch', '--name', pbAppName, '--no-deploy', '--yes'], {
      cwd: path.join(process.cwd(), 'apps', 'pb'),
      stdio: 'inherit'
    });

    // Set superuser credentials from .env.development
    const envVars = await readEnvDevelopment();
    if (envVars && envVars.SUPERUSER_EMAIL && envVars.SUPERUSER_PASSWORD) {
      console.log(kleur.cyan('\n📝 Setting superuser credentials from .env.development...'));
      await execa('flyctl', [
        'secrets', 
        'set',
        `SUPERUSER_EMAIL=${envVars.SUPERUSER_EMAIL}`,
        `SUPERUSER_PASSWORD=${envVars.SUPERUSER_PASSWORD}`
      ], {
        cwd: path.join(process.cwd(), 'apps', 'pb'),
        stdio: 'inherit'
      });
    } else {
      console.log(kleur.yellow('\n⚠️ Warning: Could not find superuser credentials in .env.development'));
      console.log(kleur.white('You will need to set them manually:'));
      console.log(kleur.yellow('fly secrets set SUPERUSER_EMAIL=your@email.com SUPERUSER_PASSWORD=yourpassword'));
    }

    // First deploy guidance
    console.log(kleur.cyan('\n📝 First Deploy Notes:'));
    console.log(kleur.white('To use a custom domain:'));
    console.log(kleur.white('1. Add a CNAME record pointing to:'), kleur.yellow(`${pbAppName}.fly.dev`));
    console.log(kleur.white('2. Run:'), kleur.yellow(`fly certs add YOUR_DOMAIN`));
  }

  // Check for additional secrets from fly.secrets.example
  const pbSecrets = await checkSecretsExample(path.join(process.cwd(), 'apps', 'pb'));
  const secretsToCheck = pbSecrets.filter(s => !['SUPERUSER_EMAIL', 'SUPERUSER_PASSWORD'].includes(s));
  if (secretsToCheck.length > 0) {
    const missingSecrets = await checkSecretsSet(pbAppName, secretsToCheck);
    if (missingSecrets.length > 0) {
      console.log(kleur.yellow('\n⚠️ Missing secrets that should be set:'));
      missingSecrets.forEach(secret => {
        console.log(kleur.white(`- ${secret}`));
      });
      console.log(kleur.white('\nSet them using:'), kleur.yellow('fly secrets set NAME=VALUE\n'));
    }
  }

  // Deploy with streaming output
  await execa('flyctl', ['deploy', '--yes'], {
    cwd: path.join(process.cwd(), 'apps', 'pb'),
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  console.log(kleur.green('PocketBase deployment completed successfully!'));
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

    // Deployment logic based on target
    switch (target) {
      case 'web':
        if (!hasWebConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/web'));
          process.exit(1);
        }
        await deployWebApp(spinner);
        break;

      case 'pb':
        if (!hasPbConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/pb'));
          process.exit(1);
        }
        await deployPocketBase(spinner, pbFlyConfig);
        break;

      case 'all':
        if (!hasPbConfig && !hasWebConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/web or apps/pb'));
          process.exit(1);
        }

        spinner.stop();

        // Deploy both services in parallel
        const deployments = [];
        let errors = [];

        if (hasPbConfig) {
          deployments.push(
            deployPocketBase(spinner, pbFlyConfig)
              .catch(error => {
                errors.push(['PocketBase', error]);
              })
          );
        }

        if (hasWebConfig) {
          deployments.push(
            deployWebApp(spinner)
              .catch(error => {
                errors.push(['Web', error]);
              })
          );
        }

        // Wait for all deployments to complete
        try {
          await Promise.all(deployments);
        } catch (error) {
          // Handle any deployment errors
          if (errors.length > 0) {
            console.log(kleur.red('\n❌ Deployment failed:'));
            errors.forEach(([service, error]) => {
              console.log(kleur.red(`\n${service} deployment failed:`));
              console.error(error);
            });
            process.exit(1);
          }
        }
        break;
    }

    // Check deployment health if --watch flag is provided
    if (process.argv.includes('--watch')) {
      if (target === 'web' || target === 'all') {
        const webAppName = await getAppNameFromConfig(webFlyConfig);
        if (webAppName) await waitForDeployment(webAppName, 'web');
      }
      if (target === 'pb' || target === 'all') {
        const pbAppName = await getAppNameFromConfig(pbFlyConfig);
        if (pbAppName) await waitForDeployment(pbAppName, 'pb');
      }
    }

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
    .option('--watch', 'Wait and verify the deployment is healthy')
    .action(async (target, options) => {
      await deployProject(target);
    });
}
