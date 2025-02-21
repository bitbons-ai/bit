#!/usr/bin/env node

import { Command } from 'commander';
import kleur from 'kleur';

import { showBanner } from './utils/banner.js';
import { checkForUpdates, getCurrentVersion } from './utils/version.js';

import { newCommand } from './commands/new.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { deployCommand } from './commands/deploy.js';
import { logsCommand } from './commands/logs.js';
import { downCommand } from './commands/down.js';
import { restartCommand } from './commands/restart.js';

const program = new Command();

async function main() {
  // Show banner
  showBanner();

  const version = await getCurrentVersion();
  program
    .name(kleur.bold().green('bit'))
    .description(kleur.gray('CLI to scaffold and manage modern web projects'))
    .version(version)
    .addHelpText('after', `\n${kleur.bold().yellow('Links:')}
  ${kleur.cyan('NPM:    ')}${kleur.blue('https://www.npmjs.com/package/@bitbons.ai/bit')}
  ${kleur.cyan('GitHub: ')}${kleur.blue('https://github.com/bitbons-ai/bit')}
  ${kleur.cyan('Website: ')}${kleur.blue('https://bitbons.ai/')}`);

  // Register command handlers
  newCommand(program);
  startCommand(program);
  stopCommand(program);
  restartCommand(program);
  deployCommand(program);
  logsCommand(program);
  downCommand(program);

  // Parse command line arguments
  await program.parseAsync(process.argv);

  // If no arguments provided, show help
  if (process.argv.length === 2) {
    program.help();
  }

  // Check for updates (after command execution)
  await checkForUpdates();
}

main().catch((error) => {
  console.error(kleur.red('Error:'), error.message);
  process.exit(1);
});
