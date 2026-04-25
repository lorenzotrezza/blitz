import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  LOBBY_RACE_MODES,
  PLAYER_CONNECTION_STATE,
  SOCKET_EVENTS,
  type LobbyState,
} from '@blitz/shared';

const { mockGetBlitzSocket } = vi.hoisted(() => ({
  mockGetBlitzSocket: vi.fn(),
}));

vi.mock('./socket', () => ({
  getBlitzSocket: mockGetBlitzSocket,
}));

import { persistActiveLobby, useLobbySocket } from './useLobbySocket';

type LobbySnapshotOverrides = Omit<Partial<LobbyState>, 'settings'> & {
  settings?: Partial<LobbyState['settings']>;
};

function createLobbySnapshot(overrides: LobbySnapshotOverrides = {}): LobbyState {
  const { settings: settingsOverrides, ...restOverrides } = overrides;

  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'drag-sprint',
    status: 'waiting',
    settings: {
      ...settingsOverrides,
      maxPlayers: settingsOverrides?.maxPlayers ?? 8,
      rounds: settingsOverrides?.rounds ?? 3,
      raceMode: settingsOverrides?.raceMode ?? LOBBY_RACE_MODES.finishLine,
    },
    players: [
      {
        id: 'socket-host',
        nickname: 'Blitz',
        carId: 'f812',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
    ],
    ...restOverrides,
  };
}

function createMockSocket() {
  return {
    connected: true,
    active: true,
    id: 'socket-host',
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
  };
}

describe('useLobbySocket', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    persistActiveLobby(null);
    mockGetBlitzSocket.mockReset();
  });

  test('host updateSettings emits client:update-lobby-settings with lobby code and typed race mode', () => {
    const socket = createMockSocket();
    mockGetBlitzSocket.mockReturnValue(socket);
    persistActiveLobby(createLobbySnapshot());

    const { result } = renderHook(() => useLobbySocket('abcd12'));

    act(() => {
      result.current.updateSettings({
        raceMode: LOBBY_RACE_MODES.bestOf3,
      });
    });

    expect(socket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.client.updateLobbySettings, {
      code: 'ABCD12',
      settings: {
        raceMode: LOBBY_RACE_MODES.bestOf3,
      },
    });
  });
});
