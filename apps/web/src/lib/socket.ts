import type { ClientToServerEvents, ServerToClientEvents } from '@blitz/shared';
import { io, type Socket } from 'socket.io-client';

export type BlitzClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let sharedSocket: BlitzClientSocket | null = null;

function resolveSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:3000';
  }

  return window.location.origin;
}

export function getBlitzSocket(): BlitzClientSocket {
  if (!sharedSocket) {
    sharedSocket = io(resolveSocketUrl(), {
      autoConnect: false,
    });
  }

  return sharedSocket;
}
