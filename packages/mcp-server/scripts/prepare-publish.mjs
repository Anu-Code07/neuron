import { cpSync, chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '.publish');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const publishName = process.env.NPM_PUBLISH_NAME ?? pkg.name;

const publishPkg = {
  name: publishName,
  version: pkg.version,
  description: pkg.description,
  type: pkg.type,
  bin: {
    'neuron-mcp': 'index.js',
  },
  main: 'index.js',
  files: ['index.js', 'index.js.map', 'README.md'],
  keywords: pkg.keywords,
  license: pkg.license,
  repository: pkg.repository,
  engines: pkg.engines,
  publishConfig: pkg.publishConfig,
  dependencies: {
    dotenv: pkg.dependencies.dotenv,
  },
};

cpSync(join(root, 'dist', 'index.js'), join(outDir, 'index.js'));
cpSync(join(root, 'dist', 'index.js.map'), join(outDir, 'index.js.map'));
cpSync(join(root, 'README.md'), join(outDir, 'README.md'));
chmodSync(join(outDir, 'index.js'), 0o755);
writeFileSync(join(outDir, 'package.json'), `${JSON.stringify(publishPkg, null, 2)}\n`);

console.log(`Prepared npm package → ${outDir}`);
