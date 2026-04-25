import type { ClientToServerEvents, ServerToClientEvents } from '@blitz/shared';
import { io, type Socket } from 'socket.io-client';

export type BlitzClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let sharedSocket: BlitzClientSocket | null = null;

interface ResolveSocketUrlOptions {
  explicitUrl?: string;
  dev?: boolean;
  windowOrigin?: string;
}

export function resolveSocketUrl(options: ResolveSocketUrlOptions = {}) {
  const explicitUrl = options.explicitUrl;

  if (explicitUrl) {
    return explicitUrl;
  }

  const windowOrigin =
    options.windowOrigin ??
    (typeof window === 'undefined' ? '' : window.location.origin);

  if (windowOrigin) {
    return windowOrigin;
  }

  if (options.dev) {
    return 'http://127.0.0.1:3004';
  }

  return 'http://127.0.0.1:3004';
}

export function getBlitzSocket(): BlitzClientSocket {
  if (!sharedSocket) {
    sharedSocket = io(
      resolveSocketUrl({
        explicitUrl: import.meta.env.VITE_SOCKET_URL,
        dev: import.meta.env.DEV,
      }),
      {
      autoConnect: false,
      },
    );
  }

  return sharedSocket;
}
