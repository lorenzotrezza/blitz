import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';

import { createServer, startServer } from '../apps/server/dist/index.js';

const requireFromServer = createRequire(new URL('../apps/server/package.json', import.meta.url));
const { createRequest, createResponse } = requireFromServer('node-mocks-http');

async function close(runtime) {
  runtime.io.close();

  if (!runtime.server.listening) {
    return;
  }

  await new Promise((resolve, reject) => {
    runtime.server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function requestHealthOverTcp() {
  const runtime = await startServer({
    port: 0,
    socketCorsOrigin: '*',
  });

  try {
    const address = runtime.server.address();

    assert.ok(address && typeof address === 'object', 'server must expose a TCP address');

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);

    return {
      status: response.status,
      body: await response.json(),
    };
  } finally {
    await close(runtime);
  }
}

async function requestHealthOverHttpServer() {
  const runtime = createServer({
    port: 0,
    socketCorsOrigin: '*',
  });

  try {
    const request = createRequest({
      method: 'GET',
      url: '/health',
    });
    const response = createResponse({
      eventEmitter: EventEmitter,
    });

    await new Promise((resolve, reject) => {
      response.on('end', resolve);
      response.on('error', reject);
      runtime.server.emit('request', request, response);
    });

    return {
      status: response.statusCode,
      body: response._getJSONData(),
    };
  } finally {
    await close(runtime);
  }
}

async function requestHealth() {
  try {
    return await requestHealthOverTcp();
  } catch (error) {
    const code = error && typeof error === 'object' ? error.code : undefined;

    if (code !== 'EPERM' && code !== 'EACCES') {
      throw error;
    }

    return requestHealthOverHttpServer();
  }
}

const response = await requestHealth();

assert.equal(response.status, 200);
assert.deepEqual(response.body, { status: 'ok' });
