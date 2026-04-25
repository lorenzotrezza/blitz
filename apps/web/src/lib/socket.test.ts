import { describe, expect, test } from 'vitest';

import { resolveSocketUrl } from './socket';

describe('resolveSocketUrl', () => {
  test('prefers an explicit socket url when provided', () => {
    expect(
      resolveSocketUrl({
        explicitUrl: 'https://party.example/socket',
        windowOrigin: 'https://floating.example',
      }),
    ).toBe('https://party.example/socket');
  });

  test('uses the current window origin by default in development', () => {
    expect(
      resolveSocketUrl({
        dev: true,
        windowOrigin: 'https://floating.example',
      }),
    ).toBe('https://floating.example');
  });

  test('falls back to localhost only when no browser origin is available', () => {
    expect(
      resolveSocketUrl({
        dev: true,
        windowOrigin: '',
      }),
    ).toBe('http://127.0.0.1:3000');
  });
});
