import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { FullscreenGameShell } from './FullscreenGameShell';
import { GameEmptyState } from './GameStates';

describe('FullscreenGameShell', () => {
  test('renders fullscreen shell without app chrome classes', () => {
    const { container } = render(
      <FullscreenGameShell
        controls={<button type="button">GO</button>}
        hud={<p>Race HUD</p>}
        viewport={<canvas aria-label="Race track" />}
      />,
    );

    const shell = screen.getByLabelText('Fullscreen race session');

    expect(shell).toHaveClass('game-shell');
    expect(container.querySelector('.game-shell__viewport')).toBeInTheDocument();
    expect(container.querySelector('.game-shell__hud')).toBeInTheDocument();
    expect(container.querySelector('.game-shell__controls')).toBeInTheDocument();

    ['panel', 'card', 'viewport', 'topbar'].forEach((className) => {
      expect(container.getElementsByClassName(className)).toHaveLength(0);
    });
  });

  test('renders waiting empty state copy', () => {
    render(
      <FullscreenGameShell
        controls={null}
        hud={null}
        stateOverlay={<GameEmptyState />}
        viewport={<canvas aria-label="Race track" />}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Waiting for race' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'No live snapshot yet. Keep this screen open; the countdown appears when the server starts the session.',
      ),
    ).toBeInTheDocument();
  });
});
