# Phase 06: Lobby, Results, And Regression Polish - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 20
**Analogs found:** 20 / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/shared/src/lobby.ts` | config, utility | request-response, validation | `packages/shared/src/lobby.ts` | exact |
| `packages/shared/src/contracts.ts` | model, contract | event-driven | `packages/shared/src/contracts.ts` | exact |
| `packages/shared/src/game.ts` | model, utility | transform, validation | `packages/shared/src/game.ts` | exact |
| `packages/shared/src/contracts.test.ts` | test | contract validation | `packages/shared/src/contracts.test.ts` | exact |
| `apps/server/src/games/registry.ts` | config, service | request-response, factory lookup | `apps/server/src/games/registry.ts` | exact |
| `apps/server/src/games/registry.test.ts` | test | registry/startability regression | `apps/server/src/games/registry.test.ts` | exact |
| `apps/server/src/socket/register.ts` | controller, gateway | event-driven, request-response | `apps/server/src/socket/register.ts` | exact |
| `apps/web/src/pages/LobbyPage.tsx` | component, page | event-driven, request-response | `apps/web/src/pages/LobbyPage.tsx` | exact |
| `apps/web/src/pages/LobbyPage.test.tsx` | test | UI event-driven | `apps/web/src/pages/LobbyPage.test.tsx` | exact |
| `apps/web/src/lib/sessionRoutes.ts` | utility | transform, request-response | `apps/web/src/lib/sessionRoutes.ts` | exact |
| `apps/web/src/lib/sessionRoutes.test.ts` | test | transform | `apps/web/src/pages/DragGearRacePage.test.tsx` | role-match |
| `apps/web/src/app/router.tsx` | route, config | request-response route rendering | `apps/web/src/app/router.tsx` | exact |
| `apps/web/src/app/router.test.tsx` | test | route rendering, fullscreen regression | `apps/web/src/app/router.test.tsx` | exact |
| `apps/web/src/lib/useGameSessionSocket.ts` | hook | event-driven, pub-sub | `apps/web/src/lib/useGameSessionSocket.ts` | exact |
| `apps/web/src/lib/useLiveRaceSocket.ts` | hook | event-driven, pub-sub | `apps/web/src/lib/useGameSessionSocket.ts` | role-match |
| `apps/web/src/pages/DragGearRacePage.tsx` | component, page | event-driven, file-I/O, fullscreen | `apps/web/src/pages/DragGearRacePage.tsx` | exact |
| `apps/web/src/pages/SprintCircuitPage.tsx` | component, page | event-driven, file-I/O, fullscreen | `apps/web/src/pages/SprintCircuitPage.tsx` | exact |
| `apps/web/src/pages/ResultsPage.tsx` | component, page | file-I/O, request-response | `apps/web/src/pages/ResultsPage.tsx` | exact |
| `apps/web/src/components/game/RaceModeResultsSummary.tsx` | component, utility | transform | `apps/web/src/components/game/DragResultsSummary.tsx` | role-match |
| `apps/web/src/pages/ResultsPage.test.tsx` | test | file-I/O, UI rendering | `apps/web/src/pages/ResultsPage.test.tsx` | exact |

## Pattern Assignments

### `packages/shared/src/lobby.ts` (config, utility, request-response validation)

**Analog:** `packages/shared/src/lobby.ts`

**Imports pattern** (lines 1-1):
```typescript
import type { DragSprintMode } from './game.js';
```

**Canonical variant pattern** (lines 12-24):
```typescript
export const PARTY_GAMES = {
  lights: 'lights',
  penalty: 'penalty',
  race: 'race',
} as const;

export type PartyGame = (typeof PARTY_GAMES)[keyof typeof PARTY_GAMES];

export const PARTY_GAME_VARIANTS = {
  sprintCircuit: 'sprint-circuit',
  trafficSurvival: 'traffic-survival',
  dragSprint: 'drag-sprint',
} as const;
```

**Startability pattern** (lines 84-107):
```typescript
export function isLobbySelectionStartable(
  game: PartyGame,
  variant: PartyGameVariant,
  raceMode: DragSprintMode | null = null,
  playerCount: number | null = null,
): boolean {
  if (game !== PARTY_GAMES.race) {
    return true;
  }

  if (variant === PARTY_GAME_VARIANTS.sprintCircuit) {
    return true;
  }

  if (variant === PARTY_GAME_VARIANTS.dragSprint) {
    return (
      playerCount !== null &&
      playerCount <= 3 &&
      (raceMode === LOBBY_RACE_MODES.finishLine || raceMode === LOBBY_RACE_MODES.bestOf3)
    );
  }

  return false;
}
```

**Apply to Phase 06:** Replace/extend `PARTY_GAME_VARIANTS` with one canonical id per final race mode. Keep `isLobbySelectionStartable()` as the single shared policy used by web disabled state and server start validation.

### `packages/shared/src/contracts.ts` (model, contract, event-driven)

**Analog:** `packages/shared/src/contracts.ts`

**Imports pattern** (lines 1-12):
```typescript
import type {
  DragGearInput,
  PlayerInput,
  RaceGameInput,
  RaceSnapshot,
} from './game.js';
import type {
  LobbySettings,
  LobbyState,
  PartyGame,
  PartyGameVariant,
} from './lobby.js';
```

**Socket event family pattern** (lines 14-40):
```typescript
export const SOCKET_EVENTS = {
  client: {
    selectGame: 'client:select-game',
    startSession: 'client:start-session',
    gameInput: 'client:game-input',
    postGameAction: 'client:post-game-action',
  },
  server: {
    sessionStarted: 'server:session-started',
    sessionState: 'server:session-state',
    sessionFinished: 'server:session-finished',
    postGameUpdated: 'server:post-game-updated',
  },
} as const;
```

**Result payload pattern** (lines 103-150):
```typescript
export interface GameResultEntry {
  playerId: string;
  rank: number;
  label?: string | null;
  value?: number | null;
}

export interface GameResults {
  rankings: GameResultEntry[];
  summary?: Record<string, string | number | boolean | null>;
}

export interface SessionFinishedPayload {
  sessionId: string;
  lobbyCode: string;
  game: PartyGame;
  variant: PartyGameVariant;
  results: GameResults;
}
```

**Apply to Phase 06:** Keep the active contract family as `client:game-input`, `server:session-state`, and `server:session-finished`. Results summaries should stay display payloads; do not compute authoritative outcomes in web code.

### `packages/shared/src/game.ts` (model, utility, transform validation)

**Analog:** `packages/shared/src/game.ts`

**Mode/input contract pattern** (lines 11-82):
```typescript
export const RACE_SHELL_MODE_IDS = {
  drag: 'drag',
  dodge: 'dodge',
  circle: 'circle',
  figureEight: 'figure-eight',
} as const;

export interface RaceInputBase extends Record<string, unknown> {
  kind: RaceGameInputKind;
  sequence: number;
  clientTimeMs: number;
  modeId: RaceShellModeId;
}

export type RaceGameInput = RaceAnalogInput | RaceButtonInput | RaceActionInput;
```

**Shared HUD snapshot pattern** (lines 84-112):
```typescript
export interface RaceShellPlayer {
  playerId: string;
  nickname: string;
  progress: number;
  speed: number;
  penalty: string | null;
}

export interface RaceShellSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  modeId: RaceShellModeId;
  status: RaceShellStatus;
  countdown: number | null;
  tick: number;
  players: RaceShellPlayer[];
  hud: RaceShellHud;
  mode: Record<string, unknown>;
}
```

**Validation helper pattern** (lines 323-376):
```typescript
export function isRaceGameInput(input: unknown): input is RaceGameInput {
  if (!isObjectRecord(input)) {
    return false;
  }

  if (!isRaceShellModeId(input.modeId)) {
    return false;
  }

  if (!isFiniteNonNegative(input.sequence) || !isFiniteNonNegative(input.clientTimeMs)) {
    return false;
  }

  if (input.kind === RACE_GAME_INPUT_KIND.analog) {
    if (!isObjectRecord(input.vector)) {
      return false;
    }
    return true;
  }

  if (input.kind === RACE_GAME_INPUT_KIND.button) {
    return (
      Object.values(RACE_GAME_BUTTONS).includes(input.button as RaceGameButton) &&
      Object.values(RACE_GAME_BUTTON_STATES).includes(input.state as RaceGameButtonState)
    );
  }

  if (input.kind === RACE_GAME_INPUT_KIND.action) {
    return typeof input.action === 'string' && input.action.length > 0;
  }

  return false;
}
```

**Apply to Phase 06:** Reuse `RaceShellModeId` values for HUD/result branching. Add result-summary field typing only if the planner decides generic `GameResults.summary` is too loose for final mode summaries.

### `apps/server/src/games/registry.ts` (config, service, factory lookup)

**Analog:** `apps/server/src/games/registry.ts`

**Imports pattern** (lines 1-7):
```typescript
import type { LobbyState, PartyGame, PartyGameVariant } from '@blitz/shared';

import { createLightsRuntime } from './lights/runtime.js';
import { createPenaltyRuntime } from './penalty/runtime.js';
import { createDragSprintRuntime } from './race/dragSprint.js';
import { createSprintCircuitRuntime } from './race/sprintCircuit.js';
import type { GameRuntimeFactory } from './runtime.js';
```

**Registry entry pattern** (lines 22-87):
```typescript
const DEFAULT_GAME_REGISTRY: GameRegistryEntry[] = [
  {
    key: 'lights',
    game: 'lights',
    variant: null,
    countdown: 3,
    createRuntime(lobby: LobbyState, sessionId: string, callbacks) {
      return createLightsRuntime(lobby, sessionId, {
        onState(payload) {
          callbacks.onState?.(payload);
        },
        onFinished(payload) {
          callbacks.onFinished?.(payload);
        },
      });
    },
  },
  {
    key: 'race:drag-sprint',
    game: 'race',
    variant: 'drag-sprint',
    countdown: 3,
    createRuntime(lobby: LobbyState, sessionId: string, callbacks) {
      return createDragSprintRuntime(lobby, sessionId, {
        onState(payload) {
          callbacks.onState?.(payload);
        },
        onFinished(payload) {
          callbacks.onFinished?.(payload);
        },
      });
    },
  },
];
```

**Resolve pattern** (lines 89-103):
```typescript
export function createGameRuntimeRegistry(
  entries: GameRegistryEntry[] = DEFAULT_GAME_REGISTRY,
): GameRuntimeRegistry {
  return {
    list() {
      return [...entries];
    },
    resolve(game, variant) {
      return (
        entries.find((entry) => entry.game === game && entry.variant === variant) ??
        null
      );
    },
  };
}
```

**Apply to Phase 06:** Register all final race variants in this static table. Prefer importing shared `PARTY_GAME_VARIANTS` constants if updated, so registry keys and shared lobby ids cannot drift.

### `apps/server/src/socket/register.ts` (controller, gateway, event-driven)

**Analog:** `apps/server/src/socket/register.ts`

**Imports pattern** (lines 4-20):
```typescript
import {
  isLobbySelectionStartable,
  LOBBY_STATUS,
  SOCKET_EVENTS,
  ClientToServerEvents,
  GameSessionEnvelope,
  type PostGameActionPayload,
  type LobbyErrorPayload,
  type LobbyState,
  SessionFinishedPayload,
  ServerToClientEvents,
} from '@blitz/shared';
import { createGameManager } from '../games/manager.js';
import { createGameRuntimeRegistry, type GameRuntimeRegistry } from '../games/registry.js';
```

**Error handling pattern** (lines 58-72):
```typescript
async function handleLobbyMutation(
  socket: BlitzSocket,
  mutate: () => Promise<void> | void,
): Promise<void> {
  try {
    await mutate();
  } catch (error) {
    if (error instanceof LobbyServiceError) {
      emitLobbyError(socket, error);
      return;
    }

    throw error;
  }
}
```

**Authoritative startability and registry pattern** (lines 101-150):
```typescript
async function startSession(code: string, playerId: string) {
  const lobby = lobbyService.getLobby(code);

  if (!isLobbySelectionStartable(
    lobby.selectedGame,
    lobby.selectedVariant,
    lobby.settings.raceMode ?? null,
    lobby.players.length,
  )) {
    throw new LobbyServiceError('game-not-supported', 'Selected game is not supported');
  }

  const gameEntry = gameRegistry.resolve(lobby.selectedGame, lobby.selectedVariant);

  if (!gameEntry) {
    throw new LobbyServiceError('game-not-supported', 'Selected game is not supported');
  }

  io.to(lobby.code).emit(SOCKET_EVENTS.server.sessionStarted, startedPayload);
}
```

**Post-game action pattern** (lines 159-181):
```typescript
async function applyPostGameAction(payload: PostGameActionPayload, playerId: string) {
  const lobby = lobbyService.getLobby(payload.code);

  if (lobby.hostId !== playerId) {
    throw new LobbyServiceError('player-not-host', 'Only the host can control the next step');
  }

  if (payload.action === 'rematch') {
    await startSession(lobby.code, playerId);
    return;
  }

  const waitingLobby = lobbyService.setStatus({
    code: lobby.code,
    status: LOBBY_STATUS.waiting,
  });
  emitLobbySnapshot(io, waitingLobby);
  emitPostGameUpdate(payload, waitingLobby);
}
```

**Apply to Phase 06:** This gateway should usually not need new variant switches. The server should keep validating through `isLobbySelectionStartable()` and `createGameRuntimeRegistry().resolve()`.

### `apps/web/src/pages/LobbyPage.tsx` (component, page, event-driven)

**Analog:** `apps/web/src/pages/LobbyPage.tsx`

**Imports pattern** (lines 1-13):
```typescript
import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import {
  isLobbySelectionStartable,
  LOBBY_RACE_MODES,
  PARTY_GAMES,
  PARTY_GAME_VARIANTS,
  type LobbyState,
} from '@blitz/shared';

import { resolveSessionRoute } from '../lib/sessionRoutes';
import { useLobbySocket } from '../lib/useLobbySocket';
```

**Local catalog pattern to replace** (lines 26-35):
```typescript
const RACE_VARIANTS = [
  { value: PARTY_GAME_VARIANTS.sprintCircuit, label: 'Sprint Circuit' },
  { value: PARTY_GAME_VARIANTS.dragSprint, label: 'Drag Sprint' },
] as const;
```

**Start button gate pattern** (lines 80-91):
```typescript
const readyToLaunch = allDriversReady(joinedLobby);
const selectedRaceMode = joinedLobby?.settings.raceMode ?? null;
const canStartSession = Boolean(
  joinedLobby &&
    readyToLaunch &&
    isLobbySelectionStartable(
      joinedLobby.selectedGame,
      joinedLobby.selectedVariant,
      selectedRaceMode,
      joinedLobby.players.length,
    ),
);
```

**Session navigation pattern** (lines 99-106):
```typescript
useEffect(() => {
  if (sessionStarted) {
    navigate(resolveSessionRoute(sessionStarted), {
      replace: true,
      state: sessionStarted,
    });
  }
}, [navigate, sessionStarted]);
```

**Game and race selection pattern** (lines 162-233):
```typescript
<article className="card lobby-card">
  <h2>Selezione Gioco</h2>
  {joinedLobby ? (
    <>
      <div className="action-row">
        <button onClick={() => selectGame(PARTY_GAMES.lights, null)}>Semaforo</button>
        <button onClick={() => selectGame(PARTY_GAMES.penalty, null)}>Rigori</button>
        <button
          onClick={() =>
            selectGame(
              PARTY_GAMES.race,
              joinedLobby.selectedVariant ?? PARTY_GAME_VARIANTS.sprintCircuit,
            )
          }
        >
          Corse
        </button>
      </div>
      {joinedLobby.selectedGame === PARTY_GAMES.race ? (
        <div className="action-row">
          {RACE_VARIANTS.map((variant) => (
            <button
              key={variant.value}
              disabled={!isHost || isBusy}
              onClick={() => selectGame(PARTY_GAMES.race, variant.value)}
            >
              {variant.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  ) : null}
</article>
```

**Apply to Phase 06:** Replace bare two-button `RACE_VARIANTS` with four compact selectable cards/rows showing label, objective, control, and skill focus. Preserve Semaforo/Rigori as first-level buttons and keep `Avvia Sessione` gated by shared startability.

### `apps/web/src/lib/sessionRoutes.ts` (utility, transform)

**Analog:** `apps/web/src/lib/sessionRoutes.ts`

**Route resolver pattern** (lines 1-17):
```typescript
import type { SessionStartedPayload } from '@blitz/shared';

export function resolveSessionRoute(payload: SessionStartedPayload): string {
  if (payload.game === 'lights') {
    return `/session/lights/${payload.sessionId}`;
  }

  if (payload.game === 'penalty') {
    return `/session/penalty/${payload.sessionId}`;
  }

  if (payload.game === 'race' && payload.variant === 'drag-sprint') {
    return `/race/drag/${payload.sessionId}`;
  }

  return `/race/live/${payload.sessionId}`;
}
```

**Apply to Phase 06:** Import `PARTY_GAME_VARIANTS` and branch each final race variant to the correct fullscreen route. Avoid silent fallback from unknown race variants to an incorrect race page.

### `apps/web/src/app/router.tsx` (route config, request-response route rendering)

**Analog:** `apps/web/src/app/router.tsx`

**Imports pattern** (lines 1-13):
```typescript
import { Link, NavLink, Outlet, createBrowserRouter, createMemoryRouter } from 'react-router-dom';

import { DragGearRacePage } from '../pages/DragGearRacePage';
import { ResultsPage } from '../pages/ResultsPage';
import { SprintCircuitPage } from '../pages/SprintCircuitPage';
```

**Fullscreen route placement pattern** (lines 49-118):
```typescript
function buildRoutes() {
  return [
    {
      element: <AppLayout />,
      children: [
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
  ];
}
```

**Apply to Phase 06:** New or renamed race routes must stay outside the `AppLayout` branch to preserve fullscreen gameplay. If a single route remains, it must dispatch to small mode adapters instead of hardcoding circle behavior.

### Race Pages And Session Hooks (component/page, hook, event-driven fullscreen)

**Analogs:** `apps/web/src/pages/DragGearRacePage.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/lib/useGameSessionSocket.ts`

**Generic session hook pattern** (`apps/web/src/lib/useGameSessionSocket.ts` lines 20-80):
```typescript
export function useGameSessionSocket(sessionId: string): GameSessionSocketState {
  const socket = useMemo(() => getBlitzSocket(), []);
  const [session, setSession] = useState<GameSessionEnvelope | null>(null);
  const [finished, setFinished] = useState<SessionFinishedPayload | null>(null);

  useEffect(() => {
    const handleSessionState = (payload: GameSessionEnvelope) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setSession(payload);
    };

    const handleSessionFinished = (payload: SessionFinishedPayload) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setFinished(payload);
    };

    socket.on(SOCKET_EVENTS.server.sessionState, handleSessionState);
    socket.on(SOCKET_EVENTS.server.sessionFinished, handleSessionFinished);

    return () => {
      socket.off(SOCKET_EVENTS.server.sessionState, handleSessionState);
      socket.off(SOCKET_EVENTS.server.sessionFinished, handleSessionFinished);
    };
  }, [sessionId, socket]);

  return {
    session,
    finished,
    submitInput(payload) {
      socket.emit(SOCKET_EVENTS.client.gameInput, payload);
    },
  };
}
```

**Drag adapter pattern** (`apps/web/src/pages/DragGearRacePage.tsx` lines 61-68):
```typescript
const { isConnected, socketId, session, finished, submitInput } =
  useGameSessionSocket(sessionId);
const snapshot =
  session?.game === 'race' &&
  session.variant === 'drag-sprint' &&
  isDragGearSnapshot(session.state)
    ? session.state
    : null;
```

**Fullscreen result storage pattern** (`apps/web/src/pages/DragGearRacePage.tsx` lines 129-140):
```typescript
useEffect(() => {
  if (!finished) {
    return;
  }

  window.sessionStorage.setItem(`blitz-results:${finished.sessionId}`, JSON.stringify(finished));
  navigate(`/results/${finished.sessionId}`, {
    replace: true,
    state: finished,
  });
  resetInput();
}, [finished, navigate, resetInput]);
```

**Analog fullscreen shell pattern** (`apps/web/src/pages/SprintCircuitPage.tsx` lines 242-303):
```typescript
return (
  <FullscreenGameShell
    hud={<GameHud snapshot={shellSnapshot} fallbackSessionId={sessionId} />}
    viewport={
      <GameViewport label="Sprint circuit track" aspectRatio={`${SPRINT_CIRCUIT_SIZE.width} / ${SPRINT_CIRCUIT_SIZE.height}`}>
        <canvas ref={canvasRef} className="race-canvas-native" />
      </GameViewport>
    }
    controls={
      <>
        <div className="game-control-zone game-control-zone--left">
          <AnalogPad label="STEER" value={analog} disabled={!controlsEnabled} onVectorChange={setAnalogVector} />
        </div>
        <div className="game-control-zone game-control-zone--right">
          <ActionButton label="GO" button={RACE_GAME_BUTTONS.primary} />
          <ActionButton label="BRAKE" button={RACE_GAME_BUTTONS.secondary} />
        </div>
      </>
    }
    stateOverlay={!isConnected ? <GameErrorState /> : shellSnapshot ? null : <GameEmptyState />}
  />
);
```

**Apply to Phase 06:** Prefer `useGameSessionSocket()` for final mode-aware race pages. Treat `useLiveRaceSocket()` as legacy/sprint-specific unless it is generalized; it currently filters only `PARTY_GAME_VARIANTS.sprintCircuit` in lines 40-62.

### `apps/web/src/pages/ResultsPage.tsx` (component, page, file-I/O)

**Analog:** `apps/web/src/pages/ResultsPage.tsx`

**Imports pattern** (lines 1-8):
```typescript
import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import type { RaceFinishedPayload, SessionFinishedPayload } from '@blitz/shared';

import { DragResultsSummary } from '../components/game/DragResultsSummary';
import { resolveSessionRoute } from '../lib/sessionRoutes';
import { usePostGameActions } from '../lib/usePostGameActions';
```

**Payload normalization pattern** (lines 18-41):
```typescript
function normalizePayload(payload: SessionFinishedPayload | RaceFinishedPayload | null): SessionFinishedPayload | null {
  if (!payload) {
    return null;
  }

  if ('results' in payload) {
    return payload;
  }

  return {
    sessionId: payload.sessionId,
    lobbyCode: payload.lobbyCode,
    game: 'race',
    variant: null,
    results: {
      rankings: payload.standings.map((standing) => ({
        playerId: standing.entrantId,
        rank: standing.position,
        label: formatFinishTime(standing.finishTimeMs),
        value: standing.finishTimeMs,
      })),
    },
  };
}
```

**Storage read pattern** (lines 59-70):
```typescript
function readStoredResults(sessionId: string) {
  const raw = window.sessionStorage.getItem(`blitz-results:${sessionId}`);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionFinishedPayload | RaceFinishedPayload;
  } catch {
    return null;
  }
}
```

**Ranking plus summary mount pattern** (lines 113-137):
```typescript
{payload ? (
  <ol className="results-list">
    {payload.results.rankings.map((entry) => (
      <li className="results-row" key={entry.playerId}>
        <span>#{entry.rank}</span>
        <strong>{roster?.players?.find((player) => player.id === entry.playerId)?.nickname ?? entry.playerId}</strong>
        <span>{entry.label ?? entry.value ?? 'ND'}</span>
      </li>
    ))}
  </ol>
) : (
  <article className="card">
    <h2>Nessun Dato</h2>
    <p>Apri una gara live dalla lobby per riempire la board finale.</p>
  </article>
)}

{payload?.game === 'race' && payload.variant === 'drag-sprint' ? (
  <DragResultsSummary summary={payload.results.summary} rankingLabel={winningRanking?.label ?? winningRanking?.value ?? null} />
) : null}
```

**Post-game action pattern** (lines 139-173):
```typescript
{isHost && lobby ? (
  <>
    <button onClick={() => submitAction('rematch')}>Rigioca</button>
    <button onClick={() => submitAction('return-to-lobby')}>Torna alla Lobby</button>
    <button onClick={() => submitAction('change-game')}>Cambia Gioco</button>
  </>
) : lobby ? (
  <p className="lobby-meta">In attesa della decisione host per il prossimo giro.</p>
) : null}
```

**Apply to Phase 06:** Keep rankings independent from mode summaries. Add a mode-summary dispatcher or extracted helpers after rankings. Every helper must return `null` when required fields are missing.

### `apps/web/src/components/game/RaceModeResultsSummary.tsx` (component utility, transform)

**Analog:** `apps/web/src/components/game/DragResultsSummary.tsx`

**Number parsing pattern** (lines 14-21):
```typescript
function getNumber(
  summary: DragResultsSummaryProps['summary'],
  key: (typeof SHIFT_KEYS)[number] | 'finishTimeMs',
) {
  const value = summary?.[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
```

**Graceful no-render pattern** (lines 36-53):
```typescript
export function DragResultsSummary({ summary, rankingLabel }: DragResultsSummaryProps) {
  const counts = {
    perfect: getNumber(summary, 'perfectShifts'),
    good: getNumber(summary, 'goodShifts'),
    early: getNumber(summary, 'earlyShifts'),
    late: getNumber(summary, 'lateShifts'),
    total: getNumber(summary, 'totalShifts'),
  };

  if (
    counts.perfect === null ||
    counts.good === null ||
    counts.early === null ||
    counts.late === null ||
    counts.total === null
  ) {
    return null;
  }
```

**Summary markup pattern** (lines 55-85):
```typescript
return (
  <article className="drag-results-summary">
    <h2>Shift Summary</h2>
    <dl className="drag-results-summary__grid">
      <div>
        <dt>Finish Time</dt>
        <dd>{formatFinishTime(summary, rankingLabel)}</dd>
      </div>
      <div>
        <dt>PERFECT</dt>
        <dd>{counts.perfect}</dd>
      </div>
    </dl>
  </article>
);
```

**Apply to Phase 06:** Reuse this finite-number guard for Straight Obstacle, Circle Track, and Figure-Eight summaries. Use mode labels and fields from the UI spec, but keep the failure mode as `return null`.

## Test Pattern Assignments

### Shared and Server Tests

**Analogs:** `packages/shared/src/contracts.test.ts`, `apps/server/src/games/registry.test.ts`

**Shared startability assertions** (`packages/shared/src/contracts.test.ts` lines 132-154):
```typescript
test('exports the current lobby selection startability policy', () => {
  assert.equal(isLobbySelectionStartable('lights', null), true);
  assert.equal(isLobbySelectionStartable('penalty', null), true);
  assert.equal(isLobbySelectionStartable('race', 'sprint-circuit'), true);
  assert.equal(
    isLobbySelectionStartable('race', 'drag-sprint', LOBBY_RACE_MODES.finishLine, 3),
    true,
  );
  assert.equal(isLobbySelectionStartable('race', null), false);
});
```

**Registry coverage pattern** (`apps/server/src/games/registry.test.ts` lines 8-14):
```typescript
test('game registry exposes the current playable variants while shared startability stays mode-aware', () => {
  const registry = createGameRuntimeRegistry();
  assert.equal(registry.resolve(PARTY_GAMES.lights, null) !== null, true);
  assert.equal(registry.resolve(PARTY_GAMES.penalty, null) !== null, true);
  assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.sprintCircuit) !== null, true);
  assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.dragSprint) !== null, true);
});
```

**Apply to Phase 06:** Replace two old race assertions with all four final variant ids. Keep Semaforo/Rigori assertions in place.

### Lobby Tests

**Analog:** `apps/web/src/pages/LobbyPage.test.tsx`

**Mock hook pattern** (lines 16-22):
```typescript
const { mockUseLobbySocket } = vi.hoisted(() => ({
  mockUseLobbySocket: vi.fn(),
}));

vi.mock('../lib/useLobbySocket', () => ({
  useLobbySocket: mockUseLobbySocket,
}));
```

**Lobby snapshot fixture pattern** (lines 34-68):
```typescript
function createLobbySnapshot(overrides: LobbySnapshotOverrides = {}): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: PARTY_GAMES.race,
    selectedVariant: PARTY_GAME_VARIANTS.sprintCircuit,
    status: 'waiting',
    settings: {
      maxPlayers: 8,
      rounds: 3,
    },
    players: [
      { id: 'socket-host', nickname: 'Blitz', ready: true, connectionState: PLAYER_CONNECTION_STATE.connected },
    ],
    ...restOverrides,
  };
}
```

**Interaction pattern** (lines 352-438):
```typescript
test('host can pick both race variants and drag sprint rulesets through lobby UI transitions', () => {
  const selectGame = vi.fn();
  const updateSettings = vi.fn();
  let joinedLobby = createLobbySnapshot();

  selectGame.mockImplementation((_game, variant) => {
    joinedLobby = createLobbySnapshot({
      selectedVariant: variant,
      settings: joinedLobby.settings,
    });
  });

  fireEvent.click(screen.getByRole('button', { name: /drag sprint/i }));

  expect(selectGame).toHaveBeenCalledWith(PARTY_GAMES.race, PARTY_GAME_VARIANTS.dragSprint);
});
```

**Apply to Phase 06:** Update fixtures and assertions for four race cards plus objective/control/skill copy. Preserve Semaforo and Rigori button assertions.

### Route and Fullscreen Tests

**Analogs:** `apps/web/src/app/router.test.tsx`, `apps/web/src/pages/DragGearRacePage.test.tsx`, `apps/web/src/pages/SprintCircuitPage.test.tsx`

**Fullscreen route regression pattern** (`apps/web/src/app/router.test.tsx` lines 152-169):
```typescript
test('renders live race route outside app chrome', () => {
  const { container } = renderRoute('/race/live/session-1');

  expect(screen.getByLabelText('Fullscreen race session')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /home/i })).toBeNull();
  expect(screen.queryByRole('link', { name: /hub/i })).toBeNull();
  expect(document.querySelector('.topbar')).toBeNull();
  expect(container.querySelector('.viewport')).toBeNull();
  expect(container.querySelector('.panel')).toBeNull();
  expect(container.querySelector('.card')).toBeNull();
});
```

**Route resolver direct assertion pattern** (`apps/web/src/pages/DragGearRacePage.test.tsx` lines 327-337):
```typescript
test('resolves drag sprint sessions to the drag route', () => {
  expect(
    resolveSessionRoute({
      game: 'race',
      variant: 'drag-sprint',
      sessionId: 'session-drag',
      lobbyCode: 'ABCD12',
      countdown: 3,
    }),
  ).toBe('/race/drag/session-drag');
});
```

**Race page control assertion pattern** (`apps/web/src/pages/SprintCircuitPage.test.tsx` lines 143-157):
```typescript
test('renders the fullscreen race shell with HUD and controls', () => {
  renderRoute('/race/live/session-1');

  expect(screen.getByLabelText('Fullscreen race session')).toBeInTheDocument();
  expect(screen.getByText(/reach the finish/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/steer/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'GO' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'BRAKE' })).toBeInTheDocument();
});
```

**Apply to Phase 06:** Add route resolver assertions for Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track. Keep fullscreen no-chrome checks for each new route or for the single mode-aware route.

### Results Tests

**Analog:** `apps/web/src/pages/ResultsPage.test.tsx`

**Finished payload fixture pattern** (lines 59-87):
```typescript
function createDragFinishedPayload(): SessionFinishedPayload {
  return {
    sessionId: 'session-drag',
    lobbyCode: 'ABCD12',
    game: 'race',
    variant: PARTY_GAME_VARIANTS.dragSprint,
    results: {
      rankings: [
        {
          playerId: 'socket-host',
          rank: 1,
          label: '13.420s',
          value: 13_420,
        },
      ],
      summary: {
        finishTimeMs: 13_420,
        perfectShifts: 2,
        goodShifts: 1,
        earlyShifts: 1,
        lateShifts: 0,
        totalShifts: 4,
      },
    },
  };
}
```

**Summary rendering assertion pattern** (lines 140-156):
```typescript
test('renders drag shift summary from finished payload', () => {
  renderRoute('/results/session-drag', createDragFinishedPayload());

  expect(screen.getByRole('heading', { name: 'Shift Summary' })).toBeInTheDocument();
  expect(screen.getByText('Finish Time')).toBeInTheDocument();
  expect(screen.getAllByText('13.420s').length).toBeGreaterThan(0);
  expect(screen.getByText('PERFECT')).toBeInTheDocument();
  expect(screen.getByText('Total Shifts')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /rigioca/i })).toBeInTheDocument();
});
```

**Corrupt storage degradation pattern** (lines 164-171):
```typescript
test('ignores corrupt stored results payloads', () => {
  window.sessionStorage.setItem('blitz-results:session-bad', '{not valid json');

  renderRoute('/results/session-bad');

  expect(screen.getByRole('heading', { name: /nessun dato/i })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Shift Summary' })).not.toBeInTheDocument();
});
```

**Apply to Phase 06:** Add fixtures for Straight Obstacle, Circle Track, Figure-Eight Track, and missing/partial summary fields. Keep post-game action assertions unchanged.

## Shared Patterns

### Canonical Shared Variant Identity

**Source:** `packages/shared/src/lobby.ts` lines 20-24, 84-107
**Apply to:** `packages/shared/src/lobby.ts`, `apps/server/src/games/registry.ts`, `apps/web/src/pages/LobbyPage.tsx`, `apps/web/src/lib/sessionRoutes.ts`, `apps/web/src/pages/ResultsPage.tsx`

All final race ids should flow from shared constants. Avoid new string literals like `'circle-track'` in web/server branches when an exported constant can be used.

### Authoritative Server Start Flow

**Source:** `apps/server/src/socket/register.ts` lines 116-150
**Apply to:** Server registry/startability changes and tests

The server start path already validates shared startability and registry resolution before emitting `server:session-started`. Phase 06 should extend the shared/registry data instead of adding web-only start rules.

### Fullscreen Race Route Boundary

**Source:** `apps/web/src/app/router.tsx` lines 49-118 and `apps/web/src/app/router.test.tsx` lines 152-169
**Apply to:** All race route changes

Race gameplay routes belong outside `AppLayout`. Tests should assert absence of `.topbar`, `.viewport`, `.panel`, and `.card`.

### Result Storage and Graceful Degradation

**Source:** `apps/web/src/pages/DragGearRacePage.tsx` lines 129-140, `apps/web/src/pages/ResultsPage.tsx` lines 18-41 and 59-70
**Apply to:** All fullscreen race pages and `ResultsPage`

Live pages store `SessionFinishedPayload` in `sessionStorage` under `blitz-results:{sessionId}`. `ResultsPage` catches bad JSON and renders rankings even when mode summaries are missing.

### Post-Game Actions

**Source:** `apps/web/src/lib/usePostGameActions.ts` lines 45-124 and `apps/server/src/socket/register.ts` lines 159-181
**Apply to:** `ResultsPage` and regression tests

Do not change rematch, return-to-lobby, or change-game semantics while adding result summaries. Host-only control is enforced both in the hook and server gateway.

### UI Copy and Mobile Constraints

**Source:** `.planning/phases/06-lobby-results-and-regression-polish/06-UI-SPEC.md`
**Apply to:** `LobbyPage`, results summary helpers, router/fullscreen verification

Lobby race options must show exactly label, objective, control, and skill focus for Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track. New race catalog controls need at least 44px tap targets, no horizontal scrolling on phones, and no old primary labels `Sprint Circuit` or `Drag Sprint`.

## No Analog Found

All inferred Phase 06 files have exact or role-match analogs in the codebase.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| n/a | n/a | n/a | n/a |

## Metadata

**Analog search scope:** `packages/shared/src`, `apps/server/src`, `apps/web/src`, root `tests`
**Files scanned:** 124 from `apps`, `packages`, and `tests` including generated output; source analogs were selected only from `apps/**/src`, `packages/shared/src`, and root `tests`.
**Project instructions loaded:** `AGENTS.md`; no root `CLAUDE.md`; no project-local `.agents/skills` or `.claude/skills` directories.
**Pattern extraction date:** 2026-04-26
