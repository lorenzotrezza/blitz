import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Express } from 'express';

import { createApp } from './app.js';
import { loadConfig, type ServerConfig } from './config.js';
import {
  registerSockets,
  type BlitzSocketServer,
} from './socket/register.js';

export interface ServerRuntime {
  app: Express;
  server: HttpServer;
  io: BlitzSocketServer;
  config: ServerConfig;
}

export function createServer(config: ServerConfig = loadConfig()): ServerRuntime {
  const app = createApp();
  const server = createHttpServer(app);
  const io = registerSockets(server, config);

  return {
    app,
    server,
    io,
    config,
  };
}

export async function startServer(
  config: ServerConfig = loadConfig(),
): Promise<ServerRuntime> {
  const runtime = createServer(config);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const handleError = (error: Error) => {
      runtime.server.off('listening', handleListening);
      rejectPromise(error);
    };

    const handleListening = () => {
      runtime.server.off('error', handleError);
      resolvePromise();
    };

    runtime.server.once('error', handleError);
    runtime.server.once('listening', handleListening);
    runtime.server.listen(config.port);
  });

  return runtime;
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];

  if (!entrypoint) {
    return false;
  }

  return resolve(entrypoint) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  try {
    const runtime = await startServer();
    const address = runtime.server.address();
    const port = typeof address === 'object' && address ? address.port : runtime.config.port;

    console.log(`Blitz server listening on port ${port}`);
  } catch (error) {
    console.error('Failed to start Blitz server', error);
    process.exitCode = 1;
  }
}
