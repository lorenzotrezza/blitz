import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  LOBBY_RACE_MODES,
  PLAYER_CONNECTION_STATE,
  type LobbyState,
} from '@blitz/shared';

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

type LobbySnapshotOverrides = Omit<Partial<LobbyState>, 'settings'> & {
  settings?: Partial<LobbyState['settings']>;
};

function createLobbySnapshot(overrides: LobbySnapshotOverrides = {}): LobbyState {
  const { settings: settingsOverrides, ...restOverrides } = overrides;

  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'sprint-circuit',
    status: 'waiting',
    settings: {
      ...settingsOverrides,
      trackId: settingsOverrides?.trackId ?? 'track-oval',
      botCount: settingsOverrides?.botCount ?? 0,
      maxPlayers: settingsOverrides?.maxPlayers ?? 8,
      rounds: settingsOverrides?.rounds ?? 3,
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
    ...restOverrides,
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
    updateSettings: vi.fn(),
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
      updateSettings: vi.fn(),
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

  test('keeps start session disabled for drag sprint until its runtime is available', () => {
    const readyPlayers = createLobbySnapshot({
      selectedVariant: 'drag-sprint',
      settings: {
        raceMode: LOBBY_RACE_MODES.bestOf3,
      },
      players: createLobbySnapshot().players.map((player) => ({
        ...player,
        ready: true,
      })),
    }).players;

    mockUseLobbySocket.mockImplementation(() => ({
      draft: {
        nickname: 'Blitz',
        carId: 'f812',
      },
      error: null,
      isBusy: false,
      isConnected: true,
      isHost: true,
      joinedLobby: createLobbySnapshot({
        players: readyPlayers,
        selectedVariant: 'sprint-circuit',
      }),
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
      updateSettings: vi.fn(),
      startSession: vi.fn(),
      kickPlayer: vi.fn(),
      copyInviteLink: vi.fn(),
      copiedInvite: false,
    }));

    const view = renderRoute('/lobby/ABCD12');

    expect(screen.getByRole('button', { name: /avvia sessione/i })).toBeEnabled();

    mockUseLobbySocket.mockImplementation(() => ({
      draft: {
        nickname: 'Blitz',
        carId: 'f812',
      },
      error: null,
      isBusy: false,
      isConnected: true,
      isHost: true,
      joinedLobby: createLobbySnapshot({
        players: readyPlayers,
        selectedVariant: 'drag-sprint',
        settings: {
          raceMode: LOBBY_RACE_MODES.bestOf3,
        },
      }),
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
      updateSettings: vi.fn(),
      startSession: vi.fn(),
      kickPlayer: vi.fn(),
      copyInviteLink: vi.fn(),
      copiedInvite: false,
    }));

    view.unmount();
    renderRoute('/lobby/ABCD12');

    expect(screen.getByRole('button', { name: /avvia sessione/i })).toBeDisabled();
  });

  test('host can pick both race variants and drag sprint rulesets through lobby UI transitions', () => {
    const selectGame = vi.fn();
    const updateSettings = vi.fn();
    let joinedLobby = createLobbySnapshot();

    selectGame.mockImplementation((_game, variant) => {
      joinedLobby = createLobbySnapshot({
        selectedVariant: variant,
        settings: joinedLobby.settings,
      });
    });

    updateSettings.mockImplementation((settings) => {
      joinedLobby = createLobbySnapshot({
        selectedVariant: joinedLobby.selectedVariant,
        settings: {
          ...joinedLobby.settings,
          ...settings,
        },
      });
    });

    mockUseLobbySocket.mockImplementation(() => ({
      draft: {
        nickname: 'Blitz',
        carId: 'f812',
      },
      error: null,
      isBusy: false,
      isConnected: true,
      isHost: true,
      joinedLobby,
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
      selectGame,
      updateSettings,
      startSession: vi.fn(),
      kickPlayer: vi.fn(),
      copyInviteLink: vi.fn(),
      copiedInvite: false,
    }));

    let view = renderRoute('/lobby/ABCD12');

    expect(screen.getByRole('button', { name: /sprint circuit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /drag sprint/i })).toBeInTheDocument();
    expect(screen.getByText(/griglia 2\/8/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /finish line/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /best of 3/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /survival/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /drag sprint/i }));
    view.unmount();
    view = renderRoute('/lobby/ABCD12');

    expect(screen.getByRole('button', { name: /finish line/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /best of 3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /survival/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /best of 3/i }));
    view.unmount();
    view = renderRoute('/lobby/ABCD12');

    fireEvent.click(screen.getByRole('button', { name: /sprint circuit/i }));
    view.unmount();
    renderRoute('/lobby/ABCD12');

    expect(screen.queryByRole('button', { name: /finish line/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /best of 3/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /survival/i })).not.toBeInTheDocument();

    expect(selectGame).toHaveBeenCalledWith('race', 'drag-sprint');
    expect(selectGame).toHaveBeenCalledWith('race', 'sprint-circuit');
    expect(updateSettings).toHaveBeenCalledWith({
      raceMode: LOBBY_RACE_MODES.bestOf3,
    });
    expect(updateSettings).not.toHaveBeenCalledWith({
      raceMode: LOBBY_RACE_MODES.finishLine,
    });
  });
});
