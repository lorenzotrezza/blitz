import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { type StraightObstacleSnapshot } from '@blitz/shared';

import { DodgeRoadView } from './DodgeRoadView';

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

describe('DodgeRoadView', () => {
  test('renders dodge road lanes car obstacles and warning classes', () => {
    const { container } = render(<DodgeRoadView playerId="player-1" snapshot={snapshot} />);

    const road = screen.getByLabelText('Straight obstacle road');
    expect(road).toHaveClass('dodge-road', 'is-warning', 'is-slowdown');
    expect(container.querySelectorAll('.dodge-road__lane')).toHaveLength(3);

    const car = container.querySelector('.dodge-road__car') as HTMLElement | null;
    expect(car).toBeInTheDocument();
    expect(car?.style.getPropertyValue('--player-x')).toBe('-0.25');

    const obstacle = container.querySelector('.dodge-road__obstacle') as HTMLElement | null;
    expect(obstacle).toBeInTheDocument();
    expect(obstacle?.style.getPropertyValue('--obstacle-x')).toBe('0.35');
    expect(obstacle?.style.getPropertyValue('--obstacle-width')).toBe('0.24');
    expect(obstacle?.style.getPropertyValue('--obstacle-progress')).not.toBe('');

    expect(container).not.toHaveTextContent(/pickup|powerup|RPM|Gear|Lap|Checkpoint/i);
  });
});
