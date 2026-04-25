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

describe('SprintCircuitPage', () => {
  test('renders the sprint circuit canvas and entrants', () => {
    renderRoute('/race/live/session-1');

    expect(screen.getByRole('heading', { name: /sprint circuit/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/sprint circuit canvas/i)).toBeInTheDocument();
    expect(screen.getByText(/blitz/i)).toBeInTheDocument();
    expect(screen.getByText(/subratapal/i)).toBeInTheDocument();
    expect(screen.getByText(/checkpoint 2/i)).toBeInTheDocument();
  });
});
