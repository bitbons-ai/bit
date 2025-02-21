import { execa } from 'execa';
import ora from 'ora';
import kleur from 'kleur';
import path from 'path';

async function restartService(service, skipBuild = false) {
  const spinner = ora(`Restarting ${service}...`).start();
  
  try {
    // Stop the service first
    await execa('docker', ['compose', 'stop', service], {
      stdio: 'inherit'
    });

    // Remove the container
    await execa('docker', ['compose', 'rm', '-f', service], {
      stdio: 'inherit'
    });

    // Rebuild without cache if not skipped
    if (!skipBuild) {
      console.log(kleur.cyan(`\n🔨 Rebuilding ${service} without cache...`));
      await execa('docker', ['compose', 'build', '--no-cache', service], {
        stdio: 'inherit'
      });
    }

    // Start the service
    console.log(kleur.cyan(`\n🚀 Starting ${service}...`));
    await execa('docker', ['compose', 'up', '-d', service], {
      stdio: 'inherit'
    });

    spinner.succeed(kleur.green(`${service} has been restarted successfully`));
  } catch (error) {
    spinner.fail(kleur.red(`Failed to restart ${service}`));
    console.error(error);
    throw error; // Propagate error for parallel handling
  }
}

async function restartProject(target, options) {
  // Validate target
  const validTargets = ['web', 'pb', 'all'];
  if (!validTargets.includes(target)) {
    console.log(kleur.red(`Invalid target: ${target}`));
    console.log(kleur.yellow(`Valid targets are: ${validTargets.join(', ')}`));
    process.exit(1);
  }

  try {
    switch (target) {
      case 'web':
        await restartService('web', options.skipBuild);
        break;
      case 'pb':
        await restartService('pb', options.skipBuild);
        break;
      case 'all':
        // Restart services in parallel
        const services = ['pb', 'web'];
        const restarts = services.map(service => 
          restartService(service, options.skipBuild)
            .catch(error => ({ service, error }))
        );

        const results = await Promise.all(restarts);
        
        // Check for any errors
        const errors = results.filter(result => result && result.error);
        if (errors.length > 0) {
          console.log(kleur.red('\n❌ Some restarts failed:'));
          errors.forEach(({ service, error }) => {
            console.log(kleur.red(`\n${service} restart failed:`));
            console.error(error);
          });
          if (errors.length === services.length) {
            process.exit(1);
          }
        }
        break;
    }
  } catch (error) {
    console.error(kleur.red(`Restart failed: ${error.message}`));
    process.exit(1);
  }
}

export function restartCommand(program) {
  program
    .command('restart')
    .description('Restart and rebuild project containers')
    .argument('[target]', 'Target to restart (web, pb, or all)', 'all')
    .option('--skip-build', 'Skip rebuilding the container', false)
    .action(async (target, options) => {
      await restartProject(target, options);
    });
}