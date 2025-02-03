#!/usr/bin/env node

import { Command } from 'commander';
import kleur from 'kleur';
import { showBanner } from './utils/banner.js';
import { checkForUpdates, getCurrentVersion } from './utils/version.js';

// Commands
import { newCommand } from './commands/new.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { deployCommand } from './commands/deploy.js';

const program = new Command();

async function main() {
  // Show banner
  showBanner();

  const version = await getCurrentVersion();
  program
    .name('bit')
    .description('CLI to scaffold and manage modern web projects')
    .version(version);

  // Register commands
  newCommand(program);
  startCommand(program);
  stopCommand(program);
  deployCommand(program);

  // Parse arguments
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
