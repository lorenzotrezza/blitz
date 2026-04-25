import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, test } from 'vitest';

import { createAppRouter } from './router';

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  window.localStorage.clear();
});

describe('createAppRouter', () => {
  test('renders the legacy game shell at /', () => {
    renderRoute('/');

    expect(screen.getByTitle(/subrata race club/i)).toBeInTheDocument();
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

  test('renders the native practice route at /practice', () => {
    renderRoute('/practice');

    expect(screen.getByRole('heading', { name: /allenamento libero/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/retro race canvas/i)).toBeInTheDocument();
    expect(screen.getByText(/bot: off/i)).toBeInTheDocument();
  });

  test('renders the native bot route at /race/bot', () => {
    renderRoute('/race/bot');

    expect(screen.getByRole('heading', { name: /bot race/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/retro race canvas/i)).toBeInTheDocument();
    expect(screen.getByText(/bot: on/i)).toBeInTheDocument();
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
});
