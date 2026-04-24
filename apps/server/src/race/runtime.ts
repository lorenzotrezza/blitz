import { randomUUID } from 'node:crypto';

import type {
  LobbyState,
  PlayerInput,
  RaceFinishedPayload,
  RaceStartedPayload,
  RaceSnapshot,
} from '@blitz/shared';

import {
  applyPlayerInput,
  armRaceSession,
  createRaceSession,
  type RaceSession,
} from './session.js';

export interface RaceManagerOptions {
  countdownMs?: number;
  onRaceStarted?: (payload: RaceStartedPayload) => void;
  onRaceSnapshot?: (payload: RaceSnapshot) => void;
  onRaceFinished?: (payload: RaceFinishedPayload) => void;
}

export interface RaceManager {
  startLobbyRace(lobby: LobbyState): RaceStartedPayload;
  applyInput(playerId: string, input: PlayerInput): void;
  removePlayer(playerId: string): void;
}

const DEFAULT_COUNTDOWN_MS = 3000;

export function createRaceManager(options: RaceManagerOptions = {}): RaceManager {
  const countdownMs = options.countdownMs ?? DEFAULT_COUNTDOWN_MS;
  const sessionsByLobbyCode = new Map<string, RaceSession>();
  const lobbyCodeByPlayerId = new Map<string, string>();
  const countdownTimers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    startLobbyRace(lobby) {
      const sessionId = randomUUID();
      const session = createRaceSession(lobby, sessionId);
      sessionsByLobbyCode.set(lobby.code, session);

      for (const player of lobby.players) {
        lobbyCodeByPlayerId.set(player.id, lobby.code);
      }

      const payload: RaceStartedPayload = {
        sessionId,
        lobbyCode: lobby.code,
        trackId: lobby.settings.trackId,
        countdown: Math.ceil(countdownMs / 1000),
      };

      options.onRaceStarted?.(payload);

      const timer = setTimeout(() => {
        const current = sessionsByLobbyCode.get(lobby.code);

        if (!current) {
          return;
        }

        const armed = armRaceSession(current, Date.now());
        sessionsByLobbyCode.set(lobby.code, armed);
        options.onRaceSnapshot?.(armed.snapshot);
      }, countdownMs);
      countdownTimers.set(lobby.code, timer);

      return payload;
    },
    applyInput(playerId, input) {
      const lobbyCode = lobbyCodeByPlayerId.get(playerId);

      if (!lobbyCode) {
        return;
      }

      const current = sessionsByLobbyCode.get(lobbyCode);

      if (!current) {
        return;
      }

      const result = applyPlayerInput(current, playerId, input, Date.now());
      sessionsByLobbyCode.set(lobbyCode, result.session);
      options.onRaceSnapshot?.(result.session.snapshot);

      if (!result.finished) {
        return;
      }

      const timer = countdownTimers.get(lobbyCode);

      if (timer) {
        clearTimeout(timer);
        countdownTimers.delete(lobbyCode);
      }

      options.onRaceFinished?.(result.finished);
      sessionsByLobbyCode.delete(lobbyCode);

      for (const entrant of result.session.snapshot.playersState) {
        lobbyCodeByPlayerId.delete(entrant.playerId);
      }
    },
    removePlayer(playerId) {
      lobbyCodeByPlayerId.delete(playerId);
    },
  };
}
