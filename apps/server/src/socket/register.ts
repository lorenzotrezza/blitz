import type { Server as HttpServer } from 'node:http';

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@blitz/shared';
import { Server } from 'socket.io';

import type { ServerConfig } from '../config.js';

export type BlitzSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerSockets(
  server: HttpServer,
  config: Pick<ServerConfig, 'socketCorsOrigin'>,
): BlitzSocketServer {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: config.socketCorsOrigin,
    },
  });

  io.on('connection', () => {});

  return io;
}
