import fs from 'fs';
import path from 'path';

/**
 * Busca hacia arriba desde __dirname hasta encontrar el package.json del paquete
 */
function findPackageRoot(startDir: string): string {
  let dir = startDir;

  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      // Aseguramos que no agarramos el package.json del proyecto usuario
      if (pkg.name && pkg.name.startsWith('@formpipe/')) {
        return dir;
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) break; // llegamos a la raíz del FS
    dir = parent;
  }

  throw new Error(`No se pudo encontrar el package.json de @formpipe`);
}

export function resolveProjectPaths(projectRoot: string, userPhpPath?: string) {
  // Encuentra la raíz del paquete (por ejemplo: /node_modules/@formpipe/formpipe)
  const packageRoot = findPackageRoot(__dirname);

  // Desde ahí, la carpeta php siempre está en /php
  const packagePhpFolder = path.resolve(packageRoot, 'php');

  // Resuelve la ruta destino dentro del proyecto usuario
  let projectPhpFolder: string;
  if (
    !userPhpPath ||
    userPhpPath.trim() === '' ||
    userPhpPath === '/' ||
    userPhpPath === '\\'
  ) {
    projectPhpFolder = path.join(projectRoot, 'php');
  } else {
    projectPhpFolder = path.resolve(projectRoot, userPhpPath);
  }

  const projectPhpMainFile = path.join(projectPhpFolder, 'contact-form.php');

  return {
    packageRoot,
    packagePhpFolder,
    projectPhpFolder,
    projectPhpMainFile,
  };
}
