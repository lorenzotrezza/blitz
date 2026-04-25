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
      sessionId: 'session-penalty',
      lobbyCode: 'ABCD12',
      game: 'penalty',
      variant: null,
      status: GAME_SESSION_STATUS.active,
      countdown: null,
      results: null,
      state: {
        phase: 'select',
        turn: 1,
        totalTurns: 6,
        activeKickerId: 'p1',
        activeKeeperId: 'p2',
        waitingFor: ['p1', 'p2'],
        lockedChoices: {
          kicker: false,
          keeper: false,
        },
        players: [
          {
            playerId: 'p1',
            nickname: 'Blitz',
            goals: 0,
            saves: 0,
          },
          {
            playerId: 'p2',
            nickname: 'SubrataPal',
            goals: 0,
            saves: 0,
          },
        ],
        lastResolution: null,
      },
    },
    finished: null,
    submitInput: vi.fn(),
  });
});

describe('PenaltySessionPage', () => {
  test('renders the multiplayer penalty controls for the active kicker', () => {
    renderRoute('/session/penalty/session-penalty');

    expect(screen.getByRole('heading', { name: /rigori multiplayer/i })).toBeInTheDocument();
    expect(screen.getByText(/turno 1 \/ 6/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sinistra power/i })).toBeInTheDocument();
    expect(screen.getByText(/subratapal/i)).toBeInTheDocument();
  });
});
