import type { LobbyState } from '@blitz/shared';

function cloneLobbyState(lobby: LobbyState): LobbyState {
  return {
    code: lobby.code,
    hostId: lobby.hostId,
    mode: lobby.mode,
    selectedGame: lobby.selectedGame,
    selectedVariant: lobby.selectedVariant,
    players: lobby.players.map((player) => ({ ...player })),
    settings: { ...lobby.settings },
    status: lobby.status,
  };
}

export interface LobbyStore {
  hasLobby(code: string): boolean;
  getLobby(code: string): LobbyState | null;
  getLobbyCodeForPlayer(playerId: string): string | null;
  saveLobby(lobby: LobbyState): LobbyState;
  deleteLobby(code: string): void;
}

export function createInMemoryLobbyStore(): LobbyStore {
  const lobbies = new Map<string, LobbyState>();
  const lobbyCodeByPlayerId = new Map<string, string>();

  return {
    hasLobby(code) {
      return lobbies.has(code);
    },
    getLobby(code) {
      const lobby = lobbies.get(code);

      return lobby ? cloneLobbyState(lobby) : null;
    },
    getLobbyCodeForPlayer(playerId) {
      return lobbyCodeByPlayerId.get(playerId) ?? null;
    },
    saveLobby(lobby) {
      const previousLobby = lobbies.get(lobby.code);

      if (previousLobby) {
        for (const player of previousLobby.players) {
          lobbyCodeByPlayerId.delete(player.id);
        }
      }

      const snapshot = cloneLobbyState(lobby);
      lobbies.set(snapshot.code, snapshot);

      for (const player of snapshot.players) {
        lobbyCodeByPlayerId.set(player.id, snapshot.code);
      }

      return cloneLobbyState(snapshot);
    },
    deleteLobby(code) {
      const lobby = lobbies.get(code);

      if (!lobby) {
        return;
      }

      for (const player of lobby.players) {
        lobbyCodeByPlayerId.delete(player.id);
      }

      lobbies.delete(code);
    },
  };
}
