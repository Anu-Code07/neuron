import * as esbuild from 'esbuild';
import { chmodSync } from 'node:fs';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: { js: '#!/usr/bin/env node' },
  external: ['dotenv'],
  minify: false,
  sourcemap: true,
});

chmodSync('dist/index.js', 0o755);
console.log('Bundled dist/index.js for npm publish');
