import fs from 'fs';
import path from 'path';
import { FormConfig } from 'src/domain/types';
import { copyPhpFolder } from '../utils/copyPhpFolder';
import { generatePhpFromConfig } from '../utils/generatePhpFromConfig';
import { loadConfig } from '../utils/loadConfig';

export default async function generate() {
  console.log('🚀 Running formpipe generate...\n');

  const projectRoot = process.cwd();
  const config: FormConfig = loadConfig();

  // Busca la carpeta php dentro del paquete
  const packagePhpFolder = findPackagePhpFolder(__dirname);
  const projectPhpFolder = path.join(projectRoot, 'php');
  const projectPhpMainFile = path.join(projectPhpFolder, 'contact-form.php');

  try {
    await copyPhpFolder(packagePhpFolder, projectPhpFolder);
    console.log(`✅ Copied PHP folder to:\n   ${projectPhpFolder}`);

    generatePhpFromConfig(config, projectPhpMainFile);
    console.log(`✅ Generated PHP form:\n   ${projectPhpMainFile}\n`);
  } catch (error) {
    console.error('❌ Error during generation:', error);
    process.exit(1);
  }
}

/**
 * Busca recursivamente la carpeta raíz del paquete formpipe
 * y devuelve la ruta a /php
 */
function findPackagePhpFolder(startDir: string): string {
  let dir = startDir;

  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name && pkg.name.startsWith('@formpipe/')) {
        return path.resolve(dir, 'dist/php');
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(
    '❌ Could not locate @formpipe package root to copy /php folder.'
  );
}
