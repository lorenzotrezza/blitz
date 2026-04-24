const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootPackagePath = path.join(__dirname, '..', 'package.json');

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, 'utf8'),
  );
}

test('root package.json defines Task 1 workspaces and scripts', () => {
  assert.ok(fs.existsSync(rootPackagePath), 'expected root package.json to exist');

  const packageJson = readJson(rootPackagePath);

  assert.deepEqual(packageJson.workspaces, [
    'apps/web',
    'apps/server',
    'packages/shared',
  ]);

  assert.equal(typeof packageJson.scripts?.dev, 'string', 'expected a root dev script');
  assert.equal(typeof packageJson.scripts?.build, 'string', 'expected a root build script');
  assert.equal(typeof packageJson.scripts?.test, 'string', 'expected a root test script');
});
