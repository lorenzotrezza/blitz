import {
  LOBBY_STATUS,
  MAX_LOBBY_PLAYERS,
  PLAYER_CONNECTION_STATE,
  type LobbyState,
  type PlayerInfo,
} from '@blitz/shared';

import { generateLobbyCode as createLobbyCode } from './code.js';
import {
  createInMemoryLobbyStore,
  type LobbyStore,
} from './store.js';

const DEFAULT_TRACK_ID = 'track-oval';
const DEFAULT_BOT_COUNT = 0;

function normalizeLobbyCode(code: string): string {
  return code.trim().toUpperCase();
}

function assertLobbyWaiting(lobby: LobbyState): void {
  if (lobby.status !== LOBBY_STATUS.waiting) {
    throw new LobbyServiceError(
      'lobby-not-waiting',
      'Lobby is not in the waiting state',
    );
  }
}

function createPlayer(input: CreateLobbyInput): PlayerInfo {
  return {
    id: input.playerId,
    nickname: input.nickname,
    carId: input.carId,
    ready: false,
    connectionState: PLAYER_CONNECTION_STATE.connected,
  };
}

function createLobbySnapshot(code: string, host: PlayerInfo): LobbyState {
  return {
    code,
    hostId: host.id,
    players: [host],
    settings: {
      trackId: DEFAULT_TRACK_ID,
      botCount: DEFAULT_BOT_COUNT,
      maxPlayers: MAX_LOBBY_PLAYERS,
    },
    status: LOBBY_STATUS.waiting,
  };
}

export class LobbyServiceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'LobbyServiceError';
    this.code = code;
  }
}

export interface CreateLobbyInput {
  playerId: string;
  nickname: string;
  carId: string;
}

export interface JoinLobbyInput extends CreateLobbyInput {
  code: string;
}

export interface LeaveLobbyInput {
  code: string;
  playerId: string;
}

export interface SetReadyInput {
  playerId: string;
  ready: boolean;
}

export interface LobbyService {
  createLobby(input: CreateLobbyInput): LobbyState;
  joinLobby(input: JoinLobbyInput): LobbyState;
  leaveLobby(input: LeaveLobbyInput): LobbyState | null;
  disconnectPlayer(playerId: string): LobbyState | null;
  setReady(input: SetReadyInput): LobbyState;
}

export interface CreateLobbyServiceOptions {
  store?: LobbyStore;
  generateLobbyCode?: () => string;
}

export function createLobbyService(
  options: CreateLobbyServiceOptions = {},
): LobbyService {
  const store = options.store ?? createInMemoryLobbyStore();
  const generateLobbyCode =
    options.generateLobbyCode ??
    (() => createLobbyCode((code) => store.hasLobby(code)));

  function removePlayer(code: string, playerId: string): LobbyState | null {
    const lobby = store.getLobby(code);

    if (!lobby) {
      return null;
    }

    const remainingPlayers = lobby.players.filter(
      (player) => player.id !== playerId,
    );

    if (remainingPlayers.length === lobby.players.length) {
      throw new LobbyServiceError(
        'player-not-in-lobby',
        'Player is not in this lobby',
      );
    }

    if (remainingPlayers.length === 0) {
      store.deleteLobby(code);
      return null;
    }

    return store.saveLobby({
      ...lobby,
      hostId:
        lobby.hostId === playerId ? remainingPlayers[0].id : lobby.hostId,
      players: remainingPlayers,
    });
  }

  return {
    createLobby(input) {
      if (store.getLobbyCodeForPlayer(input.playerId)) {
        throw new LobbyServiceError(
          'player-already-in-lobby',
          'Player is already in a lobby',
        );
      }

      const lobby = createLobbySnapshot(generateLobbyCode(), createPlayer(input));

      return store.saveLobby(lobby);
    },
    joinLobby(input) {
      if (store.getLobbyCodeForPlayer(input.playerId)) {
        throw new LobbyServiceError(
          'player-already-in-lobby',
          'Player is already in a lobby',
        );
      }

      const code = normalizeLobbyCode(input.code);
      const lobby = store.getLobby(code);

      if (!lobby) {
        throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
      }

      assertLobbyWaiting(lobby);

      if (lobby.players.length >= lobby.settings.maxPlayers) {
        throw new LobbyServiceError('lobby-full', 'Lobby is full');
      }

      return store.saveLobby({
        ...lobby,
        players: [...lobby.players, createPlayer(input)],
      });
    },
    leaveLobby(input) {
      const code = normalizeLobbyCode(input.code);
      const existingLobby = store.getLobby(code);

      if (!existingLobby) {
        throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
      }

      return removePlayer(code, input.playerId);
    },
    disconnectPlayer(playerId) {
      const code = store.getLobbyCodeForPlayer(playerId);

      if (!code) {
        return null;
      }

      try {
        return removePlayer(code, playerId);
      } catch (error) {
        if (
          error instanceof LobbyServiceError &&
          error.code === 'player-not-in-lobby'
        ) {
          return null;
        }

        throw error;
      }
    },
    setReady(input) {
      const code = store.getLobbyCodeForPlayer(input.playerId);

      if (!code) {
        throw new LobbyServiceError(
          'player-not-in-lobby',
          'Player is not in a lobby',
        );
      }

      const lobby = store.getLobby(code);

      if (!lobby) {
        throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
      }

      assertLobbyWaiting(lobby);

      return store.saveLobby({
        ...lobby,
        players: lobby.players.map((player) =>
          player.id === input.playerId
            ? {
                ...player,
                ready: input.ready,
              }
            : player,
        ),
      });
    },
  };
}
