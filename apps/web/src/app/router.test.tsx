import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { RACE_STATUS, type RaceSnapshot } from '@blitz/shared';

import { createAppRouter } from './router';

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
    ],
    botsState: [],
  };
}

afterEach(() => {
  window.localStorage.clear();
  mockUseLiveRaceSocket.mockReset();
});

describe('createAppRouter', () => {
  test('renders the legacy game shell at /', () => {
    renderRoute('/');

    expect(screen.getByTitle(/subrata race club/i)).toBeInTheDocument();
  });

  test('passes gift-only mode to the legacy gift experience', () => {
    renderRoute('/?giftOnly=1');

    expect(screen.getByTitle(/subrata race club/i)).toHaveAttribute(
      'src',
      '/legacy/index.html?giftOnly=1',
    );
  });

  test('renders party mode entrypoints at /hub', () => {
    renderRoute('/hub');

    expect(screen.getByRole('heading', { name: /scegli modalita/i })).toBeInTheDocument();
    expect(screen.getByText(/powered by idrocarburi/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /singolo/i })).toHaveAttribute('href', '/hub/single');
    expect(screen.getByRole('link', { name: /multiplayer/i })).toHaveAttribute(
      'href',
      '/hub/multiplayer',
    );
    expect(screen.queryByRole('link', { name: /bot race/i })).not.toBeInTheDocument();
  });

  test('can hide Home and Hub chrome links for gift-only sharing', () => {
    renderRoute('/hub?giftOnly=1');

    expect(screen.getByRole('heading', { name: /scegli modalita/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^home$/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /^hub$/i })).toBeNull();
  });

  test('renders a persistent return-to-lobby entry when a lobby is stored', () => {
    window.localStorage.setItem(
      'blitz-active-lobby',
      JSON.stringify({
        code: 'ABCD12',
      }),
    );

    renderRoute('/hub');

    expect(screen.getByRole('link', { name: /rientra lobby abcd12/i })).toHaveAttribute(
      'href',
      '/lobby/ABCD12',
    );
  });

  test('renders the lobby page with the route code at /lobby/ABCD12', () => {
    renderRoute('/lobby/ABCD12');

    expect(screen.getByRole('heading', { name: /lobby abcd12/i })).toBeInTheDocument();
  });

  test('renders the single-player catalog at /hub/single', () => {
    renderRoute('/hub/single');

    expect(screen.getByRole('heading', { name: /catalogo singolo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /semaforo/i })).toHaveAttribute(
      'href',
      '/hub/minigames/lights',
    );
    expect(screen.getByRole('link', { name: /rigori/i })).toHaveAttribute(
      'href',
      '/hub/minigames/penalty',
    );
    expect(screen.queryByRole('link', { name: /bot race/i })).not.toBeInTheDocument();
  });

  test('renders the multiplayer lobby entry at /hub/multiplayer', () => {
    renderRoute('/hub/multiplayer');

    expect(screen.getByRole('heading', { name: /ingresso multiplayer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /crea lobby/i })).toHaveAttribute('href', '/lobby/new');
  });

  test('redirects the obsolete practice route to /hub/single', () => {
    renderRoute('/practice');

    expect(screen.getByRole('heading', { name: /catalogo singolo/i })).toBeInTheDocument();
  });

  test('redirects the obsolete bot route to /hub/single', () => {
    renderRoute('/race/bot');

    expect(screen.getByRole('heading', { name: /catalogo singolo/i })).toBeInTheDocument();
  });

  test('renders the lights minigame page at /hub/minigames/lights', () => {
    renderRoute('/hub/minigames/lights');

    expect(screen.getByTitle(/reaction lights/i)).toHaveAttribute(
      'src',
      '/legacy/index.html?screen=lights',
    );
  });

  test('renders the penalty minigame page at /hub/minigames/penalty', () => {
    renderRoute('/hub/minigames/penalty');

    expect(screen.getByTitle(/penalty shootout/i)).toHaveAttribute(
      'src',
      '/legacy/index.html?screen=penalty',
    );
  });

  test('renders live race route outside app chrome', () => {
    mockUseLiveRaceSocket.mockReturnValue({
      isConnected: true,
      snapshot: createSnapshot(),
      finished: null,
      submitInput: vi.fn(),
    });

    const { container } = renderRoute('/race/live/session-1');

    expect(screen.getByLabelText('Fullscreen race session')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /home/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /hub/i })).toBeNull();
    expect(document.querySelector('.topbar')).toBeNull();
    expect(container.querySelector('.viewport')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.card')).toBeNull();
  });
});
