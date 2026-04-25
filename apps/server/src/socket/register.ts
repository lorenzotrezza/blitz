import type { Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';

import {
  LOBBY_STATUS,
  SOCKET_EVENTS,
  ClientToServerEvents,
  type LobbyErrorPayload,
  type LobbyState,
  ServerToClientEvents,
} from '@blitz/shared';
import { Server, type Socket } from 'socket.io';

import type { ServerConfig } from '../config.js';
import { createGameRuntimeRegistry, type GameRuntimeRegistry } from '../games/registry.js';
import {
  LobbyServiceError,
  createLobbyService,
  type LobbyService,
} from '../lobby/service.js';

export type BlitzSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type BlitzSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface RegisterSocketOptions {
  lobbyService?: LobbyService;
  gameRegistry?: GameRuntimeRegistry;
}

function normalizeLobbyCode(code: string): string {
  return code.trim().toUpperCase();
}

function emitLobbySnapshot(
  io: BlitzSocketServer,
  lobby: LobbyState,
): void {
  io.to(lobby.code).emit(SOCKET_EVENTS.server.lobbyUpdated, lobby);
}

function emitLobbyError(
  socket: BlitzSocket,
  error: LobbyServiceError,
): void {
  const payload: LobbyErrorPayload = {
    code: error.code,
    message: error.message,
  };

  socket.emit(SOCKET_EVENTS.server.lobbyError, payload);
}

async function handleLobbyMutation(
  socket: BlitzSocket,
  mutate: () => Promise<void> | void,
): Promise<void> {
  try {
    await mutate();
  } catch (error) {
    if (error instanceof LobbyServiceError) {
      emitLobbyError(socket, error);
      return;
    }

    throw error;
  }
}

export function registerSockets(
  server: HttpServer,
  config: Pick<ServerConfig, 'socketCorsOrigin'>,
  options: RegisterSocketOptions = {},
): BlitzSocketServer {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: config.socketCorsOrigin,
    },
  });
  const lobbyService = options.lobbyService ?? createLobbyService();
  const gameRegistry = options.gameRegistry ?? createGameRuntimeRegistry();

  async function startSession(code: string, playerId: string) {
    const lobby = lobbyService.getLobby(code);

    if (!lobby) {
      throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
    }

    if (lobby.hostId !== playerId) {
      throw new LobbyServiceError('player-not-host', 'Only the host can start the session');
    }

    if (lobby.players.length === 0 || lobby.players.some((player) => !player.ready)) {
      throw new LobbyServiceError('players-not-ready', 'All players must be ready');
    }

    const gameEntry = gameRegistry.resolve(lobby.selectedGame, lobby.selectedVariant);

    if (!gameEntry) {
      throw new LobbyServiceError('game-not-supported', 'Selected game is not supported');
    }

    const sessionLobby = lobbyService.setStatus({
      code: lobby.code,
      status: LOBBY_STATUS.inSession,
    });
    emitLobbySnapshot(io, sessionLobby);

    io.to(lobby.code).emit(SOCKET_EVENTS.server.sessionStarted, {
      sessionId: randomUUID(),
      lobbyCode: lobby.code,
      game: gameEntry.game,
      variant: gameEntry.variant,
      countdown: gameEntry.countdown,
    });
  }

  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.client.createLobby, async (payload) => {
      await handleLobbyMutation(socket, async () => {
        const lobby = lobbyService.createLobby({
          playerId: socket.id,
          nickname: payload.nickname,
          carId: payload.carId,
        });

        await socket.join(lobby.code);
        emitLobbySnapshot(io, lobby);
      });
    });

    socket.on(SOCKET_EVENTS.client.joinLobby, async (payload) => {
      await handleLobbyMutation(socket, async () => {
        const lobby = lobbyService.joinLobby({
          code: payload.code,
          playerId: socket.id,
          nickname: payload.nickname,
          carId: payload.carId,
        });

        await socket.join(lobby.code);
        emitLobbySnapshot(io, lobby);
      });
    });

    socket.on(SOCKET_EVENTS.client.leaveLobby, async (payload) => {
      await handleLobbyMutation(socket, async () => {
        const code = normalizeLobbyCode(payload.code);
        const lobby = lobbyService.leaveLobby({
          code,
          playerId: socket.id,
        });

        await socket.leave(code);

        if (lobby) {
          emitLobbySnapshot(io, lobby);
        }
      });
    });

    socket.on(SOCKET_EVENTS.client.setReady, async (payload) => {
      await handleLobbyMutation(socket, async () => {
        const lobby = lobbyService.setReady({
          playerId: socket.id,
          ready: payload.ready,
        });

        emitLobbySnapshot(io, lobby);
      });
    });

    socket.on(SOCKET_EVENTS.client.selectGame, async (payload) => {
      await handleLobbyMutation(socket, async () => {
        const lobby = lobbyService.selectGame({
          code: payload.code,
          hostId: socket.id,
          game: payload.game,
          variant: payload.variant,
        });

        emitLobbySnapshot(io, lobby);
      });
    });

    socket.on(SOCKET_EVENTS.client.updateLobbySettings, async (payload) => {
      await handleLobbyMutation(socket, async () => {
        const lobby = lobbyService.updateSettings({
          code: payload.code,
          hostId: socket.id,
          settings: payload.settings,
        });

        emitLobbySnapshot(io, lobby);
      });
    });

    socket.on(SOCKET_EVENTS.client.startSession, async (payload) => {
      await handleLobbyMutation(socket, async () => {
        await startSession(payload.code, socket.id);
      });
    });

    socket.on(SOCKET_EVENTS.client.startRace, async (payload) => {
      await handleLobbyMutation(socket, async () => {
        await startSession(payload.code, socket.id);
      });
    });

    socket.on('disconnect', () => {
      const lobby = lobbyService.disconnectPlayer(socket.id);

      if (lobby) {
        emitLobbySnapshot(io, lobby);
      }
    });
  });

  return io;
}
