import '@testing-library/jest-dom/vitest';
import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  GAME_SESSION_STATUS,
  PARTY_GAME_VARIANTS,
  RACE_STATUS,
  type SessionFinishedPayload,
  type StraightObstacleSnapshot,
} from '@blitz/shared';

import { createAppRouter } from '../app/router';
import { resolveSessionRoute } from '../lib/sessionRoutes';

const { mockNavigate, mockSubmitInput, mockUseGameSessionSocket } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSubmitInput: vi.fn(),
  mockUseGameSessionSocket: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/useGameSessionSocket', () => ({
  useGameSessionSocket: mockUseGameSessionSocket,
}));

function renderRoute() {
  const router = createAppRouter({
    initialEntries: ['/race/straight-obstacle/session-dodge'],
  });

  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}

function createSnapshot(
  overrides: Partial<StraightObstacleSnapshot> = {},
): StraightObstacleSnapshot {
  return {
    sessionId: 'session-dodge',
    lobbyCode: 'ABCD12',
    trackId: 'straight-obstacle',
    mode: 'straight-obstacle',
    status: RACE_STATUS.racing,
    tick: 12,
    startedAt: 1_777_200_000_000,
    countdown: 0,
    distanceTarget: 800,
    serverTimeMs: 1_777_200_004_000,
    warning: 'Obstacle ahead',
    playersState: [
      {
        playerId: 'socket-host',
        nickname: 'Blitz',
        x: -0.25,
        distance: 240,
        speed: 126,
        progress: 0.3,
        obstacleHits: 1,
        slowdownUntilMs: 1_777_200_004_800,
        finishedAtMs: null,
        status: 'racing',
      },
    ],
    activeObstacles: [
      {
        id: 'obstacle-1',
        waveId: 'wave-1',
        centerX: 0.35,
        width: 0.25,
        distance: 310,
        depth: 0.18,
        warningDistance: 140,
        hitPlayerIds: [],
      },
    ],
    ...overrides,
  };
}

function createFinishedPayload(): SessionFinishedPayload {
  return {
    sessionId: 'session-dodge',
    lobbyCode: 'ABCD12',
    game: 'race',
    variant: PARTY_GAME_VARIANTS.straightObstacle,
    results: {
      rankings: [
        {
          playerId: 'socket-host',
          rank: 1,
          label: '18.240s',
          value: 18_240,
          details: {
            finishTimeMs: 18_240,
            obstacleHits: 1,
          },
        },
      ],
      summary: {
        finishTimeMs: 18_240,
        obstacleHits: 1,
      },
    },
  };
}

function mockDodgeSession({
  isConnected = true,
  snapshot = createSnapshot(),
  finished = null,
}: {
  isConnected?: boolean;
  snapshot?: StraightObstacleSnapshot | null;
  finished?: SessionFinishedPayload | null;
} = {}) {
  mockUseGameSessionSocket.mockReturnValue({
    isConnected,
    socketId: 'socket-host',
    session: snapshot
      ? {
          sessionId: 'session-dodge',
          lobbyCode: 'ABCD12',
          game: 'race',
          variant: PARTY_GAME_VARIANTS.straightObstacle,
          status: GAME_SESSION_STATUS.active,
          countdown: null,
          results: null,
          state: snapshot,
        }
      : null,
    finished,
    submitInput: mockSubmitInput,
  });
}

function mockPadRect(element: HTMLElement) {
  element.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    top: 20,
    left: 40,
    bottom: 116,
    right: 216,
    width: 176,
    height: 96,
    toJSON: () => ({}),
  }));
}

function dispatchPointerEvent(
  element: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  options: { pointerId: number; clientX?: number; clientY?: number },
) {
  const eventName = {
    pointerdown: 'pointerDown',
    pointermove: 'pointerMove',
    pointerup: 'pointerUp',
  }[type] as 'pointerDown' | 'pointerMove' | 'pointerUp';
  const event = createEvent[eventName](element);
  Object.defineProperties(event, {
    clientX: { value: options.clientX ?? 0 },
    clientY: { value: options.clientY ?? 0 },
    pointerId: { value: options.pointerId },
  });
  fireEvent(element, event);
}

beforeEach(() => {
  window.sessionStorage.clear();
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  });
  mockNavigate.mockReset();
  mockSubmitInput.mockReset();
  mockUseGameSessionSocket.mockReset();
  mockDodgeSession();
});

describe('StraightObstacleRacePage', () => {
  test('renders fullscreen straight obstacle route without app chrome', () => {
    const { container } = renderRoute();

    expect(screen.getByText('Dodge obstacles')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Obstacle ahead')).toBeInTheDocument();
    expect(screen.getByText('Hits')).toBeInTheDocument();
    expect(screen.getByText('Slowdown')).toBeInTheDocument();
    expect(screen.getByLabelText('Straight obstacle road')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /home/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /hub/i })).toBeNull();
    expect(document.querySelector('.topbar')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.card')).toBeNull();
    expect(container.querySelector('.viewport')).toBeNull();

    expect(
      resolveSessionRoute({
        game: 'race',
        variant: 'straight-obstacle',
        sessionId: 'session-dodge',
        lobbyCode: 'ABCD12',
        countdown: 3,
      }),
    ).toBe('/race/straight-obstacle/session-dodge');
  });

  test('submits pointer and keyboard steering intent', () => {
    renderRoute();

    const pad = screen.getByRole('slider', { name: 'Steer' });
    mockPadRect(pad);
    Object.defineProperty(pad, 'setPointerCapture', {
      configurable: true,
      value: vi.fn(),
    });

    dispatchPointerEvent(pad, 'pointerdown', { pointerId: 4, clientX: 196, clientY: 68 });
    dispatchPointerEvent(pad, 'pointermove', { pointerId: 4, clientX: 80, clientY: 68 });
    dispatchPointerEvent(pad, 'pointerup', { pointerId: 4 });

    expect(mockSubmitInput).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'straight-obstacle',
        kind: 'steer',
        steerX: expect.any(Number),
      }),
    );

    mockSubmitInput.mockClear();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyUp(window, { key: 'ArrowLeft' });

    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        mode: 'straight-obstacle',
        kind: 'steer',
        steerX: expect.any(Number),
      }),
    );
    expect(mockSubmitInput.mock.calls[0][0].steerX).toBeLessThan(0);
    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        mode: 'straight-obstacle',
        kind: 'steer',
        steerX: 0,
      }),
    );
  });

  test('stores dodge results and navigates on finish', async () => {
    const finished = createFinishedPayload();
    mockDodgeSession({ finished });

    renderRoute();

    await waitFor(() => {
      expect(window.sessionStorage.getItem('blitz-results:session-dodge')).toBe(
        JSON.stringify(finished),
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/results/session-dodge', {
      replace: true,
      state: finished,
    });
    expect(mockSubmitInput).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'straight-obstacle',
        kind: 'steer',
        steerX: 0,
      }),
    );
  });

  test('renders dodge waiting and connection states', () => {
    mockDodgeSession({ snapshot: null });
    const waiting = renderRoute();

    expect(screen.getByText('Waiting for dodge race')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No live dodge snapshot yet. Keep this screen open; the countdown appears when the server starts the session.',
      ),
    ).toBeInTheDocument();

    waiting.unmount();
    mockDodgeSession({ isConnected: false });
    renderRoute();

    expect(
      screen.getByText('Connection lost. Rejoin from the lobby or refresh this session.'),
    ).toBeInTheDocument();
  });
});
