import { Link, NavLink, Outlet, createBrowserRouter, createMemoryRouter } from 'react-router-dom';

import { BotRacePage } from '../pages/BotRacePage';
import { HubPage } from '../pages/HubPage';
import { LandingPage } from '../pages/LandingPage';
import { LobbyIndexPage, LobbyPage } from '../pages/LobbyPage';
import { MinigameLightsPage } from '../pages/MinigameLightsPage';
import { MinigamePenaltyPage } from '../pages/MinigamePenaltyPage';
import { ModeSelectPage } from '../pages/ModeSelectPage';
import { PracticePage } from '../pages/PracticePage';
import { RacePage } from '../pages/RacePage';
import { ResultsPage } from '../pages/ResultsPage';

type AppRouterOptions = {
  initialEntries?: Array<
    | string
    | {
        pathname: string;
        search?: string;
        hash?: string;
        state?: unknown;
      }
  >;
};

function AppLayout() {
  return (
    <div className="app-shell">
      <div className="scanlines" aria-hidden="true" />
      <div className="shell-glow" aria-hidden="true" />
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-kicker">SUBRATAAL PRESENTA</span>
          <span className="brand-title">Subrata Race Club</span>
        </Link>
        <nav className="topnav" aria-label="Primary">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/hub">Hub</NavLink>
        </nav>
      </header>
      <main className="viewport">
        <Outlet />
      </main>
    </div>
  );
}

function buildRoutes() {
  return [
    {
      path: '/',
      element: <LandingPage />,
    },
    {
      element: <AppLayout />,
      children: [
        {
          path: '/hub',
          element: <HubPage />,
        },
        {
          path: '/hub/single',
          element: <ModeSelectPage mode="single" />,
        },
        {
          path: '/hub/multiplayer',
          element: <ModeSelectPage mode="multiplayer" />,
        },
        {
          path: '/hub/minigames/lights',
          element: <MinigameLightsPage />,
        },
        {
          path: '/hub/minigames/penalty',
          element: <MinigamePenaltyPage />,
        },
        {
          path: '/lobby/:lobbyCode',
          element: <LobbyPage />,
          children: [
            {
              index: true,
              element: <LobbyIndexPage />,
            },
          ],
        },
        {
          path: '/practice',
          element: <PracticePage />,
        },
        {
          path: '/race/bot',
          element: <BotRacePage />,
        },
        {
          path: '/race/live/:sessionId',
          element: <RacePage />,
        },
        {
          path: '/results/:sessionId',
          element: <ResultsPage />,
        },
      ],
    },
  ];
}

export function createAppRouter(options: AppRouterOptions = {}) {
  const routes = buildRoutes();

  if (options.initialEntries) {
    return createMemoryRouter(routes, {
      initialEntries: options.initialEntries,
    });
  }

  return createBrowserRouter(routes);
}
