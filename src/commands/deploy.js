import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import ora from 'ora';
import { execa } from 'execa';
import { checkCliToolInstalled, ensureProjectRoot } from '../utils/common.js';

// Function to read secrets from fly.secrets.example
async function checkSecretsExample(appPath) {
  try {
    const secretsPath = path.join(appPath, 'fly.secrets.example');
    const content = await fs.readFile(secretsPath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=')[0]);
  } catch (error) {
    return [];
  }
}

// Function to check which secrets are not set
async function checkSecretsSet(appName, secrets) {
  try {
    const { stdout } = await execa('fly', ['secrets', 'list', '-a', appName], {
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });

    const setSecrets = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('NAME'))
      .map(line => line.split(' ')[0]);

    return secrets.filter(secret => !setSecrets.includes(secret));
  } catch (error) {
    return secrets; // If we can't check, assume all are missing
  }
}

async function checkFlyInstalled() {
  return checkCliToolInstalled('fly');
}

async function checkFlyAppExists(appName) {
  try {
    const { stdout } = await execa('fly', ['apps', 'list'], {
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
    if (!appNameMatch) return null;

    // If it's a generated name with random suffix, get the base name
    const appName = appNameMatch[1];
    const baseNameMatch = appName.match(/^(test-(?:web|pb))/);
    return baseNameMatch ? baseNameMatch[1] : appName;
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

async function deployWebApp(spinner, options = {}) {
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
    console.log(kleur.yellow('\nWeb app not found. Launching...🚀'));

    if (options.dryRun) {
      console.log(kleur.blue('Would run:'), kleur.white(`fly launch --copy-config --no-deploy --yes`));
    } else {
      await execa('fly', ['launch', '--copy-config', '--no-deploy', '--yes'], {
        cwd: path.join(process.cwd(), 'apps', 'web'),
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: 'true' }
      });
    }
  }

  // Deploy with streaming output
  if (options.dryRun) {
    console.log(kleur.blue('Would run:'), kleur.white('fly deploy --yes'));
  } else {
    console.log(kleur.cyan('\nDeploying web app...\n'));
    await execa('fly', ['deploy', '--yes'], {
      cwd: path.join(process.cwd(), 'apps', 'web'),
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });
  }

  if (!options.dryRun) {
    console.log(kleur.green('Web app deployment completed successfully!'));
  }

  return { webAppExists };
}

async function deployPocketBase(spinner, pbConfigPath, options = {}) {
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
    console.log(kleur.yellow('PocketBase app not found. Launching... 🚀'));
    if (options.dryRun) {
      console.log(kleur.blue('Would run:'), kleur.white(`fly launch --copy-config --no-deploy --yes`));
    } else {
      await execa('fly', ['launch', '--copy-config', '--no-deploy', '--yes'], {
        cwd: path.join(process.cwd(), 'apps', 'pb'),
        stdio: 'inherit'
      });
    }
  }

  // Set superuser credentials from .env.development
  const envVars = await readEnvDevelopment();
  if (envVars && envVars.SUPERUSER_EMAIL && envVars.SUPERUSER_PASSWORD) {
    console.log(kleur.cyan('\n→ Setting superuser credentials from .env.development...'));
    if (options.dryRun) {
      console.log(kleur.blue('Would run:'), kleur.white(`fly secrets set SUPERUSER_EMAIL=${envVars.SUPERUSER_EMAIL} SUPERUSER_PASSWORD=${envVars.SUPERUSER_PASSWORD}`));
      console.log(kleur.green('Secrets are staged for the first deployment'));
    } else {
      await execa('fly', [
        'secrets',
        'set',
        `SUPERUSER_EMAIL=${envVars.SUPERUSER_EMAIL}`,
        `SUPERUSER_PASSWORD=${envVars.SUPERUSER_PASSWORD}`
      ], {
        cwd: path.join(process.cwd(), 'apps', 'pb'),
        stdio: 'inherit'
      });
    }
  } else {
    console.log(kleur.yellow('\n⚠️ Warning: Could not find superuser credentials in .env.development'));
    console.log(kleur.white('You will need to set them manually:'));
    console.log(kleur.yellow('fly secrets set SUPERUSER_EMAIL=your@email.com SUPERUSER_PASSWORD=yourpassword'));
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
  if (options.dryRun) {
    console.log(kleur.blue('Would run:'), kleur.white('fly deploy --yes'));
  } else {
    await execa('fly', ['deploy', '--yes'], {
      cwd: path.join(process.cwd(), 'apps', 'pb'),
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });
  }

  console.log(kleur.green('PocketBase deployment completed successfully!'));

  return { pbAppExists };
}

async function deployProject(target, options = {}) {
  const spinner = ora('Preparing deployment...').start();

  try {
    // Check for Fly.io CLI
    if (!await checkFlyInstalled()) {
      spinner.fail(kleur.red('Fly.io CLI not found'));
      console.log(kleur.white('\nPlease install the Fly.io CLI:'));
      console.log(kleur.white('  curl -L https://fly.io/install.sh | sh\n'));
      return;
    }

    if (options.dryRun) {
      console.log(kleur.cyan('\n→ DRY RUN MODE: No changes will be made\n'));
    }

    // Check for fly.toml files
    const webFlyConfig = path.join(process.cwd(), 'apps', 'web', 'fly.toml');
    const pbFlyConfig = path.join(process.cwd(), 'apps', 'pb', 'fly.toml');

    const hasWebConfig = await fs.access(webFlyConfig).then(() => true).catch(() => false);
    const hasPbConfig = await fs.access(pbFlyConfig).then(() => true).catch(() => false);

    // Track deployment results
    let webResult = { webAppExists: false };
    let pbResult = { pbAppExists: false };

    // Deployment logic based on target
    switch (target) {
      case 'web':
        if (!hasWebConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/web'));
          process.exit(1);
        }
        webResult = await deployWebApp(spinner, options);
        break;

      case 'pb':
        if (!hasPbConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/pb'));
          process.exit(1);
        }
        pbResult = await deployPocketBase(spinner, pbFlyConfig, options);
        break;

      case 'all':
        if (!hasPbConfig && !hasWebConfig) {
          spinner.fail(kleur.red('No fly.toml found in apps/web or apps/pb'));
          process.exit(1);
        }

        spinner.stop();

        if (hasPbConfig) {
          pbResult = await deployPocketBase(spinner, pbFlyConfig, options);
        }

        if (hasWebConfig) {
          webResult = await deployWebApp(spinner, options);
        }
        break;
    }

    // Check deployment health if --watch flag is provided
    if (process.argv.includes('--watch')) {
      if ((target === 'web' || target === 'all') && hasWebConfig) {
        const webAppName = await getAppNameFromConfig(webFlyConfig);
        if (webAppName) await waitForDeployment(webAppName, 'web');
      }
      if ((target === 'pb' || target === 'all') && hasPbConfig) {
        const pbAppName = await getAppNameFromConfig(pbFlyConfig);
        if (pbAppName) await waitForDeployment(pbAppName, 'pb');
      }
    }

    // Show first deploy notes at the end if this was a first deployment
    if (!pbResult.pbAppExists || !webResult.webAppExists) {
      const appName = await getAppNameFromConfig(webFlyConfig);
      console.log(kleur.yellow().bold('\n☀️  First Deploy Notes:'));
      console.log(kleur.white('To use a custom domain:'));
      console.log(kleur.white(' 1. Add a'), kleur.blue('CNAME record'), kleur.white('to your DNS pointing to:'), kleur.yellow(`${appName}.fly.dev`));
      console.log(kleur.white(' 2. Run:'), kleur.green('fly certs add YOUR_DOMAIN'), kleur.white(' to generate a SSL certificate'));
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
    .description('Deploy the project to Fly.io (web, pb, or all)')
    .argument('[target]', 'Target to deploy (web, pb, or all)', 'all')
    .option('--watch', 'Wait and verify the deployment is healthy')
    .option('--dry-run', 'Show what would happen without making any changes')
    .action(async (target, options) => {
      await deployProject(target, options);
    });
}
