import { cpSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'tsup';

export default defineConfig([
  /**
   * Build para navegador (ContactForm)
   */
  {
    entry: ['src/index.ts'], // tu export principal de ContactForm
    format: ['esm'],
    target: 'esnext',
    dts: true,
    clean: true,
    minify: true,
    sourcemap: true,
    outDir: 'dist/browser',
    platform: 'browser', // <- importante
    shims: true,
    noExternal: [/.*/],
  },

  /**
   * Build para Node (CLI)
   */
  {
    entry: ['src/cli/src/index.ts'], // tu CLI
    format: ['esm', 'cjs'],
    target: 'node16',
    dts: true,
    clean: false, // no borramos lo del build anterior
    minify: true,
    sourcemap: true,
    outDir: 'dist/cli',
    platform: 'node',
    shims: true,
    noExternal: [/.*/],
    outExtension({ format }) {
      return {
        js: `.${format === 'esm' ? 'js' : 'cjs'}`,
      };
    },
    onSuccess: async () => {
      // Copiamos la carpeta php solo para Node/CLI
      const sourceDir = resolve('php');
      const destDir = resolve('dist/php');
      try {
        mkdirSync(destDir, { recursive: true });
        cpSync(sourceDir, destDir, { recursive: true });
        console.log('✅ PHP folder copied to dist/cli');
      } catch (error) {
        console.error('❌ Failed to copy PHP folder:', error);
      }
    },
  },
]);
