import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { type RaceShellSnapshot } from '@blitz/shared';

import { GameHud } from './GameHud';

const snapshot: RaceShellSnapshot = {
  sessionId: 'session-1',
  lobbyCode: 'ABCD12',
  modeId: 'drag',
  status: 'racing',
  countdown: 0,
  tick: 12,
  players: [
    {
      playerId: 'socket-host',
      nickname: 'Blitz',
      progress: 0.54,
      speed: 220,
      penalty: null,
    },
  ],
  hud: {
    objective: 'Reach the finish',
    progressLabel: '54%',
    speedLabel: '220 km/h',
    penaltyLabel: 'Clean',
    inputLabel: 'Analog neutral',
    modeMetricLabel: 'Gear',
    modeMetricValue: '2',
  },
  mode: {},
};

describe('GameHud', () => {
  test('renders common gameplay hud text', () => {
    render(<GameHud fallbackSessionId="pending-session" snapshot={snapshot} />);

    expect(screen.getByText('Mode')).toBeInTheDocument();
    expect(screen.getByText('Drag')).toBeInTheDocument();
    expect(screen.getByText('Objective')).toBeInTheDocument();
    expect(screen.getByText('Reach the finish')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('54%')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('220 km/h')).toBeInTheDocument();
    expect(screen.getByText('Penalty')).toBeInTheDocument();
    expect(screen.getByText('Clean')).toBeInTheDocument();
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Analog neutral')).toBeInTheDocument();
    expect(screen.getByText('Gear')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Session')).toBeInTheDocument();
    expect(screen.getByText('session-1')).toBeInTheDocument();
    expect(screen.getByText('Countdown')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('racing')).toBeInTheDocument();
  });

  test('marks status updates as polite live text', () => {
    const { container } = render(<GameHud fallbackSessionId="pending-session" snapshot={snapshot} />);

    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
