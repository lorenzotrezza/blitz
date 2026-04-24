import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { Server as HttpServer } from 'node:http';
import test from 'node:test';

import { createRequest, createResponse } from 'node-mocks-http';

async function close(server: HttpServer): Promise<void> {
  if (!server.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function requestHealthOverServer(server: HttpServer) {
  try {
    const port = await new Promise<number>((resolve, reject) => {
      const handleError = (error: NodeJS.ErrnoException) => {
        server.off('listening', handleListening);
        reject(error);
      };

      const handleListening = () => {
        server.off('error', handleError);
        const address = server.address();

        if (!address || typeof address !== 'object') {
          reject(new Error('Server did not expose a TCP port'));
          return;
        }

        resolve(address.port);
      };

      server.once('error', handleError);
      server.once('listening', handleListening);
      server.listen(0, '127.0.0.1');
    });

    const response = await fetch(`http://127.0.0.1:${port}/health`);

    await close(server);

    return {
      status: response.status,
      body: await response.json(),
      transport: 'tcp' as const,
    };
  } catch (error) {
    const listenError = error as NodeJS.ErrnoException;

    if (listenError.code !== 'EPERM' && listenError.code !== 'EACCES') {
      throw error;
    }

    const request = createRequest({
      method: 'GET',
      url: '/health',
    });
    const response = createResponse({
      eventEmitter: EventEmitter,
    });

    await new Promise<void>((resolve, reject) => {
      response.on('end', resolve);
      response.on('error', reject);
      server.emit('request', request, response);
    });

    return {
      status: response.statusCode,
      body: response._getJSONData(),
      transport: 'simulated' as const,
    };
  }
}

test('server workspace test script runs every src test file', async () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as {
    scripts?: {
      test?: string;
    };
  };

  assert.equal(typeof packageJson.scripts?.test, 'string');
  assert.equal(packageJson.scripts?.test?.includes('src/server.test.ts'), false);
  assert.equal(packageJson.scripts?.test?.includes('.test.ts'), true);
});

test('createServer boots with an HTTP server instance', async () => {
  const serverModule = await import('./index.js');

  assert.equal(typeof serverModule.createServer, 'function');

  const { io, server } = serverModule.createServer();

  assert.ok(server instanceof HttpServer);
  assert.equal(io.httpServer, server);
  assert.equal(server.listeners('upgrade').length > 0, true);

  io.close();
  await close(server);
});

test('createServer serves GET /health with 200', async () => {
  const serverModule = await import('./index.js');

  assert.equal(typeof serverModule.createServer, 'function');

  const { io, server } = serverModule.createServer();
  const response = await requestHealthOverServer(server);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
  assert.match(response.transport, /^(tcp|simulated)$/);

  io.close();
  await close(server);
});
