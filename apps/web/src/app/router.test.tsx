import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { createAppRouter } from './router';

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}

describe('createAppRouter', () => {
  test('renders the legacy game shell at /', () => {
    renderRoute('/');

    expect(screen.getByTitle(/subrata race club/i)).toBeInTheDocument();
  });

  test('renders the 10bit hub at /hub with the real game entries', () => {
    renderRoute('/hub');

    expect(screen.getByRole('heading', { name: /hub minigiochi/i })).toBeInTheDocument();
    expect(screen.getByText(/powered by idrocarburi/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /semaforo/i })).toHaveAttribute(
      'href',
      '/hub/minigames/lights',
    );
    expect(screen.getByRole('link', { name: /rigori/i })).toHaveAttribute(
      'href',
      '/hub/minigames/penalty',
    );
    expect(screen.getByRole('link', { name: /allenamento libero/i })).toHaveAttribute(
      'href',
      '/practice',
    );
    expect(
      screen
        .getAllByRole('link', { name: /bot race/i })
        .some((link) => link.getAttribute('href') === '/race/bot'),
    ).toBe(true);
    expect(screen.getByRole('link', { name: /lobby live/i })).toHaveAttribute(
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
