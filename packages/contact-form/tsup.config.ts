import { cpSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'esnext',
    dts: true,
    clean: true,
    minify: true,
    sourcemap: true,
    outDir: 'dist/browser',
    platform: 'browser',
    shims: true,
    noExternal: [/.*/],
  },
  {
    entry: ['src/cli/src/index.ts'],
    format: ['esm', 'cjs'],
    target: 'node16',
    dts: true,
    clean: false,
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
