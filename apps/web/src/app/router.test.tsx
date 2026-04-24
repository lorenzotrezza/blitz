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

  test('renders the hub page at /hub', () => {
    renderRoute('/hub');

    expect(screen.getByRole('heading', { name: /game hub/i })).toBeInTheDocument();
  });

  test('renders the lobby page with the route code at /lobby/ABCD12', () => {
    renderRoute('/lobby/ABCD12');

    expect(screen.getByRole('heading', { name: /lobby abcd12/i })).toBeInTheDocument();
  });

  test('renders the lights minigame page at /hub/minigames/lights', () => {
    renderRoute('/hub/minigames/lights');

    expect(screen.getByRole('heading', { name: /reaction lights/i })).toBeInTheDocument();
  });
});
