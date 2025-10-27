import { FormConfig, loadConfig } from '../../../domain/entities/FormConfig';
import { copyPhpFolder } from '../utils/copyPhpFolder';
import { generatePhpFromConfig } from '../utils/generatePhpFromConfig';
import { resolveProjectPaths } from '../utils/paths';

export default async function generate() {
  console.log('🚀 Running formpipe generate...\n');

  const projectRoot = process.cwd();
  const config: FormConfig = loadConfig();
  const paths = resolveProjectPaths(projectRoot, config.phpPath);

  try {
    await copyPhpFolder(paths.packagePhpFolder, paths.projectPhpFolder);
    console.log(`✅ Copied PHP folder to:\n   ${paths.projectPhpFolder}`);

    generatePhpFromConfig(config, paths.projectPhpMainFile);
    console.log(`✅ Generated PHP form:\n   ${paths.projectPhpMainFile}\n`);
  } catch (error) {
    console.error('❌ Error during generation:', error);
    process.exit(1);
  }
}
