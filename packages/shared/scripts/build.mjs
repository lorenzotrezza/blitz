import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');
const require = createRequire(import.meta.url);
const typescriptCli = require.resolve('typescript/bin/tsc');

rmSync(resolve(packageDir, 'dist'), { recursive: true, force: true });

const build = spawnSync(
  process.execPath,
  [typescriptCli, '-p', 'tsconfig.build.json'],
  {
    cwd: packageDir,
    stdio: 'inherit',
  },
);

if (build.error) {
  throw build.error;
}

process.exit(build.status ?? 1);
