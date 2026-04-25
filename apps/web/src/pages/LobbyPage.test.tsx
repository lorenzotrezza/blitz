import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { PLAYER_CONNECTION_STATE, type LobbyState } from '@blitz/shared';

import { createAppRouter } from '../app/router';

const { mockUseLobbySocket } = vi.hoisted(() => ({
  mockUseLobbySocket: vi.fn(),
}));

vi.mock('../lib/useLobbySocket', () => ({
  useLobbySocket: mockUseLobbySocket,
}));

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}

function createLobbySnapshot(): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'sprint-circuit',
    status: 'waiting',
    settings: {
      trackId: 'track-oval',
      botCount: 0,
      maxPlayers: 8,
      rounds: 3,
    },
    players: [
      {
        id: 'socket-host',
        nickname: 'Blitz',
        carId: 'f812',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
      {
        id: 'socket-guest',
        nickname: 'SubrataPal',
        carId: 'panda',
        ready: false,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
    ],
  };
}

beforeEach(() => {
  mockUseLobbySocket.mockReset();
  mockUseLobbySocket.mockReturnValue({
    draft: {
      nickname: '',
      carId: 'f812',
    },
    error: null,
    isBusy: false,
    isConnected: false,
    isHost: false,
    joinedLobby: null,
    me: null,
    sessionStarted: null,
    setNickname: vi.fn(),
    setCarId: vi.fn(),
    submit: vi.fn(),
    toggleReady: vi.fn(),
    leave: vi.fn(),
    selectGame: vi.fn(),
    startSession: vi.fn(),
    kickPlayer: vi.fn(),
    copyInviteLink: vi.fn(),
    copiedInvite: false,
  });
});

describe('LobbyPage', () => {
  test('renders create-lobby controls on /lobby/new', () => {
    renderRoute('/lobby/new');

    expect(screen.getByRole('heading', { name: /crea lobby live/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/macchina/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crea lobby/i })).toBeInTheDocument();
  });

  test('renders lobby roster and ready actions after joining', () => {
    const kickPlayer = vi.fn();
    mockUseLobbySocket.mockReturnValue({
      draft: {
        nickname: 'Blitz',
        carId: 'f812',
      },
      error: null,
      isBusy: false,
      isConnected: true,
      isHost: true,
      joinedLobby: createLobbySnapshot(),
      me: {
        id: 'socket-host',
        nickname: 'Blitz',
        carId: 'f812',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
      sessionStarted: null,
      setNickname: vi.fn(),
      setCarId: vi.fn(),
      submit: vi.fn(),
      toggleReady: vi.fn(),
      leave: vi.fn(),
      selectGame: vi.fn(),
      startSession: vi.fn(),
      kickPlayer,
      copyInviteLink: vi.fn(),
      copiedInvite: false,
    });

    renderRoute('/lobby/ABCD12');

    expect(screen.getByRole('heading', { name: /lobby abcd12/i })).toBeInTheDocument();
    expect(screen.getByText(/blitz/i)).toBeInTheDocument();
    expect(screen.getByText('SubrataPal', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /semaforo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rigori/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /corse/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sprint circuit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /non pronto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lascia lobby/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copia invito/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /avvia sessione/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kick subratapal/i })).toBeInTheDocument();
  });
});
