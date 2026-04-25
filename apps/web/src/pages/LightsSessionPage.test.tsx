import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { GAME_SESSION_STATUS } from '@blitz/shared';

import { createAppRouter } from '../app/router';

const { mockUseGameSessionSocket } = vi.hoisted(() => ({
  mockUseGameSessionSocket: vi.fn(),
}));

vi.mock('../lib/useGameSessionSocket', () => ({
  useGameSessionSocket: mockUseGameSessionSocket,
}));

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  mockUseGameSessionSocket.mockReset();
  mockUseGameSessionSocket.mockReturnValue({
    isConnected: true,
    socketId: 'p1',
    session: {
      sessionId: 'session-lights',
      lobbyCode: 'ABCD12',
      game: 'lights',
      variant: null,
      status: GAME_SESSION_STATUS.active,
      countdown: null,
      results: null,
      state: {
        phase: 'go',
        round: 1,
        totalRounds: 3,
        goAtMs: 1800,
        players: [
          {
            playerId: 'p1',
            nickname: 'Blitz',
            status: 'waiting',
            lastReactionMs: null,
            falseStarts: 0,
            totalScoreMs: 0,
          },
          {
            playerId: 'p2',
            nickname: 'SubrataPal',
            status: 'waiting',
            lastReactionMs: null,
            falseStarts: 0,
            totalScoreMs: 0,
          },
        ],
      },
    },
    finished: null,
    submitInput: vi.fn(),
  });
});

describe('LightsSessionPage', () => {
  test('renders the multiplayer semaforo session and reaction control', () => {
    renderRoute('/session/lights/session-lights');

    expect(screen.getByRole('heading', { name: /semaforo multiplayer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reagisci/i })).toBeInTheDocument();
    expect(screen.getByText(/round 1 \/ 3/i)).toBeInTheDocument();
    expect(screen.getByText(/subratapal/i)).toBeInTheDocument();
  });
});
