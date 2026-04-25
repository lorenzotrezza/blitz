import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import type { SessionFinishedPayload } from '@blitz/shared';

import { createAppRouter } from '../app/router';

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

describe('ResultsPage', () => {
  test('renders shared rankings from the finished session payload', () => {
    renderRoute('/results/session-1', createFinishedPayload());

    expect(screen.getByRole('heading', { name: /risultati finali/i })).toBeInTheDocument();
    expect(screen.getByText(/socket-host/i)).toBeInTheDocument();
    expect(screen.getByText(/182 ms media/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /torna all hub/i })).toHaveAttribute('href', '/hub');
  });
});
