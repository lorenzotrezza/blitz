import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { RACE_STATUS, type RaceSnapshot } from '@blitz/shared';

import { createAppRouter } from '../app/router';

const { mockUseLiveRaceSocket } = vi.hoisted(() => ({
  mockUseLiveRaceSocket: vi.fn(),
}));

vi.mock('../lib/useLiveRaceSocket', () => ({
  useLiveRaceSocket: mockUseLiveRaceSocket,
}));

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}

function createSnapshot(): RaceSnapshot {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    trackId: 'track-oval',
    status: RACE_STATUS.racing,
    tick: 12,
    startedAt: 1_713_980_000_000,
    countdown: 0,
    playersState: [
      {
        playerId: 'socket-host',
        nickname: 'Blitz',
        x: 180,
        y: 260,
        vx: 0,
        vy: 2,
        angle: 0.3,
        lap: 0,
        checkpoint: 1,
        progress: 0.34,
        penalties: 0,
        speed: 3.8,
      },
      {
        playerId: 'socket-guest',
        nickname: 'SubrataPal',
        x: 220,
        y: 230,
        vx: 0,
        vy: 2,
        angle: 0.45,
        lap: 0,
        checkpoint: 1,
        progress: 0.38,
        penalties: 0,
        speed: 4.1,
      },
    ],
    botsState: [],
  };
}

beforeEach(() => {
  mockUseLiveRaceSocket.mockReset();
  mockUseLiveRaceSocket.mockReturnValue({
    snapshot: createSnapshot(),
    finished: null,
    steer: 0,
    braking: false,
    setSteer: vi.fn(),
    setBrake: vi.fn(),
  });
});

describe('RacePage', () => {
  test('renders the live race canvas and entrants', () => {
    renderRoute('/race/live/session-1');

    expect(screen.getByRole('heading', { name: /live race/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/live race canvas/i)).toBeInTheDocument();
    expect(screen.getByText(/blitz/i)).toBeInTheDocument();
    expect(screen.getByText(/subratapal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/session-1/i).length).toBeGreaterThan(0);
  });
});
