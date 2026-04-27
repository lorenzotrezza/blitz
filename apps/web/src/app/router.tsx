import {
  Link,
  NavLink,
  Outlet,
  createBrowserRouter,
  createMemoryRouter,
  useLocation,
} from 'react-router-dom';

import { HubPage } from '../pages/HubPage';
import { LandingPage } from '../pages/LandingPage';
import { DragGearRacePage } from '../pages/DragGearRacePage';
import { LightsSessionPage } from '../pages/LightsSessionPage';
import { LobbyIndexPage, LobbyPage } from '../pages/LobbyPage';
import { MinigameLightsPage } from '../pages/MinigameLightsPage';
import { MinigamePenaltyPage } from '../pages/MinigamePenaltyPage';
import { ModeSelectPage } from '../pages/ModeSelectPage';
import { PenaltySessionPage } from '../pages/PenaltySessionPage';
import { ResultsPage } from '../pages/ResultsPage';
import { SprintCircuitPage } from '../pages/SprintCircuitPage';
import { StraightObstacleRacePage } from '../pages/StraightObstacleRacePage';

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

function flagIsOn(value: string | null) {
  return value === '1' || value === 'true' || value === 'on' || value === 'yes';
}

function flagIsOff(value: string | null) {
  return value === '0' || value === 'false' || value === 'off' || value === 'no';
}

function readFlag(params: URLSearchParams, name: string, defaultValue: boolean) {
  const value = params.get(name);

  if (flagIsOn(value)) {
    return true;
  }

  if (flagIsOff(value)) {
    return false;
  }

  return defaultValue;
}

function shouldShowHomeHubLinks(search: string) {
  const params = new URLSearchParams(search);
  const giftOnly = readFlag(params, 'giftOnly', readFlag(params, 'gift', false));

  return readFlag(params, 'hub', readFlag(params, 'homeHub', !giftOnly));
}

function AppLayout() {
  const location = useLocation();
  const showHomeHubLinks = shouldShowHomeHubLinks(location.search);

  return (
    <div className="app-shell">
      <div className="scanlines" aria-hidden="true" />
      <div className="shell-glow" aria-hidden="true" />
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-kicker">SUBRATAAL PRESENTA</span>
          <span className="brand-title">Subrata Race Club</span>
        </Link>
        {showHomeHubLinks ? (
          <nav className="topnav" aria-label="Primary">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/hub">Hub</NavLink>
          </nav>
        ) : null}
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
          path: '/session/lights/:sessionId',
          element: <LightsSessionPage />,
        },
        {
          path: '/hub/minigames/penalty',
          element: <MinigamePenaltyPage />,
        },
        {
          path: '/session/penalty/:sessionId',
          element: <PenaltySessionPage />,
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
          element: <ModeSelectPage mode="single" />,
        },
        {
          path: '/race/bot',
          element: <ModeSelectPage mode="single" />,
        },
        {
          path: '/results/:sessionId',
          element: <ResultsPage />,
        },
      ],
    },
    {
      path: '/race/live/:sessionId',
      element: <SprintCircuitPage />,
    },
    {
      path: '/race/drag/:sessionId',
      element: <DragGearRacePage />,
    },
    {
      path: '/race/straight-obstacle/:sessionId',
      element: <StraightObstacleRacePage />,
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
