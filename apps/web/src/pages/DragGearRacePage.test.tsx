import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  GAME_SESSION_STATUS,
  PARTY_GAME_VARIANTS,
  RACE_STATUS,
  type DragGearSnapshot,
  type SessionFinishedPayload,
} from '@blitz/shared';

import { createAppRouter } from '../app/router';
import { resolveSessionRoute } from '../lib/sessionRoutes';

const { mockNavigate, mockSubmitInput, mockUseGameSessionSocket } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSubmitInput: vi.fn(),
  mockUseGameSessionSocket: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/useGameSessionSocket', () => ({
  useGameSessionSocket: mockUseGameSessionSocket,
}));

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}

function createSnapshot(overrides: Partial<DragGearSnapshot> = {}): DragGearSnapshot {
  return {
    sessionId: 'session-drag',
    lobbyCode: 'ABCD12',
    trackId: 'straight-drag-gear',
    status: RACE_STATUS.racing,
    tick: 12,
    startedAt: 1_713_980_000_000,
    countdown: 0,
    distanceTargetM: 402,
    shiftWindow: {
      goodMinRpm: 6500,
      perfectMinRpm: 7200,
      perfectMaxRpm: 7800,
      goodMaxRpm: 8200,
      redlineRpm: 9000,
    },
    playersState: [
      {
        playerId: 'socket-host',
        nickname: 'Blitz',
        gear: 1,
        maxGear: 4,
        rpm: 7200,
        speedKmh: 128,
        distanceM: 80,
        distanceTargetM: 402,
        throttlePressed: false,
        lastShiftQuality: null,
        shiftSummary: {
          early: 0,
          good: 0,
          perfect: 0,
          late: 0,
          total: 0,
        },
        finished: false,
        finishTimeMs: null,
        rank: null,
      },
    ],
    ...overrides,
  };
}

function createFinishedPayload(): SessionFinishedPayload {
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
          label: '12.340s',
          value: 12_340,
        },
      ],
      summary: {
        finishTimeMs: 12_340,
        perfectShifts: 1,
        goodShifts: 2,
        earlyShifts: 0,
        lateShifts: 0,
        totalShifts: 3,
      },
    },
  };
}

function mockDragSession({
  isConnected = true,
  snapshot = createSnapshot(),
  finished = null,
}: {
  isConnected?: boolean;
  snapshot?: DragGearSnapshot | null;
  finished?: SessionFinishedPayload | null;
} = {}) {
  mockUseGameSessionSocket.mockReturnValue({
    isConnected,
    socketId: 'socket-host',
    session: snapshot
      ? {
          sessionId: 'session-drag',
          lobbyCode: 'ABCD12',
          game: 'race',
          variant: PARTY_GAME_VARIANTS.dragSprint,
          status: GAME_SESSION_STATUS.active,
          countdown: null,
          results: null,
          state: snapshot,
        }
      : null,
    finished,
    submitInput: mockSubmitInput,
  });
}

beforeEach(() => {
  window.sessionStorage.clear();
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  });
  mockNavigate.mockReset();
  mockSubmitInput.mockReset();
  mockUseGameSessionSocket.mockReset();
  mockDragSession();
});

describe('DragGearRacePage', () => {
  test('renders drag gear hud and controls', () => {
    renderRoute('/race/drag/session-drag');

    expect(screen.getByText('Time the shift window')).toBeInTheDocument();
    expect(screen.getAllByText('RPM').length).toBeGreaterThan(0);
    expect(screen.getByText('GEAR 1/4')).toBeInTheDocument();
    expect(screen.getByText('KM/H')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('LAST SHIFT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'THROTTLE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SHIFT' })).toBeInTheDocument();
  });

  test('submits throttle press and release intent', () => {
    renderRoute('/race/drag/session-drag');

    const throttle = screen.getByRole('button', { name: 'THROTTLE' });

    fireEvent.pointerDown(throttle, { pointerId: 1 });
    fireEvent.pointerUp(throttle, { pointerId: 1 });

    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ kind: 'drag-throttle', pressed: true }),
    );
    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ kind: 'drag-throttle', pressed: false }),
    );
  });

  test('supports Space and ArrowUp held throttle', () => {
    renderRoute('/race/drag/session-drag');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    fireEvent.keyUp(window, { key: ' ', code: 'Space' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyUp(window, { key: 'ArrowUp' });

    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ kind: 'drag-throttle', pressed: true }),
    );
    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ kind: 'drag-throttle', pressed: false }),
    );
    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ kind: 'drag-throttle', pressed: true }),
    );
    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ kind: 'drag-throttle', pressed: false }),
    );
  });

  test('submits one discrete shift intent', () => {
    renderRoute('/race/drag/session-drag');

    const shift = screen.getByRole('button', { name: 'SHIFT' });

    fireEvent.click(shift);
    fireEvent.pointerDown(shift, { pointerId: 2 });

    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ kind: 'drag-shift' }),
    );
    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ kind: 'drag-shift' }),
    );
  });

  test('supports Shift and Enter one-shot shift with key-repeat ignored for shift', () => {
    renderRoute('/race/drag/session-drag');

    fireEvent.keyDown(window, { key: 'Shift' });
    fireEvent.keyDown(window, { key: 'Shift', repeat: true });
    fireEvent.keyUp(window, { key: 'Shift' });
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Enter', repeat: true });

    expect(mockSubmitInput).toHaveBeenCalledTimes(2);
    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ kind: 'drag-shift' }),
    );
    expect(mockSubmitInput).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ kind: 'drag-shift' }),
    );
  });

  test('releases throttle on cancellation lifecycle', () => {
    const { rerender, unmount } = renderRoute('/race/drag/session-drag');

    const throttle = screen.getByRole('button', { name: 'THROTTLE' });
    fireEvent.pointerDown(throttle, { pointerId: 1 });
    fireEvent.pointerCancel(throttle, { pointerId: 1 });

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    fireEvent.blur(window);

    fireEvent.keyDown(window, { key: 'ArrowUp' });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    fireEvent(document, new Event('visibilitychange'));

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    mockDragSession({ finished: createFinishedPayload() });
    rerender(<RouterProvider router={createAppRouter({ initialEntries: ['/race/drag/session-drag'] })} />);

    mockSubmitInput.mockClear();
    mockDragSession();
    rerender(<RouterProvider router={createAppRouter({ initialEntries: ['/race/drag/session-drag'] })} />);
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    mockDragSession({ isConnected: false });
    rerender(<RouterProvider router={createAppRouter({ initialEntries: ['/race/drag/session-drag'] })} />);

    expect(mockSubmitInput).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'drag-throttle', pressed: false }),
    );

    mockSubmitInput.mockClear();
    mockDragSession();
    const mounted = renderRoute('/race/drag/session-drag');
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    mounted.unmount();

    expect(mockSubmitInput).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'drag-throttle', pressed: false }),
    );

    unmount();
  });

  test('stores finished drag payload and navigates to results', async () => {
    const finished = createFinishedPayload();
    mockDragSession({ finished });

    renderRoute('/race/drag/session-drag');

    await waitFor(() => {
      expect(window.sessionStorage.getItem('blitz-results:session-drag')).toBe(
        JSON.stringify(finished),
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/results/session-drag', {
      replace: true,
      state: finished,
    });
  });

  test('does not render normal app chrome links or classes .panel, .card, .viewport, or .topbar', () => {
    const { container } = renderRoute('/race/drag/session-drag');

    expect(screen.queryByRole('link', { name: /home/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /hub/i })).toBeNull();
    expect(document.querySelector('.topbar')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.card')).toBeNull();
    expect(container.querySelector('.viewport')).toBeNull();
  });

  test('resolves drag sprint sessions to the drag route', () => {
    expect(
      resolveSessionRoute({
        game: 'race',
        variant: 'drag-sprint',
        sessionId: 'session-drag',
        lobbyCode: 'ABCD12',
        countdown: 3,
      }),
    ).toBe('/race/drag/session-drag');
  });
});
