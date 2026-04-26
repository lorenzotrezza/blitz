import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { PARTY_GAME_VARIANTS, type SessionFinishedPayload } from '@blitz/shared';

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

function createDragFinishedPayload(): SessionFinishedPayload {
  return {
    sessionId: 'session-drag',
    lobbyCode: 'ABCD12',
    game: 'race',
    variant: PARTY_GAME_VARIANTS.dragSprint,
    results: {
      rankings: [
        {
          playerId: 'socket-host',
          rank: 1,
          label: '13.420s',
          value: 13_420,
        },
      ],
      summary: {
        mode: 'drag-gear',
        track: 'straight-drag-gear',
        distanceTargetM: 402,
        finishTimeMs: 13_420,
        perfectShifts: 2,
        goodShifts: 1,
        earlyShifts: 1,
        lateShifts: 0,
        totalShifts: 4,
      },
    },
  };
}

function createDodgeFinishedPayload(
  details: { finishTimeMs: number | null; obstacleHits: number } | null = {
    finishTimeMs: 12_340,
    obstacleHits: 2,
  },
): SessionFinishedPayload {
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
          label: '12.3s · 2 hits',
          value: 12_340,
          ...(details ? { details } : {}),
        },
      ],
      summary: {
        mode: 'straight-obstacle',
        track: 'straight-obstacle',
        distanceTarget: 900,
        bestDodger: 'socket-host',
      },
    },
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
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

  test('renders drag shift summary from finished payload', () => {
    renderRoute('/results/session-drag', createDragFinishedPayload());

    expect(screen.getByRole('heading', { name: 'Shift Summary' })).toBeInTheDocument();
    expect(screen.getByText('Finish Time')).toBeInTheDocument();
    expect(screen.getAllByText('13.420s').length).toBeGreaterThan(0);
    expect(screen.getByText('PERFECT')).toBeInTheDocument();
    expect(screen.getByText('GOOD')).toBeInTheDocument();
    expect(screen.getByText('EARLY')).toBeInTheDocument();
    expect(screen.getByText('LATE')).toBeInTheDocument();
    expect(screen.getByText('Total Shifts')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rigioca/i })).toBeInTheDocument();
  });

  test('renders straight obstacle finish time and hit count', () => {
    renderRoute('/results/session-dodge', createDodgeFinishedPayload());

    expect(screen.getByRole('heading', { name: 'Best dodger' })).toBeInTheDocument();
    expect(screen.getByText('Finish time')).toBeInTheDocument();
    expect(screen.getAllByText('12.3s').length).toBeGreaterThan(0);
    expect(screen.getByText('Obstacle hits')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getByText('12.3s · 2 hits')).toBeInTheDocument();
  });

  test('renders dodge empty summary when obstacle details are missing', () => {
    renderRoute('/results/session-dodge', createDodgeFinishedPayload(null));

    expect(
      screen.getByText('No obstacle summary received. Finish order is still recorded.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Obstacle hits')).not.toBeInTheDocument();
    expect(screen.getByText('12.3s · 2 hits')).toBeInTheDocument();
  });

  test('does not render drag shift summary for non-drag results', () => {
    renderRoute('/results/session-1', createFinishedPayload());

    expect(screen.queryByRole('heading', { name: 'Shift Summary' })).not.toBeInTheDocument();
  });

  test('does not render dodge summary for other results', () => {
    renderRoute('/results/session-drag', createDragFinishedPayload());

    expect(screen.queryByText('Obstacle hits')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Best dodger' })).not.toBeInTheDocument();
  });

  test('ignores corrupt stored results payloads', () => {
    window.sessionStorage.setItem('blitz-results:session-bad', '{not valid json');

    renderRoute('/results/session-bad');

    expect(screen.getByRole('heading', { name: /nessun dato/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Shift Summary' })).not.toBeInTheDocument();
  });
});
