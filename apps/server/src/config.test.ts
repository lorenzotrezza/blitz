import assert from 'node:assert/strict';
import test from 'node:test';

import { loadConfig } from './config.js';

test('loadConfig returns default server settings', () => {
  const config = loadConfig({});

  assert.equal(config.port, 3004);
  assert.equal(config.socketCorsOrigin, '*');
});

test('loadConfig rejects malformed PORT values', () => {
  assert.throws(() => loadConfig({ PORT: '3004abc' }), /Invalid PORT value/);
  assert.throws(() => loadConfig({ PORT: '1e3' }), /Invalid PORT value/);
});

test('loadConfig reads an explicit Socket.IO CORS origin', () => {
  const config = loadConfig({
    PORT: '4010',
    SOCKET_IO_CORS_ORIGIN: 'https://blitz.example',
  });

  assert.equal(config.port, 4010);
  assert.equal(config.socketCorsOrigin, 'https://blitz.example');
});
