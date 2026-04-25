import {
  LOBBY_STATUS,
  MAX_LOBBY_PLAYERS,
  PLAYER_CONNECTION_STATE,
  type LobbySettings,
  type LobbyState,
  type LobbyStatus,
  type PartyGame,
  type PartyGameVariant,
  type PlayerInfo,
} from '@blitz/shared';

import { generateLobbyCode as createLobbyCode } from './code.js';
import {
  createInMemoryLobbyStore,
  type LobbyStore,
} from './store.js';

const DEFAULT_GAME: PartyGame = 'lights';
const DEFAULT_VARIANT: PartyGameVariant = null;
const DEFAULT_ROUNDS = 3;

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

function assertHost(lobby: LobbyState, hostId: string): void {
  if (lobby.hostId !== hostId) {
    throw new LobbyServiceError('player-not-host', 'Only the host can manage the lobby');
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
    mode: 'multiplayer',
    selectedGame: DEFAULT_GAME,
    selectedVariant: DEFAULT_VARIANT,
    players: [host],
    settings: {
      maxPlayers: MAX_LOBBY_PLAYERS,
      rounds: DEFAULT_ROUNDS,
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

export interface SelectGameInput {
  code: string;
  hostId: string;
  game: PartyGame;
  variant: PartyGameVariant;
}

export interface UpdateSettingsInput {
  code: string;
  hostId: string;
  settings: Partial<LobbySettings>;
}

export interface KickPlayerInput {
  code: string;
  hostId: string;
  playerId: string;
}

export interface SetStatusInput {
  code: string;
  status: LobbyStatus;
}

export interface LobbyService {
  createLobby(input: CreateLobbyInput): LobbyState;
  joinLobby(input: JoinLobbyInput): LobbyState;
  leaveLobby(input: LeaveLobbyInput): LobbyState | null;
  disconnectPlayer(playerId: string): LobbyState | null;
  setReady(input: SetReadyInput): LobbyState;
  selectGame(input: SelectGameInput): LobbyState;
  updateSettings(input: UpdateSettingsInput): LobbyState;
  kickPlayer(input: KickPlayerInput): LobbyState;
  setStatus(input: SetStatusInput): LobbyState;
  getLobby(code: string): LobbyState | null;
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
    selectGame(input) {
      const code = normalizeLobbyCode(input.code);
      const lobby = store.getLobby(code);

      if (!lobby) {
        throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
      }

      assertLobbyWaiting(lobby);
      assertHost(lobby, input.hostId);

      return store.saveLobby({
        ...lobby,
        selectedGame: input.game,
        selectedVariant: input.variant,
      });
    },
    updateSettings(input) {
      const code = normalizeLobbyCode(input.code);
      const lobby = store.getLobby(code);

      if (!lobby) {
        throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
      }

      assertLobbyWaiting(lobby);
      assertHost(lobby, input.hostId);

      return store.saveLobby({
        ...lobby,
        settings: {
          ...lobby.settings,
          ...input.settings,
        },
      });
    },
    kickPlayer(input) {
      const code = normalizeLobbyCode(input.code);
      const lobby = store.getLobby(code);

      if (!lobby) {
        throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
      }

      assertLobbyWaiting(lobby);
      assertHost(lobby, input.hostId);

      if (lobby.hostId === input.playerId) {
        throw new LobbyServiceError('cannot-kick-host', 'Host cannot be removed');
      }

      const nextLobby = removePlayer(code, input.playerId);

      if (!nextLobby) {
        throw new LobbyServiceError('lobby-empty', 'Lobby cannot become empty');
      }

      return nextLobby;
    },
    setStatus(input) {
      const code = normalizeLobbyCode(input.code);
      const lobby = store.getLobby(code);

      if (!lobby) {
        throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
      }

      return store.saveLobby({
        ...lobby,
        status: input.status,
      });
    },
    getLobby(code) {
      return store.getLobby(normalizeLobbyCode(code));
    },
  };
}
