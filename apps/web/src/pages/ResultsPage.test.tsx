import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import type { RaceFinishedPayload } from '@blitz/shared';

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

function createFinishedPayload(): RaceFinishedPayload {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    standings: [
      {
        entrantId: 'socket-host',
        entrantType: 'player',
        position: 1,
        finishTimeMs: 52_300,
      },
      {
        entrantId: 'socket-guest',
        entrantType: 'player',
        position: 2,
        finishTimeMs: 54_900,
      },
    ],
  };
}

describe('ResultsPage', () => {
  test('renders final standings from the finished race payload', () => {
    renderRoute('/results/session-1', createFinishedPayload());

    expect(screen.getByRole('heading', { name: /classifica finale/i })).toBeInTheDocument();
    expect(screen.getByText(/socket-host/i)).toBeInTheDocument();
    expect(screen.getByText(/52.3s/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /torna all hub/i })).toHaveAttribute('href', '/hub');
  });
});
