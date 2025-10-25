import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts', // contact form main export
    'src/cli/src/index.ts', // CLI entry point
  ],
  format: ['esm', 'cjs'],
  target: 'node16',
  dts: {
    resolve: true,
  },
  clean: true,
  minify: true,
  sourcemap: true,
  outDir: 'dist',
  platform: 'node',
  shims: true,
  noExternal: [/.*/],
  tsconfig: './tsconfig.json',
  outExtension({ format }) {
    return {
      js: `.${format === 'esm' ? 'js' : 'cjs'}`,
    };
  },
});
