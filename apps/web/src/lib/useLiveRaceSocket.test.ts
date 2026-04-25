import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  PARTY_GAME_VARIANTS,
  RACE_STATUS,
  SOCKET_EVENTS,
  type GameSessionEnvelope,
  type RaceSnapshot,
} from '@blitz/shared';

const { mockGetBlitzSocket } = vi.hoisted(() => ({
  mockGetBlitzSocket: vi.fn(),
}));

vi.mock('./socket', () => ({
  getBlitzSocket: mockGetBlitzSocket,
}));

import { useLiveRaceSocket } from './useLiveRaceSocket';

type SocketHandler = (payload?: unknown) => void;

function createMockSocket() {
  const handlers = new Map<string, SocketHandler>();

  return {
    socket: {
      connected: true,
      active: true,
      on: vi.fn((event: string, handler: SocketHandler) => {
        handlers.set(event, handler);
      }),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
    },
    emitServer(event: string, payload?: unknown) {
      handlers.get(event)?.(payload);
    },
  };
}

function createSprintSnapshot(): RaceSnapshot {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    trackId: 'sprint-circuit',
    status: RACE_STATUS.racing,
    tick: 1,
    startedAt: 1_713_980_000_000,
    countdown: 0,
    playersState: [],
    botsState: [],
  };
}

function createSessionEnvelope(
  variant: GameSessionEnvelope['variant'],
  state: GameSessionEnvelope['state'],
): GameSessionEnvelope {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    game: 'race',
    variant,
    status: 'active',
    countdown: 0,
    state,
    results: null,
  };
}

describe('useLiveRaceSocket', () => {
  beforeEach(() => {
    mockGetBlitzSocket.mockReset();
  });

  test('accepts only sprint circuit snapshots for the live race route', () => {
    const { socket, emitServer } = createMockSocket();
    mockGetBlitzSocket.mockReturnValue(socket);

    const { result } = renderHook(() => useLiveRaceSocket('session-1'));

    act(() => {
      emitServer(
        SOCKET_EVENTS.server.sessionState,
        createSessionEnvelope(PARTY_GAME_VARIANTS.dragSprint, {
          playersState: [{ playerId: 'driver-1', lane: 1, distance: 120 }],
        }),
      );
    });

    expect(result.current.snapshot).toBeNull();

    const sprintSnapshot = createSprintSnapshot();

    act(() => {
      emitServer(
        SOCKET_EVENTS.server.sessionState,
        createSessionEnvelope(PARTY_GAME_VARIANTS.sprintCircuit, sprintSnapshot),
      );
    });

    expect(result.current.snapshot).toEqual(sprintSnapshot);
  });
});
