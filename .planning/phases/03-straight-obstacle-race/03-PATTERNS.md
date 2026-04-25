# Phase 3: Straight Obstacle Race - Pattern Map

**Mapped:** 2026-04-25T18:20:45Z
**Files analyzed:** 23
**Analogs found:** 23 / 23

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/shared/src/game.ts` | model | transform | `packages/shared/src/game.ts` | exact |
| `packages/shared/src/contracts.ts` | contract | request-response | `packages/shared/src/contracts.ts` | exact |
| `packages/shared/src/lobby.ts` | config | request-response | `packages/shared/src/lobby.ts` | exact |
| `packages/shared/src/index.ts` | config | transform | `packages/shared/src/index.ts` | exact |
| `packages/shared/src/contracts.test.ts` | test | batch | `packages/shared/src/contracts.test.ts` | exact |
| `apps/server/src/games/race/straightObstacleRules.ts` | utility | transform | `apps/server/src/games/race/sprintCircuit.ts` + `dragSprint.ts` | role-match |
| `apps/server/src/games/race/straightObstacleRules.test.ts` | test | batch | `apps/server/src/games/race/dragSprint.test.ts` | role-match |
| `apps/server/src/games/race/straightObstacle.ts` | service | event-driven | `apps/server/src/games/race/sprintCircuit.ts` | exact |
| `apps/server/src/games/race/straightObstacle.test.ts` | test | batch | `apps/server/src/games/race/dragSprint.test.ts` | role-match |
| `apps/server/src/games/registry.ts` | config | request-response | `apps/server/src/games/registry.ts` | exact |
| `apps/server/src/games/registry.test.ts` | test | batch | `apps/server/src/games/registry.test.ts` | exact |
| `apps/web/src/pages/StraightObstacleRacePage.tsx` | component | event-driven | `apps/web/src/pages/SprintCircuitPage.tsx` + `LightsSessionPage.tsx` | role-match |
| `apps/web/src/pages/StraightObstacleRacePage.test.tsx` | test | batch | `apps/web/src/pages/SprintCircuitPage.test.tsx` | exact |
| `apps/web/src/app/router.tsx` | route | request-response | `apps/web/src/app/router.tsx` | exact |
| `apps/web/src/lib/sessionRoutes.ts` | utility | request-response | `apps/web/src/lib/sessionRoutes.ts` | exact |
| `apps/web/src/lib/useGameSessionSocket.ts` | hook | event-driven | `apps/web/src/lib/useGameSessionSocket.ts` | exact |
| `apps/web/src/components/game/DodgeRoadView.tsx` | component | streaming | `apps/web/src/pages/SprintCircuitPage.tsx` + `RetroRaceView.tsx` | role-match |
| `apps/web/src/components/game/DodgeHud.tsx` | component | transform | `apps/web/src/components/RetroHud.tsx` | role-match |
| `apps/web/src/components/game/DodgeSteeringPad.tsx` | component | event-driven | `apps/web/src/components/RetroRaceView.tsx` + `useLiveRaceSocket.ts` | role-match |
| `apps/web/src/components/game/DodgeResultsSummary.tsx` | component | transform | `apps/web/src/pages/ResultsPage.tsx` | role-match |
| `apps/web/src/pages/ResultsPage.tsx` | component | request-response | `apps/web/src/pages/ResultsPage.tsx` | exact |
| `apps/web/src/pages/ResultsPage.test.tsx` | test | batch | `apps/web/src/pages/ResultsPage.test.tsx` | exact |
| `apps/web/src/styles.css` | config | transform | `apps/web/src/styles.css` | exact |

## Pattern Assignments

### `packages/shared/src/game.ts` (model, transform)

**Analog:** `packages/shared/src/game.ts`

**Imports pattern:** no imports; use local `as const` status maps and exported interfaces.

**Type/export pattern** (lines 1-43):
```typescript
export const RACE_STATUS = {
  countdown: 'countdown',
  racing: 'racing',
  finished: 'finished',
} as const;

export type RaceStatus = (typeof RACE_STATUS)[keyof typeof RACE_STATUS];

export interface RaceSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  status: RaceStatus;
  tick: number;
  startedAt: number | null;
  countdown: number | null;
  playersState: RacePlayerState[];
  botsState: RaceBotState[];
}
```

**Mode-specific snapshot pattern** (lines 45-104):
```typescript
export type DragSprintMode = 'finish-line' | 'best-of-3' | 'survival';

export interface DragSprintSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  mode: DragSprintMode;
  status: RaceStatus;
  tick: number;
  startedAt: number | null;
  countdown: number | null;
  distanceTarget: number | null;
  playersState: DragSprintPlayerState[];
  obstacles: DragSprintObstacleState[];
  pickups: DragSprintPickupState[];
}
```

**Apply to Phase 3:** Add `StraightObstacleInput`, `StraightObstaclePlayerState`, `StraightObstacleState`, `StraightObstacleSnapshot`, `StraightObstacleResultDetails`, and obstacle/warning status types here. Keep inputs intent-only: `steerX`, `sequence` or `tick`, and `clientTimeMs`; do not include speed, distance, hit count, or finish claims in input.

---

### `packages/shared/src/contracts.ts` (contract, request-response)

**Analog:** `packages/shared/src/contracts.ts`

**Imports pattern** (lines 1-7):
```typescript
import type { PlayerInput, RaceSnapshot } from './game.js';
import type {
  LobbySettings,
  LobbyState,
  PartyGame,
  PartyGameVariant,
} from './lobby.js';
```

**Active generic session event family** (lines 9-35, 163-188):
```typescript
export const SOCKET_EVENTS = {
  client: {
    startSession: 'client:start-session',
    gameInput: 'client:game-input',
  },
  server: {
    sessionStarted: 'server:session-started',
    sessionState: 'server:session-state',
    sessionFinished: 'server:session-finished',
  },
} as const;

export type ClientToServerEvents = {
  [SOCKET_EVENTS.client.gameInput]: (payload: GameInputPayload) => void;
};

export type ServerToClientEvents = {
  [SOCKET_EVENTS.server.sessionState]: (payload: GameSessionEnvelope) => void;
  [SOCKET_EVENTS.server.sessionFinished]: (payload: SessionFinishedPayload) => void;
};
```

**Envelope/results pattern** (lines 94-115, 135-141):
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

export interface GameSessionEnvelope<TState = GameInputPayload | null> {
  sessionId: string;
  lobbyCode: string;
  game: PartyGame;
  variant: PartyGameVariant;
  status: GameSessionStatus;
  countdown: number | null;
  state: TState;
  results: GameResults | null;
}
```

**Apply to Phase 3:** Replace broad usage at new call sites with typed straight-obstacle payloads where possible. If result rows need per-player `obstacleHits`, extend `GameResultEntry` with optional typed metadata or details rather than parsing `label`.

---

### `packages/shared/src/lobby.ts` (config, request-response)

**Analog:** `packages/shared/src/lobby.ts`

**Variant constant pattern** (lines 20-34):
```typescript
export const PARTY_GAME_VARIANTS = {
  sprintCircuit: 'sprint-circuit',
  trafficSurvival: 'traffic-survival',
  dragSprint: 'drag-sprint',
} as const;

export type PartyGameVariant =
  | (typeof PARTY_GAME_VARIANTS)[keyof typeof PARTY_GAME_VARIANTS]
  | null;
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
    return playerCount !== null && playerCount <= 3;
  }

  return false;
}
```

**Apply to Phase 3:** Add `straightObstacle: 'straight-obstacle'` to `PARTY_GAME_VARIANTS` and return `true` for that race variant. Keep `traffic-survival` untouched unless the planner explicitly chooses to reuse it.

---

### `packages/shared/src/index.ts` (config, transform)

**Analog:** `packages/shared/src/index.ts`

**Export barrel pattern** (lines 1-5):
```typescript
export const sharedBootstrap = 'blitz-shared-bootstrap';

export * from './contracts.js';
export * from './game.js';
export * from './lobby.js';
```

**Apply to Phase 3:** No new export statement is needed if straight-obstacle types are added to existing shared files. If a new shared file is created, export it here with the same `.js` extension style.

---

### `packages/shared/src/contracts.test.ts` (test, batch)

**Analog:** `packages/shared/src/contracts.test.ts`

**Imports pattern** (lines 1-15):
```typescript
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  isLobbySelectionStartable,
  LOBBY_RACE_MODES,
  LOBBY_STATUS,
  MAX_LOBBY_PLAYERS,
  RACE_STATUS,
  SOCKET_EVENTS,
} from './index.js';
```

**Shape coverage pattern** (lines 195-329):
```typescript
test('exports the expected drag sprint snapshot shape', () => {
  const playerState: DragSprintPlayerState = {
    playerId: 'player-1',
    nickname: 'Host',
    lane: centerLane,
    distance: 420,
    speed: 18,
    status: racingStatus,
    activePowerUp: nitro,
  };

  const snapshot: DragSprintSnapshot = {
    sessionId: 'session-drag',
    lobbyCode: 'ABCD12',
    trackId: 'drag-strip',
    mode,
    status: RACE_STATUS.racing,
    tick: 12,
    countdown: 0,
    startedAt: 1_713_980_000_000,
    distanceTarget: 1200,
    playersState: [playerState],
    obstacles: [obstacleState],
    pickups: [pickupState],
  };

  assert.equal(snapshot.mode, 'finish-line');
  assert.equal(snapshot.playersState[0]?.lane, centerLane);
});
```

**Socket contract pattern** (lines 398-542):
```typescript
const clientEvents: ClientToServerEvents = {
  [SOCKET_EVENTS.client.gameInput]: (payload) => {
    assert.equal(payload.reactionAtMs, 180);
  },
};

clientEvents[SOCKET_EVENTS.client.gameInput]({ reactionAtMs: 180 });
```

**Apply to Phase 3:** Add tests for straight-obstacle variant startability, typed input shape, snapshot fields (`activeObstacles`, warning, hit count, slowdown), result metadata, and the generic `client:game-input` / `server:session-state` path.

---

### `apps/server/src/games/race/straightObstacleRules.ts` (utility, transform)

**Analogs:** `apps/server/src/games/race/sprintCircuit.ts`, `apps/server/src/games/race/dragSprint.ts`

**Pure helper pattern** from `sprintCircuit.ts` (lines 83-113):
```typescript
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readSteer(value: unknown): SteeringInput {
  if (value === -1 || value === 0 || value === 1) {
    return value;
  }

  return 0;
}

function readTick(value: unknown, currentTick: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return currentTick + 1;
  }

  return Math.max(currentTick + 1, Math.round(value));
}
```

**Ranking pattern** from `dragSprint.ts` (lines 136-166):
```typescript
function buildFinishLineRankings(
  playersState: DragSprintPlayerState[],
  finishTimesMs: Record<string, number | null>,
): GameResultEntry[] {
  return [...playersState]
    .sort((left, right) => {
      const leftFinish = finishTimesMs[left.playerId];
      const rightFinish = finishTimesMs[right.playerId];

      if (leftFinish !== null && rightFinish !== null) {
        return leftFinish - rightFinish;
      }

      return right.distance - left.distance;
    })
    .map((player, index) => ({
      playerId: player.playerId,
      rank: index + 1,
      label: formatFinishTime(finishTimesMs[player.playerId]) ?? `${Math.round(player.distance)}m`,
      value: finishTimesMs[player.playerId] ?? Math.round(player.distance),
    }));
}
```

**Apply to Phase 3:** Move continuous steering, wave generation, obstacle bounds, collision detection, slowdown recovery, finish, and result ranking into exported deterministic helpers. Avoid importing drag pickup/powerup types. Use normalized horizontal spans, not `DragSprintLane`.

---

### `apps/server/src/games/race/straightObstacleRules.test.ts` (test, batch)

**Analog:** `apps/server/src/games/race/dragSprint.test.ts`

**Node test setup** (lines 1-14):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_RACE_MODES,
  LOBBY_STATUS,
  PLAYER_CONNECTION_STATE,
  RACE_STATUS,
  type DragSprintSnapshot,
  type LobbyState,
  type SessionFinishedPayload,
} from '@blitz/shared';

import { createDragSprintRuntime } from './dragSprint.js';
```

**Deterministic assertions pattern** (lines 55-149):
```typescript
test('advances players on a fixed three-lane drag strip with deterministic finish-line rules', () => {
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    distanceTarget: 120,
    now: () => 2_000,
  });

  const started = runtime.start();
  const first = runtime.applyInput('socket-host', {
    tick: 1,
    steer: 1,
    accelerate: true,
    brake: false,
  });

  assert.ok(first);
  const startedSnapshot = started.state as DragSprintSnapshot;
  const firstSnapshot = first.state as DragSprintSnapshot;

  assert.equal(startedSnapshot.trackId, 'drag-strip');
  assert.ok(
    (firstSnapshot.playersState[0]?.speed ?? 0) > (startedSnapshot.playersState[0]?.speed ?? 0),
  );
});
```

**Apply to Phase 3:** Prefer pure helper tests over runtime-only tests: clamp `steerX`, move horizontal position smoothly, generate seeded waves deterministically, assert warning preview distance, collide by horizontal bounds, apply 1-1.5s slowdown, recover, and rank by finish time plus hit count.

---

### `apps/server/src/games/race/straightObstacle.ts` (service, event-driven)

**Analog:** `apps/server/src/games/race/sprintCircuit.ts`

**Runtime imports and options pattern** (lines 1-47):
```typescript
import {
  GAME_SESSION_STATUS,
  RACE_STATUS,
  type GameInputPayload,
  type GameResultEntry,
  type GameSessionEnvelope,
  type LobbyState,
  type RaceSnapshot,
  type SessionFinishedPayload,
} from '@blitz/shared';

import type { GameRuntimeInstance, RuntimeCallbacks } from '../runtime.js';

type TimerHandle = ReturnType<typeof setTimeout> | null;

export interface SprintCircuitRuntimeOptions extends RuntimeCallbacks<RaceSnapshot> {
  countdownMs?: number;
  laps?: number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}
```

**Envelope initialization pattern** (lines 258-277):
```typescript
let state: GameSessionEnvelope<RaceSnapshot> = {
  sessionId,
  lobbyCode: lobby.code,
  game: 'race',
  variant: 'sprint-circuit',
  status: GAME_SESSION_STATUS.countdown,
  countdown: Math.ceil(countdownMs / 1000),
  results: null,
  state: {
    sessionId,
    lobbyCode: lobby.code,
    trackId: 'sprint-circuit',
    status: RACE_STATUS.countdown,
    tick: 0,
    startedAt: null,
    countdown: Math.ceil(countdownMs / 1000),
    playersState: lobby.players.map((_, index) => createPlayerState(lobby, index, laps)),
    botsState: [],
  },
};
```

**Lifecycle/callback pattern** (lines 288-334, 308-318):
```typescript
const emitState = () => {
  options.onState?.(state);
  return state;
};

const emitFinished = () => {
  const payload: SessionFinishedPayload = {
    sessionId,
    lobbyCode: lobby.code,
    game: 'race',
    variant: 'sprint-circuit',
    results: state.results!,
  };

  options.onFinished?.(payload);
};
```

**Input application pattern** (lines 336-470):
```typescript
applyInput(playerId, input) {
  if (state.state.status !== RACE_STATUS.racing) {
    return state;
  }

  const playerIndex = state.state.playersState.findIndex((player) => player.playerId === playerId);

  if (playerIndex < 0) {
    return state;
  }

  const steer = readSteer(input.steer);
  const currentPlayer = state.state.playersState[playerIndex]!;
  const nextPlayers = state.state.playersState.map((player) => ({ ...player }));

  state = {
    ...state,
    status: allFinished ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
    state: {
      ...state.state,
      tick: readTick(input.tick, state.state.tick),
      status: allFinished ? RACE_STATUS.finished : RACE_STATUS.racing,
      playersState: nextPlayers,
    },
    results: allFinished ? { rankings: buildRankings(nextPlayers, finishTimesMs) } : null,
  };

  emitState();

  if (allFinished) {
    emitFinished();
  }

  return state;
}
```

**Apply to Phase 3:** Keep runtime small: `applyInput()` should validate/store latest steering intent; a runtime tick should call `advanceStraightObstacleRace()` so neutral input does not stall movement or recovery. Use injectable `now`, `schedule`, and `cancel` for tests.

---

### `apps/server/src/games/race/straightObstacle.test.ts` (test, batch)

**Analog:** `apps/server/src/games/race/dragSprint.test.ts`

**Lobby fixture pattern** (lines 16-53):
```typescript
function createLobby(overrides: Partial<LobbyState['settings']> = {}): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'drag-sprint',
    status: LOBBY_STATUS.waiting,
    settings: {
      maxPlayers: 8,
      raceMode: LOBBY_RACE_MODES.finishLine,
      ...overrides,
    },
    players: [
      {
        id: 'socket-host',
        nickname: 'Blitz',
        carId: 'f812',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
    ],
  };
}
```

**Finished payload assertion pattern** (lines 151-201):
```typescript
const finishedPayloads: SessionFinishedPayload[] = [];
let nowMs = 5_000;
const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
  countdownMs: 0,
  distanceTarget: 45,
  now: () => nowMs,
  onFinished(payload) {
    finishedPayloads.push(payload);
  },
});

runtime.start();
let state = runtime.applyInput('socket-host', {
  tick: 1,
  steer: 0,
  accelerate: true,
  brake: false,
});

assert.equal(state.status, 'finished');
assert.equal(finishedPayloads.length, 1);
assert.deepEqual(finishedPayloads[0]?.results.rankings[0], {
  playerId: 'socket-host',
  rank: 1,
  label: '0.5s',
  value: 500,
});
```

**Apply to Phase 3:** Assert countdown/start, tick-driven neutral progression, latest steering intent storage, stale/non-finite input ignored or clamped, `onState` snapshots include warning/hits/slowdown, `onFinished` includes finish time and obstacle hits, and `removePlayer()` cleans per-player maps.

---

### `apps/server/src/games/registry.ts` (config, request-response)

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

**Registry entry pattern** (lines 55-86):
```typescript
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
```

**Resolver pattern** (lines 89-103):
```typescript
export function createGameRuntimeRegistry(
  entries: GameRegistryEntry[] = DEFAULT_GAME_REGISTRY,
): GameRuntimeRegistry {
  return {
    list() {
      return [...entries];
    },
    resolve(game, variant) {
      return entries.find((entry) => entry.game === game && entry.variant === variant) ?? null;
    },
  };
}
```

**Apply to Phase 3:** Import `createStraightObstacleRuntime`, add key `race:straight-obstacle`, variant `PARTY_GAME_VARIANTS.straightObstacle` or literal `'straight-obstacle'` consistent with `lobby.ts`, and forward callbacks exactly like the existing race runtimes.

---

### `apps/server/src/games/registry.test.ts` (test, batch)

**Analog:** `apps/server/src/games/registry.test.ts`

**Registry/startability assertion pattern** (lines 1-14):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import { LOBBY_RACE_MODES, isLobbySelectionStartable, PARTY_GAMES, PARTY_GAME_VARIANTS } from '@blitz/shared';

import { createGameRuntimeRegistry } from './registry.js';

test('game registry exposes the current playable variants while shared startability stays mode-aware', () => {
  const registry = createGameRuntimeRegistry();
  assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.sprintCircuit) !== null, true);
  assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.dragSprint) !== null, true);
});
```

**Apply to Phase 3:** Add `registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.straightObstacle) !== null` and `isLobbySelectionStartable(...straightObstacle...) === true`.

---

### `apps/web/src/pages/StraightObstacleRacePage.tsx` (component, event-driven)

**Analogs:** `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/pages/LightsSessionPage.tsx`

**Page imports/session pattern** from `SprintCircuitPage.tsx` (lines 1-17):
```tsx
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { RACE_STATUS, type SessionFinishedPayload, type SessionStartedPayload } from '@blitz/shared';

import { useLiveRaceSocket } from '../lib/useLiveRaceSocket';

export function SprintCircuitPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialState = (location.state as SessionStartedPayload | null) ?? null;
  const [countdown, setCountdown] = useState<number | null>(initialState?.countdown ?? null);
  const { snapshot, finished, steer, braking, setSteer, setBrake } = useLiveRaceSocket(sessionId);
```

**Finished navigation pattern** from `SprintCircuitPage.tsx` (lines 39-49):
```tsx
useEffect(() => {
  if (!finished) {
    return;
  }

  window.sessionStorage.setItem(`blitz-results:${finished.sessionId}`, JSON.stringify(finished));
  navigate(`/results/${finished.sessionId}`, {
    replace: true,
    state: finished,
  });
}, [finished, navigate]);
```

**Generic hook usage pattern** from `LightsSessionPage.tsx` (lines 52-60):
```tsx
export function LightsSessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialPayload = (location.state as SessionStartedPayload | null) ?? null;
  const { isConnected, socketId, session, finished, submitInput } = useGameSessionSocket(sessionId);
  const state = (session?.state as LightsSessionView | null) ?? null;
```

**Apply to Phase 3:** Use `useGameSessionSocket` or a dodge-specific wrapper around it, cast `session.state` to `StraightObstacleSnapshot`, store results before navigating, and render Phase 1 fullscreen shell if present. Do not copy the `.panel live-panel` layout from `SprintCircuitPage.tsx`.

---

### `apps/web/src/pages/StraightObstacleRacePage.test.tsx` (test, batch)

**Analog:** `apps/web/src/pages/SprintCircuitPage.test.tsx`

**Vitest page mock pattern** (lines 1-22):
```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { RACE_STATUS, type RaceSnapshot } from '@blitz/shared';

import { createAppRouter } from '../app/router';

const { mockUseLiveRaceSocket } = vi.hoisted(() => ({
  mockUseLiveRaceSocket: vi.fn(),
}));

vi.mock('../lib/useLiveRaceSocket', () => ({
  useLiveRaceSocket: mockUseLiveRaceSocket,
}));

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}
```

**Route assertion pattern** (lines 79-88):
```tsx
describe('SprintCircuitPage', () => {
  test('renders the sprint circuit canvas and entrants', () => {
    renderRoute('/race/live/session-1');

    expect(screen.getByRole('heading', { name: /sprint circuit/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/sprint circuit canvas/i)).toBeInTheDocument();
    expect(screen.getByText(/checkpoint 2/i)).toBeInTheDocument();
  });
});
```

**Apply to Phase 3:** Mock the dodge socket hook, render `/race/straight-obstacle/:sessionId` or chosen route, assert React text for `Dodge obstacles`, `Distance`, `Speed`, `Obstacle ahead`, `Hits`, `Slowdown`, steering control availability, and result navigation.

---

### `apps/web/src/app/router.tsx` (route, request-response)

**Analog:** `apps/web/src/app/router.tsx`

**Imports pattern** (lines 1-13):
```tsx
import { Link, NavLink, Outlet, createBrowserRouter, createMemoryRouter } from 'react-router-dom';

import { ResultsPage } from '../pages/ResultsPage';
import { SprintCircuitPage } from '../pages/SprintCircuitPage';
```

**Route entry pattern** (lines 103-109):
```tsx
{
  path: '/race/live/:sessionId',
  element: <SprintCircuitPage />,
},
{
  path: '/results/:sessionId',
  element: <ResultsPage />,
},
```

**Apply to Phase 3:** Import `StraightObstacleRacePage` and add a route for the straight obstacle variant. If the route must be fullscreen without app chrome, place it outside the `AppLayout` branch or use Phase 1 shell behavior that hides chrome.

---

### `apps/web/src/lib/sessionRoutes.ts` (utility, request-response)

**Analog:** `apps/web/src/lib/sessionRoutes.ts`

**Resolver pattern** (lines 1-13):
```typescript
import type { SessionStartedPayload } from '@blitz/shared';

export function resolveSessionRoute(payload: SessionStartedPayload): string {
  if (payload.game === 'lights') {
    return `/session/lights/${payload.sessionId}`;
  }

  if (payload.game === 'penalty') {
    return `/session/penalty/${payload.sessionId}`;
  }

  return `/race/live/${payload.sessionId}`;
}
```

**Apply to Phase 3:** Branch `payload.game === 'race' && payload.variant === 'straight-obstacle'` before the fallback and return the new route. Keep existing race fallback for sprint/drag until catalog cleanup.

---

### `apps/web/src/lib/useGameSessionSocket.ts` (hook, event-driven)

**Analog:** `apps/web/src/lib/useGameSessionSocket.ts`

**Socket subscription pattern** (lines 20-69):
```typescript
export function useGameSessionSocket(sessionId: string): GameSessionSocketState {
  const socket = useMemo(() => getBlitzSocket(), []);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [session, setSession] = useState<GameSessionEnvelope | null>(null);
  const [finished, setFinished] = useState<SessionFinishedPayload | null>(null);

  useEffect(() => {
    if (!socket.connected && !socket.active) {
      socket.connect();
    }

    const handleSessionState = (payload: GameSessionEnvelope) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setSession(payload);
    };

    socket.on(SOCKET_EVENTS.server.sessionState, handleSessionState);

    return () => {
      socket.off(SOCKET_EVENTS.server.sessionState, handleSessionState);
    };
  }, [sessionId, socket]);
```

**Submit input pattern** (lines 71-79):
```typescript
return {
  isConnected,
  socketId,
  session,
  finished,
  submitInput(payload) {
    socket.emit(SOCKET_EVENTS.client.gameInput, payload);
  },
};
```

**Apply to Phase 3:** Prefer reusing this hook for straight-obstacle input. If adding a wrapper, keep filtering by `sessionId`, submit only typed intent payloads, and reset steering to neutral on unmount/visibility/pointer cancel in the control layer.

---

### `apps/web/src/components/game/DodgeRoadView.tsx` (component, streaming)

**Analogs:** `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/components/RetroRaceView.tsx`

**Canvas draw guard pattern** from `SprintCircuitPage.tsx` (lines 51-74):
```tsx
useEffect(() => {
  const canvas = canvasRef.current;

  if (!canvas || !snapshot) {
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) {
    return;
  }

  let context: CanvasRenderingContext2D | null = null;

  try {
    context = canvas.getContext('2d');
  } catch {
    return;
  }

  if (!context) {
    return;
  }

  drawSprintCircuitTrack(context);
}, [snapshot]);
```

**Road rendering pattern** from `RetroRaceView.tsx` (lines 38-67, 97-110):
```tsx
const width = canvas.width;
const height = canvas.height;
const horizon = Math.floor(height * 0.28);

context.clearRect(0, 0, width, height);
context.fillStyle = '#07070f';
context.fillRect(0, 0, width, horizon);

for (let i = 0; i < 48; i += 1) {
  const progress = i / 48;
  const y = horizon + progress * (height - horizon);
  const roadWidth = 90 + progress * 170;
  const centerX = width / 2;
  context.fillRect(centerX - roadWidth / 2, y, roadWidth, height / 48 + 2);
}

<canvas
  ref={canvasRef}
  className="race-canvas-native"
  width={420}
  height={560}
  aria-label="Retro race canvas"
/>
```

**Apply to Phase 3:** Draw a straight 3-guide-lane road, player car at lower 22-28%, active obstacles aligned to server bounds, warning highlights, and collision/slowdown flash. Keep all critical state mirrored in `DodgeHud` text.

---

### `apps/web/src/components/game/DodgeHud.tsx` (component, transform)

**Analog:** `apps/web/src/components/RetroHud.tsx`

**HUD component pattern** (lines 17-41):
```tsx
export function RetroHud({ label, state }: RetroHudProps) {
  return (
    <div className="retro-hud">
      <div className="retro-hud-box">
        <span className="retro-hud-label">SESSIONE</span>
        <strong>{label}</strong>
      </div>
      <div className="retro-hud-box">
        <span className="retro-hud-label">KM/H</span>
        <strong>{Math.round(state.player.speed * 58)}</strong>
      </div>
      <div className="retro-hud-box">
        <span className="retro-hud-label">RADIO BOX</span>
        <strong>{state.message}</strong>
      </div>
    </div>
  );
}
```

**Apply to Phase 3:** Use the same small pure component shape, but render required copy exactly: `Dodge obstacles`, `Distance`, `Speed`, `Obstacle ahead`/`Road clear`, `Hits`, `Slowdown`/`Hit - recovering`. Add an `aria-live="polite"` region for warning, slowdown, countdown, and finish transitions.

---

### `apps/web/src/components/game/DodgeSteeringPad.tsx` (component, event-driven)

**Analogs:** `apps/web/src/components/RetroRaceView.tsx`, `apps/web/src/lib/useLiveRaceSocket.ts`

**Press-and-reset control pattern** from `RetroRaceView.tsx` (lines 112-151):
```tsx
<div className="race-controls">
  <button
    className="btn"
    onMouseDown={() => setSteer(-1)}
    onMouseUp={() => setSteer(0)}
    onMouseLeave={() => setSteer(0)}
    onTouchStart={(event) => {
      event.preventDefault();
      setSteer(-1);
    }}
    onTouchEnd={() => setSteer(0)}
  >
    ◄ SX
  </button>
</div>
```

**Keyboard fallback pattern** from `useLiveRaceSocket.ts` (lines 61-81):
```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') setSteer(-1);
    if (event.key === 'ArrowRight') setSteer(1);
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') setSteer((current) => (current === -1 ? 0 : current));
    if (event.key === 'ArrowRight') setSteer((current) => (current === 1 ? 0 : current));
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);
```

**Apply to Phase 3:** Upgrade from button-only to pointer events with pointer capture and normalized `steerX` from `-1` to `1`. Reset to `0` on release, pointer cancel, blur, visibility change, route unmount, and lost capture. Use `touch-action: none` and fixed dimensions in CSS.

---

### `apps/web/src/components/game/DodgeResultsSummary.tsx` (component, transform)

**Analog:** `apps/web/src/pages/ResultsPage.tsx`

**Ranking render pattern** (lines 103-114):
```tsx
{payload ? (
  <ol className="results-list">
    {payload.results.rankings.map((entry) => (
      <li className="results-row" key={entry.playerId}>
        <span>#{entry.rank}</span>
        <strong>
          {roster?.players?.find((player) => player.id === entry.playerId)?.nickname ?? entry.playerId}
        </strong>
        <span>{entry.label ?? entry.value ?? 'ND'}</span>
      </li>
    ))}
  </ol>
) : null}
```

**Apply to Phase 3:** Render mode-specific labels `Finish time`, `Obstacle hits`, and `Best dodger`. Read typed result metadata/details when present; if missing, render `No obstacle summary received. Finish order is still recorded.`

---

### `apps/web/src/pages/ResultsPage.tsx` (component, request-response)

**Analog:** `apps/web/src/pages/ResultsPage.tsx`

**Payload normalization/storage pattern** (lines 17-40, 62-73):
```tsx
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

**Post-game navigation pattern** (lines 75-92):
```tsx
useEffect(() => {
  if (!postGameUpdate?.lobby.code) {
    return;
  }

  navigate(`/lobby/${postGameUpdate.lobby.code}`, { replace: true });
}, [navigate, postGameUpdate]);

useEffect(() => {
  if (!sessionStarted) {
    return;
  }

  navigate(resolveSessionRoute(sessionStarted), {
    replace: true,
    state: sessionStarted,
  });
}, [navigate, sessionStarted]);
```

**Apply to Phase 3:** Preserve existing shared rankings and post-game actions. Insert `DodgeResultsSummary` when `payload.game === 'race' && payload.variant === 'straight-obstacle'`; do not break legacy race payload normalization.

---

### `apps/web/src/pages/ResultsPage.test.tsx` (test, batch)

**Analog:** `apps/web/src/pages/ResultsPage.test.tsx`

**Hook mock and route render pattern** (lines 1-29):
```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { SessionFinishedPayload } from '@blitz/shared';

import { createAppRouter } from '../app/router';

const { mockUsePostGameActions } = vi.hoisted(() => ({
  mockUsePostGameActions: vi.fn(),
}));

vi.mock('../lib/usePostGameActions', () => ({
  usePostGameActions: mockUsePostGameActions,
}));

function renderRoute(initialEntry: string, state?: unknown) {
  const router = createAppRouter({
    initialEntries: [
      {
        pathname: initialEntry,
        state,
      },
    ],
  });

  return render(<RouterProvider router={router} />);
}
```

**Existing assertion pattern** (lines 76-86):
```tsx
test('renders shared rankings and host-only post-game actions', () => {
  renderRoute('/results/session-1', createFinishedPayload());

  expect(screen.getByRole('heading', { name: /risultati finali/i })).toBeInTheDocument();
  expect(screen.getByText(/socket-host/i)).toBeInTheDocument();
  expect(screen.getByText(/182 ms media/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /rigioca/i })).toBeInTheDocument();
});
```

**Apply to Phase 3:** Add a straight-obstacle `SessionFinishedPayload` fixture with obstacle result details and assert `Finish time`, `Obstacle hits`, `Best dodger`, and the empty summary fallback. Keep host/non-host post-game tests intact.

---

### `apps/web/src/styles.css` (config, transform)

**Analog:** `apps/web/src/styles.css`

**Token/palette pattern** (lines 1-17):
```css
:root {
  color-scheme: dark;
  --bg-1: #0a0a12;
  --bg-2: #161326;
  --panel: #0f0f1e;
  --panel-border: #2a2a3a;
  --text: #ddeeff;
  --muted: #66798f;
  --accent: #00aadd;
  --accent-2: #ff3333;
  --accent-3: #ffd700;
  --green: #33ff66;
  font-family: 'Press Start 2P', monospace;
}
```

**Canvas/control pattern** (lines 474-499):
```css
.race-screen {
  margin-top: 1.4rem;
}

.race-canvas-wrap {
  margin-top: 1rem;
  border: 4px solid #2a2a3a;
  box-shadow: 6px 6px 0 #000;
  overflow: hidden;
  background: #06060d;
}

.race-canvas-native {
  display: block;
  width: 100%;
  max-width: 100%;
  image-rendering: pixelated;
  background: #06060d;
}

.race-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1rem;
}
```

**Results row pattern** (lines 531-549):
```css
.results-list {
  display: grid;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.results-row {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) 110px 90px;
  gap: 0.8rem;
  align-items: center;
  padding: 0.95rem 1rem;
  border: 3px solid #273448;
  background: #111827;
  box-shadow: 4px 4px 0 #000;
  font-size: 0.58rem;
}
```

**Apply to Phase 3:** Add fullscreen dodge classes using UI spec values: `100vw`, `100dvh`, safe-area padding, `overflow: hidden`, 16/12/20/28px type sizes, `#06060d`, `#0f0f1e`, `#ffd700`, and `#ff3333`. Do not reuse `.panel`, `.card`, `.viewport`, or current sub-12px HUD styles inside active gameplay.

## Shared Patterns

### Socket Session Flow

**Source:** `apps/server/src/socket/register.ts`
**Apply to:** `straightObstacle.ts`, `useGameSessionSocket.ts`, `StraightObstacleRacePage.tsx`, route/result flow.

**Broadcast callbacks** (lines 86-98):
```typescript
const gameManager = createGameManager({
  onState(payload: GameSessionEnvelope) {
    io.to(payload.lobbyCode).emit(SOCKET_EVENTS.server.sessionState, payload);
  },
  onFinished(payload: SessionFinishedPayload) {
    const resultsLobby = lobbyService.setStatus({
      code: payload.lobbyCode,
      status: LOBBY_STATUS.results,
    });

    emitLobbySnapshot(io, resultsLobby);
    io.to(payload.lobbyCode).emit(SOCKET_EVENTS.server.sessionFinished, payload);
  },
});
```

**Input forwarding** (lines 287-289):
```typescript
socket.on(SOCKET_EVENTS.client.gameInput, (payload) => {
  gameManager.applyInput(socket.id, payload);
});
```

### Host Gate / Access Control

**Source:** `apps/server/src/socket/register.ts`
**Apply to:** startability and registry integration only; no new auth in Phase 3.

**Start session guard** (lines 101-130):
```typescript
async function startSession(code: string, playerId: string) {
  const lobby = lobbyService.getLobby(code);

  if (!lobby) {
    throw new LobbyServiceError('lobby-not-found', 'Lobby not found');
  }

  if (lobby.hostId !== playerId) {
    throw new LobbyServiceError('player-not-host', 'Only the host can start the session');
  }

  if (
    !isLobbySelectionStartable(
      lobby.selectedGame,
      lobby.selectedVariant,
      lobby.settings.raceMode ?? null,
      lobby.players.length,
    )
  ) {
    throw new LobbyServiceError('game-not-supported', 'Selected game is not supported');
  }
}
```

### Runtime Interface

**Source:** `apps/server/src/games/runtime.ts`
**Apply to:** `straightObstacle.ts`

**Runtime contract** (lines 8-28):
```typescript
export interface RuntimeCallbacks<TState = unknown | null> {
  onState?: (payload: GameSessionEnvelope<TState>) => void;
  onFinished?: (payload: SessionFinishedPayload) => void;
}

export interface GameRuntimeInstance<TState = unknown | null> {
  sessionId: string;
  lobbyCode: string;
  start(): GameSessionEnvelope<TState>;
  applyInput(playerId: string, input: GameInputPayload): GameSessionEnvelope<TState> | null;
  removePlayer(playerId: string): void;
  dispose(): void;
}
```

### Web Session Result Persistence

**Source:** `apps/web/src/pages/SprintCircuitPage.tsx`
**Apply to:** `StraightObstacleRacePage.tsx`

**Finish navigation** (lines 39-49):
```tsx
useEffect(() => {
  if (!finished) {
    return;
  }

  window.sessionStorage.setItem(`blitz-results:${finished.sessionId}`, JSON.stringify(finished));
  navigate(`/results/${finished.sessionId}`, {
    replace: true,
    state: finished,
  });
}, [finished, navigate]);
```

### Test Style

**Source:** `apps/web/src/pages/SprintCircuitPage.test.tsx` and `apps/server/src/games/race/dragSprint.test.ts`
**Apply to:** all Phase 3 tests.

**Vitest route mock pattern** (web lines 10-22):
```tsx
const { mockUseLiveRaceSocket } = vi.hoisted(() => ({
  mockUseLiveRaceSocket: vi.fn(),
}));

vi.mock('../lib/useLiveRaceSocket', () => ({
  useLiveRaceSocket: mockUseLiveRaceSocket,
}));

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}
```

**Node runtime test pattern** (server lines 151-160):
```typescript
const finishedPayloads: SessionFinishedPayload[] = [];
let nowMs = 5_000;
const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
  countdownMs: 0,
  distanceTarget: 45,
  now: () => nowMs,
  onFinished(payload) {
    finishedPayloads.push(payload);
  },
});
```

## No Analog Found

No target file is completely without an analog. Two caveats matter for planning:

| File / Pattern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| `FullscreenGameShell` dependency | component | transform | Referenced by Phase 3 UI spec, but not present in `apps/web/src` yet. Phase 3 page should depend on Phase 1 output or add a Wave 0 gate. |
| Pointer-capture continuous steering pad | component | event-driven | Existing controls use mouse/touch button handlers; `DodgeSteeringPad` must upgrade to Pointer Events per UI spec. |
| Server fixed tick runtime | service | event-driven | Existing race runtimes advance mostly inside `applyInput()`. Phase 3 should store latest input and tick independently to avoid neutral-input stalls. |

## Metadata

**Analog search scope:** `packages/shared/src`, `apps/server/src`, `apps/web/src`, `.planning/**`
**Files scanned:** 47 source/test files plus 9 planning/context files
**Local project instructions:** `AGENTS.md` read; no `CLAUDE.md`; no local `.claude/skills` or `.agents/skills` found.
**Pattern extraction date:** 2026-04-25T18:20:45Z
