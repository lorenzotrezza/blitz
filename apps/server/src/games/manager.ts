import { randomUUID } from 'node:crypto';

import type {
  GameInputPayload,
  GameSessionEnvelope,
  LobbyState,
  SessionFinishedPayload,
  SessionStartedPayload,
} from '@blitz/shared';

import type { GameRegistryEntry } from './registry.js';
import type { GameRuntimeInstance } from './runtime.js';

export interface GameManagerOptions {
  onState?: (payload: GameSessionEnvelope) => void;
  onFinished?: (payload: SessionFinishedPayload) => void;
}

export interface GameManager {
  startLobbySession(lobby: LobbyState, entry: GameRegistryEntry): SessionStartedPayload;
  applyInput(playerId: string, input: GameInputPayload): void;
  removePlayer(playerId: string): void;
}

export function createGameManager(options: GameManagerOptions = {}): GameManager {
  const runtimeBySessionId = new Map<string, GameRuntimeInstance>();
  const sessionIdByPlayerId = new Map<string, string>();
  const sessionIdByLobbyCode = new Map<string, string>();
  const playerIdsBySessionId = new Map<string, string[]>();

  const cleanupSession = (sessionId: string) => {
    const playerIds = playerIdsBySessionId.get(sessionId) ?? [];

    for (const playerId of playerIds) {
      sessionIdByPlayerId.delete(playerId);
    }

    playerIdsBySessionId.delete(sessionId);

    const runtime = runtimeBySessionId.get(sessionId);

    if (runtime) {
      sessionIdByLobbyCode.delete(runtime.lobbyCode);
      runtime.dispose();
    }

    runtimeBySessionId.delete(sessionId);
  };

  return {
    startLobbySession(lobby, entry) {
      if (!entry.createRuntime) {
        throw new Error(`Game ${entry.key} does not provide a runtime`);
      }

      const existingSessionId = sessionIdByLobbyCode.get(lobby.code);

      if (existingSessionId) {
        cleanupSession(existingSessionId);
      }

      const sessionId = randomUUID();
      const playerIds = lobby.players.map((player) => player.id);
      const runtime = entry.createRuntime(lobby, sessionId, {
        onState(payload) {
          options.onState?.(payload as GameSessionEnvelope);
        },
        onFinished(payload) {
          cleanupSession(sessionId);
          options.onFinished?.(payload);
        },
      });

      runtimeBySessionId.set(sessionId, runtime);
      sessionIdByLobbyCode.set(lobby.code, sessionId);
      playerIdsBySessionId.set(sessionId, playerIds);

      for (const playerId of playerIds) {
        sessionIdByPlayerId.set(playerId, sessionId);
      }

      runtime.start();

      return {
        sessionId,
        lobbyCode: lobby.code,
        game: entry.game,
        variant: entry.variant,
        countdown: entry.countdown,
      };
    },
    applyInput(playerId, input) {
      const sessionId = sessionIdByPlayerId.get(playerId);

      if (!sessionId) {
        return;
      }

      runtimeBySessionId.get(sessionId)?.applyInput(playerId, input);
    },
    removePlayer(playerId) {
      const sessionId = sessionIdByPlayerId.get(playerId);

      if (!sessionId) {
        return;
      }

      sessionIdByPlayerId.delete(playerId);
      runtimeBySessionId.get(sessionId)?.removePlayer(playerId);

      const nextPlayerIds = (playerIdsBySessionId.get(sessionId) ?? []).filter(
        (candidate) => candidate !== playerId,
      );
      playerIdsBySessionId.set(sessionId, nextPlayerIds);
    },
  };
}
