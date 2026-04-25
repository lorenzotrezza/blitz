import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  PARTY_GAME_VARIANTS,
  RACE_STATUS,
  type RaceSnapshot,
  type SessionFinishedPayload,
} from '@blitz/shared';

import { createAppRouter } from '../app/router';

const { mockNavigate, mockSubmitInput, mockUseLiveRaceSocket, mockUsePostGameActions } =
  vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockSubmitInput: vi.fn(),
    mockUseLiveRaceSocket: vi.fn(),
    mockUsePostGameActions: vi.fn(),
  }));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/useLiveRaceSocket', () => ({
  useLiveRaceSocket: mockUseLiveRaceSocket,
}));

vi.mock('../lib/usePostGameActions', () => ({
  usePostGameActions: mockUsePostGameActions,
}));

function renderRoute(
  initialEntry:
    | string
    | {
        pathname: string;
        search?: string;
        hash?: string;
        state?: unknown;
      },
) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}

function createSnapshot(): RaceSnapshot {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    trackId: 'sprint-circuit',
    status: RACE_STATUS.racing,
    tick: 12,
    startedAt: 1_713_980_000_000,
    countdown: 0,
    playersState: [
      {
        playerId: 'socket-host',
        nickname: 'Blitz',
        x: 120,
        y: 88,
        vx: 0,
        vy: 2,
        angle: 0.3,
        lap: 1,
        checkpoint: 2,
        progress: 0.54,
        penalties: 0,
        speed: 3.8,
      },
      {
        playerId: 'socket-guest',
        nickname: 'SubrataPal',
        x: 288,
        y: 200,
        vx: 0,
        vy: 2,
        angle: 0.45,
        lap: 1,
        checkpoint: 3,
        progress: 0.58,
        penalties: 0,
        speed: 4.1,
      },
    ],
    botsState: [],
  };
}

function createFinishedPayload(): SessionFinishedPayload {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    game: 'race',
    variant: PARTY_GAME_VARIANTS.sprintCircuit,
    results: {
      rankings: [
        {
          playerId: 'socket-host',
          rank: 1,
          label: '42.0s',
          value: 42_000,
        },
      ],
    },
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  mockNavigate.mockReset();
  mockSubmitInput.mockReset();
  mockUseLiveRaceSocket.mockReset();
  mockUseLiveRaceSocket.mockReturnValue({
    isConnected: true,
    snapshot: createSnapshot(),
    finished: null,
    submitInput: mockSubmitInput,
  });
  mockUsePostGameActions.mockReset();
  mockUsePostGameActions.mockReturnValue({
    isConnected: true,
    lobby: null,
    isHost: false,
    pendingAction: null,
    postGameUpdate: null,
    sessionStarted: null,
    submitAction: vi.fn(),
  });
});

describe('SprintCircuitPage', () => {
  test('renders the fullscreen race shell with HUD and controls', () => {
    renderRoute('/race/live/session-1');

    expect(screen.getByLabelText('Fullscreen race session')).toBeInTheDocument();
    expect(screen.getByLabelText(/sprint circuit canvas/i)).toBeInTheDocument();
    expect(screen.getByText(/reach the finish/i)).toBeInTheDocument();
    expect(screen.getByText(/54%/i)).toBeInTheDocument();
    expect(screen.getByText(/blitz/i)).toBeInTheDocument();
    expect(screen.getByText(/subratapal/i)).toBeInTheDocument();
    expect(screen.getByText(/checkpoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/steer/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GO' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'BRAKE' })).toBeInTheDocument();
  });

  test('renders initial countdown before a live snapshot arrives', () => {
    mockUseLiveRaceSocket.mockReturnValue({
      isConnected: true,
      snapshot: null,
      finished: null,
      submitInput: mockSubmitInput,
    });

    renderRoute({
      pathname: '/race/live/session-1',
      state: {
        sessionId: 'session-1',
        lobbyCode: 'ABCD12',
        game: 'race',
        variant: PARTY_GAME_VARIANTS.sprintCircuit,
        countdown: 3,
      },
    });

    expect(screen.getByText(/prepare to race/i)).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.queryByText(/waiting for race/i)).not.toBeInTheDocument();
  });

  test('renders without normal app chrome or card layout classes', () => {
    const { container } = renderRoute('/race/live/session-1');

    expect(screen.queryByRole('link', { name: /home/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /hub/i })).not.toBeInTheDocument();
    expect(container.querySelector('.viewport')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.card')).toBeNull();
  });

  test('stores server results and navigates to results when finished', async () => {
    const finished = createFinishedPayload();

    mockUseLiveRaceSocket.mockReturnValue({
      isConnected: true,
      snapshot: createSnapshot(),
      finished,
      submitInput: mockSubmitInput,
    });

    renderRoute('/race/live/session-1');

    await waitFor(() => {
      expect(window.sessionStorage.getItem('blitz-results:session-1')).toBe(
        JSON.stringify(finished),
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/results/session-1', {
      replace: true,
      state: finished,
    });
  });

  test('emits shared typed race input from route controls', () => {
    renderRoute('/race/live/session-1');

    fireEvent.pointerDown(screen.getByRole('button', { name: 'GO' }), {
      pointerId: 1,
    });

    expect(mockSubmitInput).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'button',
        button: 'primary',
        state: 'pressed',
      }),
    );
  });
});
