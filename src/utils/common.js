import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import kleur from 'kleur';

/**
 * Sanitizes a project name to be compatible with various services
 * @param {string} name - The project name to sanitize
 * @returns {string} - Sanitized project name
 */
export function sanitizeProjectName(name) {
  // Replace dots and any other invalid characters with hyphens
  // Only allow lowercase letters, numbers, and hyphens
  // Remove domain extensions and sanitize
  return name.toLowerCase().split('.')[0].replace(/[^a-z0-9-]/g, '-');
}

/**
 * Checks if a CLI tool is installed
 * @param {string} command - The command to check
 * @param {string[]} [args=['version']] - Arguments to pass to the command
 * @returns {boolean} - Whether the tool is installed
 */
export function checkCliToolInstalled(command, args = ['version']) {
  try {
    execSync(`${command} ${args.join(' ')}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Finds the project root directory by looking for docker-compose.yml
 * and changes the current working directory to it
 * @returns {string|null} - The project root path if found, null otherwise
 */
export function ensureProjectRoot() {
  let currentDir = process.cwd();
  const root = process.platform === 'win32' ? currentDir.split(path.sep)[0] : '/';
  
  while (currentDir !== root) {
    if (fs.existsSync(path.join(currentDir, 'docker-compose.yml'))) {
      if (currentDir !== process.cwd()) {
        process.chdir(currentDir);
        console.log(kleur.gray(`Changed directory to project root: ${currentDir}`));
      }
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  
  console.error(kleur.red('Error: Not in a bit project (docker-compose.yml not found in parent directories)'));
  return null;
}
