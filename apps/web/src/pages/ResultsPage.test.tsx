import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { SessionFinishedPayload } from '@blitz/shared';

import { createAppRouter } from '../app/router';

const { mockUsePostGameActions } = vi.hoisted(() => ({
  mockUsePostGameActions: vi.fn(),
}));

vi.mock('../lib/usePostGameActions', () => ({
  usePostGameActions: mockUsePostGameActions,
}));

function renderRoute(initialEntry: string, state?: unknown) {
  const router = createAppRouter({
    initialEntries: [
      {
        pathname: initialEntry,
        state,
      },
    ],
  });

  return render(<RouterProvider router={router} />);
}

function createFinishedPayload(): SessionFinishedPayload {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    game: 'lights',
    variant: null,
    results: {
      rankings: [
      {
        playerId: 'socket-host',
        rank: 1,
        label: '182 ms media',
        value: 182,
      },
      {
        playerId: 'socket-guest',
        rank: 2,
        label: '240 ms media',
        value: 240,
      },
      ],
      summary: {
        rounds: 3,
      },
    },
  };
}

beforeEach(() => {
  mockUsePostGameActions.mockReset();
  mockUsePostGameActions.mockReturnValue({
    isConnected: true,
    lobby: {
      code: 'ABCD12',
      hostId: 'socket-host',
      players: [],
    },
    isHost: true,
    pendingAction: null,
    postGameUpdate: null,
    sessionStarted: null,
    submitAction: vi.fn(),
  });
});

describe('ResultsPage', () => {
  test('renders shared rankings and host-only post-game actions', () => {
    renderRoute('/results/session-1', createFinishedPayload());

    expect(screen.getByRole('heading', { name: /risultati finali/i })).toBeInTheDocument();
    expect(screen.getByText(/socket-host/i)).toBeInTheDocument();
    expect(screen.getByText(/182 ms media/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rigioca/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /torna alla lobby/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cambia gioco/i })).toBeInTheDocument();
  });

  test('shows a waiting state instead of host controls for non-host players', () => {
    mockUsePostGameActions.mockReturnValue({
      isConnected: true,
      lobby: {
        code: 'ABCD12',
        hostId: 'socket-host',
        players: [],
      },
      isHost: false,
      pendingAction: null,
      postGameUpdate: null,
      sessionStarted: null,
      submitAction: vi.fn(),
    });

    renderRoute('/results/session-1', createFinishedPayload());

    expect(screen.getByText(/in attesa della decisione host/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rigioca/i })).not.toBeInTheDocument();
  });
});
