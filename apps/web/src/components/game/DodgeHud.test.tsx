import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { type StraightObstacleSnapshot } from '@blitz/shared';

import { DodgeHud } from './DodgeHud';

const snapshot: StraightObstacleSnapshot = {
  sessionId: 'session-dodge',
  lobbyCode: 'ABCD12',
  trackId: 'straight-obstacle',
  mode: 'straight-obstacle',
  status: 'racing',
  tick: 12,
  startedAt: 1_777_202_000_000,
  countdown: 0,
  distanceTarget: 900,
  serverTimeMs: 2_000,
  warning: 'Obstacle ahead',
  playersState: [
    {
      playerId: 'player-1',
      nickname: 'Racer',
      x: -0.25,
      distance: 210,
      speed: 31,
      progress: 0.23,
      obstacleHits: 1,
      slowdownUntilMs: 2_250,
      finishedAtMs: null,
      status: 'racing',
    },
  ],
  activeObstacles: [
    {
      id: 'obstacle-1',
      waveId: 'wave-1',
      centerX: 0.35,
      width: 0.24,
      distance: 260,
      depth: 18,
      warningDistance: 150,
      hitPlayerIds: [],
    },
  ],
};

describe('DodgeHud', () => {
  test('renders dodge hud text with polite live state', () => {
    const { container } = render(<DodgeHud playerId="player-1" snapshot={snapshot} />);

    expect(screen.getByText('Dodge obstacles')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText(/210\s*\/\s*900/)).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText(/31/)).toBeInTheDocument();
    expect(screen.getByText('Obstacle ahead')).toBeInTheDocument();
    expect(screen.getByText('Hits')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Slowdown')).toBeInTheDocument();

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveTextContent(/Obstacle ahead|Slowdown/);
    expect(container).not.toHaveTextContent(/pickup|powerup|RPM|Gear|Lap|Checkpoint/i);
  });
});
