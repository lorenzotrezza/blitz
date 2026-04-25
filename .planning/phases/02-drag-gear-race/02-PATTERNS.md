# Phase 02: Drag Gear Race - Pattern Map

**Mapped:** 2026-04-25  
**Files analyzed:** 21 new/modified files  
**Analogs found:** 21 / 21

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/shared/src/game.ts` | model | request-response | `packages/shared/src/game.ts` | exact |
| `packages/shared/src/contracts.ts` | model/config | request-response | `packages/shared/src/contracts.ts` | exact |
| `packages/shared/src/contracts.test.ts` | test | request-response | `packages/shared/src/contracts.test.ts` | exact |
| `apps/server/src/games/race/dragGearRules.ts` | utility/service | transform | `apps/server/src/games/lights/runtime.ts` + `apps/web/src/game/useRetroRace.ts` | role-match |
| `apps/server/src/games/race/dragGearRules.test.ts` | test | transform | `apps/server/src/games/lights/runtime.test.ts` + `apps/server/src/games/race/dragSprint.test.ts` | role-match |
| `apps/server/src/games/race/dragSprint.ts` | service | event-driven/request-response | `apps/server/src/games/race/dragSprint.ts` | exact replacement target |
| `apps/server/src/games/race/dragSprint.test.ts` | test | event-driven/request-response | `apps/server/src/games/race/dragSprint.test.ts` | exact rewrite target |
| `apps/server/src/games/registry.ts` | config | request-response | `apps/server/src/games/registry.ts` | exact, likely verify-only |
| `apps/web/src/pages/DragGearRacePage.tsx` | component/route | event-driven/request-response | `apps/web/src/pages/LightsSessionPage.tsx` + `apps/web/src/pages/SprintCircuitPage.tsx` | role-match |
| `apps/web/src/pages/DragGearRacePage.test.tsx` | test | request-response | `apps/web/src/pages/LightsSessionPage.test.tsx` + `apps/web/src/pages/SprintCircuitPage.test.tsx` | role-match |
| `apps/web/src/components/game/DragGearHud.tsx` | component | request-response | `apps/web/src/components/RetroHud.tsx` | role-match |
| `apps/web/src/components/game/RpmShiftMeter.tsx` | component | transform/request-response | `apps/web/src/components/RetroHud.tsx` | partial |
| `apps/web/src/components/game/ShiftQualityBadge.tsx` | component | transform | `apps/web/src/components/RetroHud.tsx` | partial |
| `apps/web/src/components/game/StraightDragTrack.tsx` | component | canvas/request-response | `apps/web/src/components/RetroRaceView.tsx` + `apps/web/src/pages/SprintCircuitPage.tsx` | role-match |
| `apps/web/src/components/game/DragActionControls.tsx` | component | event-driven | `apps/web/src/components/RetroRaceView.tsx` + Phase 1 `ActionButton` plan | partial |
| `apps/web/src/components/game/DragResultsSummary.tsx` | component | request-response | `apps/web/src/pages/ResultsPage.tsx` | role-match |
| `apps/web/src/pages/ResultsPage.tsx` | component/route | request-response | `apps/web/src/pages/ResultsPage.tsx` | exact |
| `apps/web/src/pages/ResultsPage.test.tsx` | test | request-response | `apps/web/src/pages/ResultsPage.test.tsx` | exact |
| `apps/web/src/app/router.tsx` | route | request-response | `apps/web/src/app/router.tsx` | exact |
| `apps/web/src/lib/sessionRoutes.ts` | route utility | request-response | `apps/web/src/lib/sessionRoutes.ts` | exact |
| `apps/web/src/styles.css` | config/style | request-response | `apps/web/src/styles.css` | exact |

## Pattern Assignments

### `packages/shared/src/game.ts` (model, request-response)

**Analog:** `packages/shared/src/game.ts`

**Enum-like constants and derived type pattern** (lines 1-7):
```typescript
export const RACE_STATUS = {
  countdown: 'countdown',
  racing: 'racing',
  finished: 'finished',
} as const;

export type RaceStatus = (typeof RACE_STATUS)[keyof typeof RACE_STATUS];
```

**Snapshot shape pattern** (lines 88-104):
```typescript
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

**Apply:** Replace the old lane/obstacle/pickup drag model with drag-gear model types here: `DRAG_SHIFT_QUALITY`, `DragShiftQuality`, `DragShiftSummary`, `DragShiftWindow`, `DragGearInput`, `DragGearPlayerState`, and `DragGearSnapshot`. Keep `as const` objects plus derived union types. Do not add `playerId`, speed, finish time, or RPM to client input payloads.

---

### `packages/shared/src/contracts.ts` (model/config, request-response)

**Analog:** `packages/shared/src/contracts.ts`

**Import convention** (lines 1-7):
```typescript
import type { PlayerInput, RaceSnapshot } from './game.js';
import type {
  LobbySettings,
  LobbyState,
  PartyGame,
  PartyGameVariant,
} from './lobby.js';
```

**Active session event family** (lines 18-20, 27-30):
```typescript
startSession: 'client:start-session',
gameInput: 'client:game-input',
postGameAction: 'client:post-game-action',
sessionStarted: 'server:session-started',
sessionState: 'server:session-state',
sessionFinished: 'server:session-finished',
postGameUpdated: 'server:post-game-updated',
```

**Results summary transport** (lines 101-115):
```typescript
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

**Apply:** Change `GameInputPayload` from generic `Record<string, unknown>` to include the drag input union if Phase 1 has not already done so. Keep generic session events; do not build against stale `playerInput`, `raceSnapshot`, or `raceFinished`.

---

### `packages/shared/src/contracts.test.ts` (test, request-response)

**Analog:** `packages/shared/src/contracts.test.ts`

**Import/export assertion pattern** (lines 1-35):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLobbySelectionStartable,
  LOBBY_RACE_MODES,
  LOBBY_STATUS,
  MAX_LOBBY_PLAYERS,
  RACE_STATUS,
  SOCKET_EVENTS,
} from './index.js';
import type {
  ClientToServerEvents,
  DragSprintSnapshot,
  PlayerInput,
  RaceSnapshot,
  ServerToClientEvents,
} from './index.js';
```

**Socket contract invocation pattern** (lines 444-555):
```typescript
const serverEvents: ServerToClientEvents = {
  [SOCKET_EVENTS.server.sessionState]: (payload) => {
    assert.equal(payload.status, 'active');
    assert.equal(payload.game, 'lights');
  },
  [SOCKET_EVENTS.server.sessionFinished]: (payload) => {
    assert.equal(payload.results.rankings[0]?.playerId, host.id);
  },
};

clientEvents[SOCKET_EVENTS.client.gameInput]({ reactionAtMs: 180 });
serverEvents[SOCKET_EVENTS.server.sessionState]({
  sessionId: 'session-1',
  lobbyCode: lobby.code,
  game: 'lights',
  variant: null,
  status: 'active',
  countdown: 0,
  state: { round: 1 },
  results: null,
});
```

**Apply:** Add tests that a `DragGearInput` contains only intent fields (`kind`, throttle `pressed`, shift action, `sequence`, `clientTimeMs`), that drag snapshots expose RPM/gear/speed/distance/window/last shift fields, and that summary types include `perfect`, `good`, `early`, `late`, and total counts. Import from `./index.js`.

---

### `apps/server/src/games/race/dragGearRules.ts` (utility/service, transform)

**Analogs:** `apps/server/src/games/lights/runtime.ts`, `apps/web/src/game/useRetroRace.ts`, and helper blocks in `dragSprint.ts`

**Pure guard/helper pattern** from lights runtime (lines 58-74):
```typescript
function clampDelay(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value);
}

function readReactionAtMs(input: GameInputPayload): number | null {
  const value = input.reactionAtMs;

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value);
}
```

**Deterministic advance pattern** from `apps/web/src/game/useRetroRace.ts` (lines 65-112):
```typescript
export function advanceRaceState(
  state: RetroRaceState,
  input: RetroRaceInput,
): RetroRaceState {
  const accelRate = input.accelerate ? input.deltaMs * 0.0045 : 0;
  const brakeRate = input.brake ? input.deltaMs * 0.007 : 0;
  const dragRate = input.deltaMs * 0.0015;
  const maxSpeed = state.mode === 'bot' ? 4.9 : 4.6;
  const nextSpeed = clamp(state.player.speed + accelRate - brakeRate - dragRate, 0.9, maxSpeed);
  const nextDistance = state.player.distance + nextSpeed * input.deltaMs * 0.92;

  return {
    ...state,
    elapsedMs: state.elapsedMs + input.deltaMs,
    lapProgress,
    player: {
      ...state.player,
      speed: nextSpeed,
      distance: nextDistance,
    },
    bots,
  };
}
```

**Apply:** Create server-side pure helpers for `clamp`, `readDragGearInput`, `createInitialDragGearPlayer`, `scoreShift`, `advanceDragGearPlayer`, `buildDragGearRankings`, and `buildDragShiftSummary`. Keep these functions independent of timers, Socket.IO, React, and lobby mutation. Use server time/tick state, not `clientTimeMs`, for scoring.

---

### `apps/server/src/games/race/dragGearRules.test.ts` (test, transform)

**Analogs:** `apps/server/src/games/lights/runtime.test.ts`, `apps/server/src/games/race/dragSprint.test.ts`

**Minimal Node test pattern** (lines 1-6 in lights runtime test):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import { PLAYER_CONNECTION_STATE, type LobbyState } from '@blitz/shared';

import { createLightsRuntime } from './runtime.js';
```

**Runtime test fixture pattern** (lines 16-53 in drag sprint test):
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
      { id: 'socket-host', nickname: 'Blitz', carId: 'f812', ready: true, connectionState: PLAYER_CONNECTION_STATE.connected },
    ],
  };
}
```

**Apply:** Use `node:test` and `node:assert/strict`. Cover early/good/perfect/late scoring, throttle-held acceleration, throttle release/drag decay, invalid/repeated shifts ignored, max gear handling, finish detection, rankings, and shift summary aggregation. Tests should compare perfect/good runs against mediocre/late runs, not only assert labels.

---

### `apps/server/src/games/race/dragSprint.ts` (service, event-driven/request-response)

**Analog:** `apps/server/src/games/race/dragSprint.ts`

**Runtime import and option pattern** (lines 1-19, 33-40):
```typescript
import {
  GAME_SESSION_STATUS,
  RACE_STATUS,
  type DragSprintSnapshot,
  type GameInputPayload,
  type GameResultEntry,
  type GameSessionEnvelope,
  type LobbyState,
  type SessionFinishedPayload,
} from '@blitz/shared';

import type { GameRuntimeInstance, RuntimeCallbacks } from '../runtime.js';

export interface DragSprintRuntimeOptions extends RuntimeCallbacks<DragSprintSnapshot> {
  countdownMs?: number;
  distanceTarget?: number;
  now?: () => number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}
```

**Initial session envelope pattern** (lines 310-332):
```typescript
let state: GameSessionEnvelope<DragSprintSnapshot> = {
  sessionId,
  lobbyCode: lobby.code,
  game: 'race',
  variant: 'drag-sprint',
  status: GAME_SESSION_STATUS.countdown,
  countdown: Math.ceil(countdownMs / 1000),
  results: null,
  state: {
    sessionId,
    lobbyCode: lobby.code,
    trackId: TRACK_ID,
    status: RACE_STATUS.countdown,
    tick: 0,
    startedAt: null,
    countdown: Math.ceil(countdownMs / 1000),
    distanceTarget,
    playersState: createPlayerStates(activePlayers),
  } as DragSprintSnapshot,
};
```

**Start/emit pattern** (lines 347-390, 531-543):
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
    variant: 'drag-sprint',
    results: state.results!,
  };

  options.onFinished?.(payload);
};

start() {
  if (countdownMs <= 0) {
    activateRace();
    return state;
  }

  emitState();
  countdownTimer = schedule(() => {
    activateRace();
  }, countdownMs);

  return state;
},
```

**Current input handling to replace** (lines 544-624):
```typescript
applyInput(playerId, input: GameInputPayload) {
  if (state.state.status !== RACE_STATUS.racing) {
    return state;
  }

  const playerIndex = state.state.playersState.findIndex((player) => player.playerId === playerId);

  if (playerIndex < 0) {
    return state;
  }

  const tick = state.state.tick + 1;
  const steer = readSteer(input.steer);
  const accelerate = readBoolean(input.accelerate);
  const brake = readBoolean(input.brake);
  const nextPlayers = state.state.playersState.map((player) => ({ ...player }));
```

**Finish/result summary pattern** (lines 731-760):
```typescript
const winnerReachedFinish = nextPlayers.some((player) => player.distance >= distanceTarget);

state = {
  ...state,
  status: winnerReachedFinish ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
  state: buildStateSnapshot({
    ...state.state,
    tick,
    status: winnerReachedFinish ? RACE_STATUS.finished : RACE_STATUS.racing,
    playersState: nextPlayers,
  }),
  results: winnerReachedFinish
    ? {
        rankings: buildFinishLineRankings(nextPlayers, finishTimesMs),
        summary: {
          mode: LOBBY_RACE_MODES.finishLine,
          track: TRACK_ID,
          distanceTarget,
        },
      }
    : null,
};
```

**Apply:** Keep the `createDragSprintRuntime(lobby, sessionId, options)` factory and `race:drag-sprint` variant. Replace lane/obstacle/pickup/survival/best-of-3 mechanics with drag-gear state from `dragGearRules.ts`. Runtime should own throttle state by player, call pure helpers on input/tick, emit authoritative RPM/speed/distance/gear/last shift snapshots, and populate shift counts in `results.summary`.

---

### `apps/server/src/games/race/dragSprint.test.ts` (test, event-driven/request-response)

**Analog:** `apps/server/src/games/race/dragSprint.test.ts`

**Existing rewrite target import/fixture pattern** (lines 1-16):
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

**Finish payload assertion pattern** (lines 151-201):
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

assert.ok(state);
assert.equal(state.status, 'finished');
assert.equal(finishedPayloads.length, 1);
assert.deepEqual(finishedPayloads[0]?.results.rankings[0], {
  playerId: 'socket-host',
  rank: 1,
  label: '0.5s',
  value: 500,
});
```

**Apply:** Rewrite tests to assert new drag inputs: throttle press/release and discrete shift. Delete assertions for lane changes, obstacles, pickups, survival, and best-of-3. Keep deterministic `now`, `countdownMs: 0`, small `distanceTarget`, `onFinished` capture, and ranking/summary assertions.

---

### `apps/server/src/games/registry.ts` (config, request-response)

**Analog:** `apps/server/src/games/registry.ts`

**Registry entry pattern** (lines 71-86):
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

**Apply:** This likely stays unchanged. Verify `race:drag-sprint` still resolves and still points to `createDragSprintRuntime`; update only if the runtime export or countdown changes.

---

### `apps/web/src/pages/DragGearRacePage.tsx` (component/route, event-driven/request-response)

**Analogs:** `apps/web/src/pages/LightsSessionPage.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`

**Generic session hook and finish navigation pattern** (lines 52-93 in `LightsSessionPage.tsx`):
```typescript
export function LightsSessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialPayload = (location.state as SessionStartedPayload | null) ?? null;
  const { isConnected, socketId, session, finished, submitInput } = useGameSessionSocket(sessionId);
  const state = (session?.state as LightsSessionView | null) ?? null;

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

**Canvas guard pattern** (lines 51-74 in `SprintCircuitPage.tsx`):
```typescript
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

**Input submit pattern** (lines 141-158 in `LightsSessionPage.tsx`):
```typescript
<button
  className="button button-primary"
  type="button"
  disabled={!canReact}
  onClick={() => {
    if (!state) {
      return;
    }

    submitInput({
      reactionAtMs: Math.max(0, Math.round(performance.now() - anchorRef.current)),
    });
    setSubmittedRound(state.round);
  }}
>
  Reagisci
</button>
```

**Apply:** Build this as a route-level consumer of `useGameSessionSocket(sessionId)`, not `useLiveRaceSocket`. Cast `session.state` to the shared drag snapshot. Render the Phase 1 fullscreen shell if present; if not present at implementation time, fail planning or add a dependency on Phase 1 execution instead of recreating shell primitives ad hoc. Store finished payloads in `sessionStorage` and navigate to results exactly like existing session pages.

---

### `apps/web/src/pages/DragGearRacePage.test.tsx` (test, request-response)

**Analogs:** `apps/web/src/pages/LightsSessionPage.test.tsx`, `apps/web/src/pages/SprintCircuitPage.test.tsx`

**Hook mock and memory-router pattern** (lines 10-22 in `LightsSessionPage.test.tsx`):
```typescript
const { mockUseGameSessionSocket } = vi.hoisted(() => ({
  mockUseGameSessionSocket: vi.fn(),
}));

vi.mock('../lib/useGameSessionSocket', () => ({
  useGameSessionSocket: mockUseGameSessionSocket,
}));

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}
```

**Session fixture pattern** (lines 24-64 in `LightsSessionPage.test.tsx`):
```typescript
beforeEach(() => {
  mockUseGameSessionSocket.mockReset();
  mockUseGameSessionSocket.mockReturnValue({
    isConnected: true,
    socketId: 'p1',
    session: {
      sessionId: 'session-lights',
      lobbyCode: 'ABCD12',
      game: 'lights',
      variant: null,
      status: GAME_SESSION_STATUS.active,
      countdown: null,
      results: null,
      state: {
        phase: 'go',
        round: 1,
        totalRounds: 3,
        players: [],
      },
    },
    finished: null,
    submitInput: vi.fn(),
  });
});
```

**Apply:** Mock `useGameSessionSocket`; render `/race/live/session-drag` or the final drag route. Assert accessible controls `THROTTLE` and `SHIFT`, HUD labels `RPM`, `GEAR`, `KM/H`, `M`, `LAST SHIFT`, mode objective `Time the shift window`, and live text for shift quality. Use Testing Library `fireEvent.pointerDown/pointerUp` or `fireEvent.keyDown/keyUp` to verify throttle release and discrete shift submission.

---

### `apps/web/src/components/game/DragGearHud.tsx` (component, request-response)

**Analog:** `apps/web/src/components/RetroHud.tsx`

**HUD component pattern** (lines 17-41):
```typescript
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

**Apply:** Use the component shape, but do not reuse tiny `.retro-hud-label` sizing for critical values. Render `RPM`, `GEAR 1/4`, `KM/H`, `312 / 402 M`, `LAST SHIFT`, race status, and finish time as DOM text. Add an `aria-live="polite"` element for countdown, shift quality, finish, and connection/error state.

---

### `apps/web/src/components/game/RpmShiftMeter.tsx` and `ShiftQualityBadge.tsx` (components, transform/request-response)

**Analog:** `apps/web/src/components/RetroHud.tsx`

**Stable text-value pattern** (lines 24-35):
```typescript
<div className="retro-hud-box">
  <span className="retro-hud-label">TEMPO</span>
  <strong>{formatTime(state.elapsedMs)}</strong>
</div>
<div className="retro-hud-box">
  <span className="retro-hud-label">KM/H</span>
  <strong>{Math.round(state.player.speed * 58)}</strong>
</div>
```

**Apply:** Keep both components presentational. `RpmShiftMeter` receives current RPM and shift window from the server snapshot; it should not calculate authoritative RPM. `ShiftQualityBadge` maps `early/good/perfect/late/null` to visible labels `EARLY`, `GOOD`, `PERFECT`, `LATE`, or `--`. Keep dimensions stable so labels cannot resize the HUD.

---

### `apps/web/src/components/game/StraightDragTrack.tsx` (component, canvas/request-response)

**Analogs:** `apps/web/src/components/RetroRaceView.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`

**Canvas drawing guard pattern** (lines 20-37 in `RetroRaceView.tsx`):
```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) {
    return;
  }

  let context: CanvasRenderingContext2D | null = null;

  try {
    context = canvas.getContext('2d');
  } catch {
    return;
  }

  if (!context) return;
```

**Canvas element pattern** (lines 103-110 in `RetroRaceView.tsx`):
```typescript
<canvas
  ref={canvasRef}
  className="race-canvas-native"
  width={420}
  height={560}
  aria-label="Retro race canvas"
/>
```

**Apply:** Draw only straight progress: lane center/strip, distance markers, player/opponent cars, and finish line. Do not render steering lanes, obstacles, pickups, powerups, analog vectors, laps, or checkpoints. Use accessible label `Straight drag race track`; authoritative progress comes from snapshot fields.

---

### `apps/web/src/components/game/DragActionControls.tsx` (component, event-driven)

**Analogs:** `apps/web/src/components/RetroRaceView.tsx`, Phase 1 `ActionButton` plan

**Existing press-and-release control pattern** (lines 112-149 in `RetroRaceView.tsx`):
```typescript
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
```

**Keyboard listener cleanup pattern** (lines 146-165 in `useRetroRace.ts`):
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft') inputRef.current.steer = -1;
  if (event.key === 'ArrowRight') inputRef.current.steer = 1;
  if (event.key === 'ArrowDown') inputRef.current.brake = true;
};

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft' && inputRef.current.steer === -1) inputRef.current.steer = 0;
  if (event.key === 'ArrowRight' && inputRef.current.steer === 1) inputRef.current.steer = 0;
  if (event.key === 'ArrowDown') inputRef.current.brake = false;
};

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

return () => {
  window.cancelAnimationFrame(frame);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
};
```

**Apply:** Existing source has mouse/touch press controls but no pointer-capture component. Use Phase 1 planned `ActionButton` if it exists when Phase 2 executes. If implementing here, use Pointer Events with pointer capture, `touch-action: none`, `aria-pressed` for throttle, release on pointer up/cancel/lost capture/blur/visibility hidden/unmount/finish/disconnect, and ignore repeated keydown for shift.

---

### `apps/web/src/components/game/DragResultsSummary.tsx` and `apps/web/src/pages/ResultsPage.tsx` (component/route, request-response)

**Analog:** `apps/web/src/pages/ResultsPage.tsx`

**Payload normalization pattern** (lines 17-40):
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

**Ranking render pattern** (lines 103-114):
```typescript
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
) : (
```

**Apply:** Add a visible `Shift Summary` section for `payload.game === 'race' && payload.variant === 'drag-sprint'` and summary fields exist. Show finish time plus perfect/good/early/late/total counts without requiring a modal or expansion. Preserve current host post-game actions.

---

### `apps/web/src/pages/ResultsPage.test.tsx` (test, request-response)

**Analog:** `apps/web/src/pages/ResultsPage.test.tsx`

**Existing render and host action assertions** (lines 18-29, 76-86):
```typescript
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

test('renders shared rankings and host-only post-game actions', () => {
  renderRoute('/results/session-1', createFinishedPayload());

  expect(screen.getByRole('heading', { name: /risultati finali/i })).toBeInTheDocument();
  expect(screen.getByText(/socket-host/i)).toBeInTheDocument();
  expect(screen.getByText(/182 ms media/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /rigioca/i })).toBeInTheDocument();
});
```

**Apply:** Extend `createFinishedPayload()` or add a new drag payload fixture with `game: 'race'`, `variant: 'drag-sprint'`, and summary keys. Assert visible text `Shift Summary`, `PERFECT`, `GOOD`, `EARLY`, `LATE`, total shifts, and finish time.

---

### `apps/web/src/app/router.tsx` and `apps/web/src/lib/sessionRoutes.ts` (route, request-response)

**Analogs:** current router/session route utilities

**Router import and route pattern** (lines 1-13, 103-109 in `router.tsx`):
```typescript
import { ResultsPage } from '../pages/ResultsPage';
import { SprintCircuitPage } from '../pages/SprintCircuitPage';

{
  path: '/race/live/:sessionId',
  element: <SprintCircuitPage />,
},
{
  path: '/results/:sessionId',
  element: <ResultsPage />,
},
```

**Session route resolver pattern** (lines 3-13 in `sessionRoutes.ts`):
```typescript
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

**Apply:** If Phase 2 creates a distinct route, route `race:drag-sprint` to `DragGearRacePage` and keep sprint/circuit route compatibility. If keeping `/race/live/:sessionId`, make that route choose the correct page by variant only when the selected variant is available in route state/session state; otherwise plan a Phase 6 cleanup. Do not break `lights`, `penalty`, or results routing.

---

### `apps/web/src/styles.css` (config/style, request-response)

**Analog:** `apps/web/src/styles.css`

**Theme variables pattern** (lines 1-16):
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

**Current live race CSS to replace for active drag** (lines 447-529):
```css
.retro-hud {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.8rem;
  margin-top: 1.4rem;
}

.race-canvas-wrap {
  margin-top: 1rem;
  border: 4px solid #2a2a3a;
  box-shadow: 6px 6px 0 #000;
  overflow: hidden;
  background: #06060d;
}

.race-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1rem;
}
```

**Apply:** Add fullscreen gameplay classes from the UI contract. Use `position: fixed`, `inset: 0`, `width: 100vw`, `min-height: 100dvh`, `overflow: hidden`, safe-area padding, control `touch-action: none`, stable control sizes, and gameplay typography sizes of only 12/16/20/28px. Do not use `.panel`, `.card`, `.viewport`, `.topbar`, `.scanlines`, or `.shell-glow` for active drag gameplay.

## Shared Patterns

### Server Authoritative Session Runtime
**Source:** `apps/server/src/games/runtime.ts` lines 8-20 and `apps/server/src/games/manager.ts` lines 92-100  
**Apply to:** `dragSprint.ts`, `dragGearRules.ts`
```typescript
export interface GameRuntimeInstance<TState = unknown | null> {
  sessionId: string;
  lobbyCode: string;
  start(): GameSessionEnvelope<TState>;
  applyInput(playerId: string, input: GameInputPayload): GameSessionEnvelope<TState> | null;
  removePlayer(playerId: string): void;
  dispose(): void;
}

applyInput(playerId, input) {
  const sessionId = sessionIdByPlayerId.get(playerId);

  if (!sessionId) {
    return;
  }

  runtimeBySessionId.get(sessionId)?.applyInput(playerId, input);
}
```

### Session Finish Handoff
**Source:** `LightsSessionPage.tsx` lines 83-93 and `dragSprint.ts` lines 381-390  
**Apply to:** `DragGearRacePage.tsx`, `dragSprint.ts`
```typescript
window.sessionStorage.setItem(`blitz-results:${finished.sessionId}`, JSON.stringify(finished));
navigate(`/results/${finished.sessionId}`, {
  replace: true,
  state: finished,
});

const payload: SessionFinishedPayload = {
  sessionId,
  lobbyCode: lobby.code,
  game: 'race',
  variant: 'drag-sprint',
  results: state.results!,
};
```

### Input Validation
**Source:** `lights/runtime.ts` lines 66-74 and `dragSprint.ts` lines 78-88  
**Apply to:** `dragGearRules.ts`, `dragSprint.ts`
```typescript
function readReactionAtMs(input: GameInputPayload): number | null {
  const value = input.reactionAtMs;

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value);
}

function readBoolean(value: unknown) {
  return value === true;
}
```

### Test Harness
**Source:** `dragSprint.test.ts` lines 1-16, `LightsSessionPage.test.tsx` lines 10-22  
**Apply to:** all Phase 2 tests
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import { createDragSprintRuntime } from './dragSprint.js';

const { mockUseGameSessionSocket } = vi.hoisted(() => ({
  mockUseGameSessionSocket: vi.fn(),
}));

vi.mock('../lib/useGameSessionSocket', () => ({
  useGameSessionSocket: mockUseGameSessionSocket,
}));
```

### UI Accessibility And Testability
**Source:** `SprintCircuitPage.tsx` lines 130-137 and UI contract  
**Apply to:** `StraightDragTrack.tsx`, `DragGearHud.tsx`, `DragActionControls.tsx`
```typescript
<canvas
  ref={canvasRef}
  className="race-canvas-native"
  width={SPRINT_CIRCUIT_SIZE.width}
  height={SPRINT_CIRCUIT_SIZE.height}
  aria-label="Sprint circuit canvas"
/>
```

**Apply:** Canvas should be visual only for track/cars. Required RPM, gear, speed, distance, last shift, countdown/status, and results summary must be React-rendered text.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/web/src/components/game/FullscreenGameShell.tsx` and related Phase 1 shell files | component | request-response | Phase 2 depends on these planned Phase 1 outputs, but `apps/web/src/components/game/` does not exist in current source. Use Phase 1 artifacts if executed before Phase 2. |

## Metadata

**Analog search scope:** `apps/**/src`, `packages/shared/src`, `tests`, `.planning/phases/01-fullscreen-game-shell-and-input-foundation`, `.planning/codebase`  
**Files scanned:** 68 source/test files excluding `dist` and `node_modules`  
**Pattern extraction date:** 2026-04-25  
**Project constraints applied:** source of truth stays in `apps/**/src` and `packages/shared/src`; server gameplay state remains authoritative; shared socket/input/snapshot contracts live in `packages/shared`; gameplay screens must be mobile-first and fullscreen.
