import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

const repoRoot = resolve(__dirname, '../../../..');
const legacySourcePath = resolve(repoRoot, 'index.html');
const webLegacyPath = resolve(repoRoot, 'apps/web/public/legacy/index.html');

describe('legacy game document', () => {
  test('ships the same legacy document into the web public bundle', () => {
    const sourceDocument = readFileSync(legacySourcePath, 'utf8');
    const bundledDocument = readFileSync(webLegacyPath, 'utf8');

    expect(bundledDocument).toBe(sourceDocument);
  });

  test('contains hub entry points and a retry control for the lights minigame', () => {
    const sourceDocument = readFileSync(legacySourcePath, 'utf8');

    expect(sourceDocument).toContain('id="btn-hub-intro"');
    expect(sourceDocument).toContain('id="btn-hub-result"');
    expect(sourceDocument).toContain('id="btn-lights-retry"');
    expect(sourceDocument).toContain("window.top.location.href='/hub'");
  });
});
