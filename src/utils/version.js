import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import kleur from 'kleur';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function getCurrentVersion() {
  const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

export async function getLatestVersion() {
  try {
    const output = execSync('npm show @mauricio.wolff/bit version', { encoding: 'utf-8' });
    return output.trim();
  } catch (error) {
    return null;
  }
}

export async function checkForUpdates() {
  try {
    const currentVersion = await getCurrentVersion();
    const latestVersion = await getLatestVersion();

    if (!latestVersion) {
      return;
    }

    if (currentVersion !== latestVersion) {
      console.log(kleur.yellow().bold('\nUpdate available! ') + kleur.yellow(`${currentVersion} → ${latestVersion}`));
      console.log(kleur.yellow('Run: ') + kleur.white().bold('npm install -g @mauricio.wolff/bit') + kleur.yellow(' to update\n'));
    }
  } catch (error) {
    // Silently fail version check
  }
}
