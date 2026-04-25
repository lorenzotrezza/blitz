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
});
