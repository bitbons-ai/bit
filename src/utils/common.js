import { execSync } from 'child_process';

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
