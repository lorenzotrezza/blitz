# Phase 05: Figure-Eight Analog Track Race - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 19
**Analogs found:** 18 / 19

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/shared/src/game.ts` | model/contract | transform | `packages/shared/src/game.ts` | exact |
| `packages/shared/src/lobby.ts` | config/model | request-response | `packages/shared/src/lobby.ts` | exact |
| `packages/shared/src/contracts.test.ts` | test | transform/request-response | `packages/shared/src/contracts.test.ts` | exact |
| `apps/server/src/games/race/figureEightTrackRules.ts` | utility | transform | `apps/server/src/games/race/dragGearRules.ts` + `apps/server/src/games/race/sprintCircuit.ts` | partial |
| `apps/server/src/games/race/figureEightTrackRules.test.ts` | test | transform | `apps/server/src/games/race/dragGearRules.test.ts` | role-match |
| `apps/server/src/games/race/analogTrackGates.ts` | utility | transform | none | no analog |
| `apps/server/src/games/race/figureEightTrack.ts` | service/runtime | event-driven | `apps/server/src/games/race/sprintCircuit.ts` | exact |
| `apps/server/src/games/race/figureEightTrack.test.ts` | test | event-driven | `apps/server/src/games/race/sprintCircuit.test.ts` | role-match |
| `apps/server/src/games/registry.ts` | config/factory | request-response | `apps/server/src/games/registry.ts` | exact |
| `apps/server/src/games/registry.test.ts` | test | request-response | `apps/server/src/games/registry.test.ts` | exact |
| `apps/web/src/game/figureEightTrackCanvas.ts` | utility | transform/render | `apps/web/src/game/sprintCircuitTrack.ts` | role-match |
| `apps/web/src/game/figureEightTrackCanvas.test.ts` | test | transform/render | `apps/web/src/pages/SprintCircuitPage.test.tsx` | partial |
| `apps/web/src/pages/FigureEightTrackPage.tsx` | component/page | event-driven | `apps/web/src/pages/SprintCircuitPage.tsx` | exact |
| `apps/web/src/pages/FigureEightTrackPage.test.tsx` | test | event-driven | `apps/web/src/pages/SprintCircuitPage.test.tsx` | exact |
| `apps/web/src/lib/sessionRoutes.ts` | route utility | request-response | `apps/web/src/lib/sessionRoutes.ts` | exact |
| `apps/web/src/lib/sessionRoutes.test.ts` | test | request-response | `apps/web/src/app/router.test.tsx` | partial |
| `apps/web/src/app/router.tsx` | route config | request-response | `apps/web/src/app/router.tsx` | exact |
| `apps/web/src/pages/ResultsPage.tsx` | component/page | request-response | `apps/web/src/pages/ResultsPage.tsx` | exact |
| `apps/web/src/pages/ResultsPage.test.tsx` | test | request-response | `apps/web/src/pages/ResultsPage.test.tsx` | exact |

## Pattern Assignments

### `packages/shared/src/game.ts` (model/contract, transform)

**Analog:** `packages/shared/src/game.ts`

**Enum-like mode/input constants** (lines 11-36):
```typescript
export const RACE_SHELL_MODE_IDS = {
  drag: 'drag',
  dodge: 'dodge',
  circle: 'circle',
  figureEight: 'figure-eight',
} as const;

export const RACE_GAME_INPUT_KIND = {
  analog: 'analog',
  button: 'button',
  action: 'action',
} as const;
```

**Analog input and shell HUD shape** (lines 53-82, 92-112):
```typescript
export interface RaceAnalogVector {
  x: number;
  y: number;
  magnitude: number;
}

export interface RaceAnalogInput extends RaceInputBase {
  kind: 'analog';
  vector: RaceAnalogVector;
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

**Validation/clamping pattern** (lines 315-376):
```typescript
export function clampRaceAnalogVector(vector: RaceAnalogVector): RaceAnalogVector {
  return {
    x: clampFiniteNumber(vector.x, -1, 1),
    y: clampFiniteNumber(vector.y, -1, 1),
    magnitude: clampFiniteNumber(vector.magnitude, 0, 1),
  };
}

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
  // Continue with kind-specific validation.
}
```

**Apply to Phase 5:** Add figure-eight player/snapshot fields only if Phase 4 did not already create reusable analog track contracts. Keep client input as compact intent: analog vector, mode id, sequence, timestamp; never add client-authored lap/checkpoint/finish fields.

---

### `packages/shared/src/lobby.ts` (config/model, request-response)

**Analog:** `packages/shared/src/lobby.ts`

**Variant constants and union pattern** (lines 20-34):
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

  return false;
}
```

**Apply to Phase 5:** Add `figureEightTrack: 'figure-eight-track'` and return `true` for that race variant. Preserve broader lobby catalog copy/polish for Phase 6.

---

### `packages/shared/src/contracts.test.ts` (test, transform/request-response)

**Analog:** `packages/shared/src/contracts.test.ts`

**Shared import style** (lines 1-18):
```typescript
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  clampRaceAnalogVector,
  isLobbySelectionStartable,
  isRaceGameInput,
  LOBBY_RACE_MODES,
  LOBBY_STATUS,
  SOCKET_EVENTS,
} from './index.js';
```

**Startability assertion pattern** (lines 132-154):
```typescript
test('exports the current lobby selection startability policy', () => {
  assert.equal(isLobbySelectionStartable('lights', null), true);
  assert.equal(isLobbySelectionStartable('penalty', null), true);
  assert.equal(isLobbySelectionStartable('race', 'sprint-circuit'), true);
  assert.equal(isLobbySelectionStartable('race', null), false);
});
```

**Figure-eight shell contract precedent** (lines 425-464):
```typescript
const modeId: RaceShellModeId = 'figure-eight';
const snapshot: RaceShellSnapshot = {
  sessionId: 'session-shell',
  lobbyCode: 'ABCD12',
  modeId: 'figure-eight',
  status,
  countdown: 0,
  tick: 24,
  players: [],
  hud: {
    objective: 'Hit every crossing gate',
    progressLabel: 'Lap 1 / 3',
    speedLabel: '38 km/h',
    penaltyLabel: 'Clean',
    inputLabel: 'Analog 56%',
    modeMetricLabel: 'Next gate',
    modeMetricValue: 'North',
  },
  mode: {},
};
```

**Guard/clamp assertion pattern** (lines 577-667):
```typescript
assert.equal(
  isRaceGameInput({
    kind: 'analog',
    sequence: 1,
    clientTimeMs: 1_713_980_000_123,
    modeId: 'circle',
    vector: { x: 0.4, y: -0.2, magnitude: 0.45 },
  }),
  true,
);
```

**Apply to Phase 5:** Extend this file with `PARTY_GAME_VARIANTS.figureEightTrack`, startability, `modeId: 'figure-eight'`, and any new Figure Eight snapshot/player/course fields. Keep tests in Node's built-in runner.

---

### `apps/server/src/games/race/figureEightTrackRules.ts` (utility, transform)

**Analogs:** `apps/server/src/games/race/dragGearRules.ts` for pure helper module shape; `apps/server/src/games/race/sprintCircuit.ts` for current embedded track geometry.

**Pure rules module imports/types pattern** (`dragGearRules.ts` lines 1-5, 25-67):
```typescript
import {
  RACE_STATUS,
  type GameResultEntry,
  type RaceStatus,
} from '@blitz/shared';

export interface DragGearTuning {
  maxGear: number;
  distanceTargetM: number;
  idleRpm: number;
  redlineRpm: number;
}

export type DragGearRuleInput =
  | { kind: 'drag-throttle'; pressed: boolean; sequence: number; clientTimeMs: number }
  | { kind: 'drag-shift'; sequence: number; clientTimeMs: number };
```

**Input reader / malformed-input pattern** (`dragGearRules.ts` lines 124-159):
```typescript
export function readDragGearInput(input: unknown): DragGearRuleInput | null {
  if (!isRecord(input)) {
    return null;
  }

  const { kind, sequence, clientTimeMs } = input;

  if (!isFiniteNonNegativeNumber(sequence) || !isFiniteNonNegativeNumber(clientTimeMs)) {
    return null;
  }

  if (kind === 'drag-throttle') {
    const { pressed } = input;

    if (typeof pressed !== 'boolean') {
      return null;
    }
  }

  return null;
}
```

**Geometry constants and projection pattern** (`sprintCircuit.ts` lines 49-81, 115-176):
```typescript
const TRACK_POINTS: TrackPoint[] = [
  { x: 112, y: 88 },
  { x: 286, y: 88 },
  // ...
];

const TRACK_SEGMENTS: TrackSegment[] = TRACK_POINTS.map((point, index) => {
  const nextPoint = TRACK_POINTS[(index + 1) % TRACK_POINTS.length]!;
  const dx = nextPoint.x - point.x;
  const dy = nextPoint.y - point.y;

  return { from: point, to: nextPoint, length: Math.hypot(dx, dy) };
});

function projectPlayerState(
  totalProgress: number,
  laneOffset: number,
  laps: number,
  previous: RacePlayerState,
): RacePlayerState {
  const pose = sampleTrackPose(circuitProgress, laneOffset);
  return {
    ...previous,
    x: pose.x,
    y: pose.y,
    angle: pose.angle,
    lap: completedLaps,
    checkpoint,
    progress: normalizedProgress,
  };
}
```

**Apply to Phase 5:** Use pure exported helpers for `FIGURE_EIGHT_TRACK_ID`, course geometry, ordered gates, swept gate crossing, lobe/center-cut classification, warning grace, speed caps, lap completion, and rankings. Do not copy `sprintCircuit`'s nearest/progress-only checkpoint model as the validator; Phase 5 requires explicit ordered center and lobe gates.

---

### `apps/server/src/games/race/figureEightTrackRules.test.ts` (test, transform)

**Analog:** `apps/server/src/games/race/dragGearRules.test.ts`

**Node test imports and deterministic helper calls** (lines 1-14, 16-23):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import { RACE_STATUS } from '@blitz/shared';

import {
  DEFAULT_DRAG_GEAR_TUNING,
  advanceDragGearPlayer,
  applyDragGearInput,
  createInitialDragGearPlayer,
  scoreShift,
} from './dragGearRules.js';

test('scores shift windows as early good perfect and late', () => {
  const window = DEFAULT_DRAG_GEAR_TUNING.shiftWindow;

  assert.equal(scoreShift(6200, window), 'early');
});
```

**Malformed/repeated input assertion pattern** (lines 50-95):
```typescript
const malformed = applyDragGearInput(
  { status: RACE_STATUS.racing, player: throttled },
  { kind: 'drag-throttle', pressed: 'yes', sequence: 2, clientTimeMs: 20 },
);

assert.deepEqual(malformed, throttled);
```

**Apply to Phase 5:** Create tests for ordered gates through left lobe, center crossing, right lobe, and start/finish; skipped lobe and center cut rejection; brief wrong lobe/wrong-way warning before penalty; crossing-safe swept-gate detection; and lap completion only after the full ordered sequence.

---

### `apps/server/src/games/race/figureEightTrack.ts` (service/runtime, event-driven)

**Analog:** `apps/server/src/games/race/sprintCircuit.ts`

**Runtime imports and options** (lines 1-14, 42-47):
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

export interface SprintCircuitRuntimeOptions extends RuntimeCallbacks<RaceSnapshot> {
  countdownMs?: number;
  laps?: number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}
```

**Initial authoritative envelope** (lines 258-277):
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

**Lifecycle, input guard, finish emission** (lines 288-318, 336-350, 444-468):
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

applyInput(playerId, input) {
  if (state.state.status !== RACE_STATUS.racing) {
    return state;
  }

  const playerIndex = state.state.playersState.findIndex((player) => player.playerId === playerId);

  if (playerIndex < 0) {
    return state;
  }

  state = {
    ...state,
    status: allFinished ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
    results: allFinished
      ? { rankings: buildRankings(nextPlayers, finishTimesMs), summary: { laps, track: 'sprint-circuit' } }
      : null,
  };

  emitState();

  if (allFinished) {
    emitFinished();
  }

  return state;
}
```

**Apply to Phase 5:** Keep this factory/lifecycle shape, timer injection, `removePlayer`, and `dispose`. Replace legacy `steer/accelerate/brake` reads with `isRaceGameInput(input)`, `input.kind === RACE_GAME_INPUT_KIND.analog`, and `input.modeId === RACE_SHELL_MODE_IDS.figureEight`. Emit `variant: PARTY_GAME_VARIANTS.figureEightTrack` and summary fields including `mode`, `track`, `laps`, `penaltiesByPlayer`, `centerCuts` or equivalent crossing penalty count.

---

### `apps/server/src/games/race/figureEightTrack.test.ts` (test, event-driven)

**Analog:** `apps/server/src/games/race/sprintCircuit.test.ts`

**Fixture pattern** (lines 1-42):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_STATUS,
  PLAYER_CONNECTION_STATE,
  type LobbyState,
  type RaceSnapshot,
} from '@blitz/shared';

function createLobby(): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'sprint-circuit',
    status: LOBBY_STATUS.waiting,
    settings: { maxPlayers: 8, laps: 2 },
    players: [{ id: 'socket-host', nickname: 'Blitz', carId: 'f812', ready: true, connectionState: PLAYER_CONNECTION_STATE.connected }],
  };
}
```

**Runtime assertion pattern** (lines 44-65):
```typescript
const runtime = createSprintCircuitRuntime(createLobby(), 'session-race', {
  countdownMs: 0,
  laps: 1,
});

const initial = runtime.start();
const next = runtime.applyInput('socket-host', {
  tick: 1,
  steer: 1,
  accelerate: true,
  brake: false,
});

assert.ok(next);
const initialSnapshot = initial.state as RaceSnapshot;
const nextSnapshot = next.state as RaceSnapshot;
assert.ok(nextSnapshot.playersState[0]!.progress > initialSnapshot.playersState[0]!.progress);
```

**Apply to Phase 5:** Test `createFigureEightTrackRuntime()` start state, valid figure-eight analog input, ignored malformed/non-figure input, unknown player ignore, finish rankings, and summary. Use a fixture with `selectedVariant: PARTY_GAME_VARIANTS.figureEightTrack`.

---

### `apps/server/src/games/registry.ts` and `registry.test.ts` (config/factory, request-response)

**Analog:** `apps/server/src/games/registry.ts`

**Imports and registry entry pattern** (lines 1-7, 55-70):
```typescript
import type { LobbyState, PartyGame, PartyGameVariant } from '@blitz/shared';

import { createDragSprintRuntime } from './race/dragSprint.js';
import { createSprintCircuitRuntime } from './race/sprintCircuit.js';
import type { GameRuntimeFactory } from './runtime.js';

{
  key: 'race:sprint-circuit',
  game: 'race',
  variant: 'sprint-circuit',
  countdown: 3,
  createRuntime(lobby: LobbyState, sessionId: string, callbacks) {
    return createSprintCircuitRuntime(lobby, sessionId, {
      onState(payload) {
        callbacks.onState?.(payload);
      },
      onFinished(payload) {
        callbacks.onFinished?.(payload);
      },
    });
  },
}
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
      return entries.find((entry) => entry.game === game && entry.variant === variant) ?? null;
    },
  };
}
```

**Test pattern** (`registry.test.ts` lines 8-14):
```typescript
test('game registry exposes the current playable variants while shared startability stays mode-aware', () => {
  const registry = createGameRuntimeRegistry();
  assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.sprintCircuit) !== null, true);
  assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.dragSprint) !== null, true);
});
```

**Apply to Phase 5:** Import `createFigureEightTrackRuntime` with `.js` extension and add `race:figure-eight-track`. Extend the registry test to assert `resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.figureEightTrack)` is non-null and startable.

---

### `apps/web/src/game/figureEightTrackCanvas.ts` (utility, transform/render)

**Analog:** `apps/web/src/game/sprintCircuitTrack.ts`

**Geometry constants pattern** (lines 1-36):
```typescript
export interface TrackPoint {
  x: number;
  y: number;
}

export const SPRINT_CIRCUIT_SIZE = {
  width: 420,
  height: 560,
} as const;

export const SPRINT_CIRCUIT_CHECKPOINTS = [
  { x: 216, y: 88 },
  { x: 332, y: 182 },
  { x: 240, y: 276 },
  { x: 146, y: 384 },
  { x: 256, y: 484 },
  { x: 290, y: 326 },
] as const;
```

**Canvas drawing pattern** (lines 38-107):
```typescript
export function drawSprintCircuitTrack(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, SPRINT_CIRCUIT_SIZE.width, SPRINT_CIRCUIT_SIZE.height);
  context.fillStyle = '#06060d';
  context.fillRect(0, 0, SPRINT_CIRCUIT_SIZE.width, SPRINT_CIRCUIT_SIZE.height);

  context.strokeStyle = '#c8d4df';
  context.lineWidth = 54;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.beginPath();
  SPRINT_CIRCUIT_CENTERLINE.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
      return;
    }
    context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.stroke();
}
```

**Apply to Phase 5:** Export stable size, centerline/gates, and `drawFigureEightTrack(context, snapshot)`. Add bridge/underpass styling at the crossing, active next-path highlight, directional arrows, ordered gate labels, warning/penalty colors, and car/label drawing from authoritative snapshot fields.

---

### `apps/web/src/pages/FigureEightTrackPage.tsx` (component/page, event-driven)

**Analog:** `apps/web/src/pages/SprintCircuitPage.tsx`

**Imports pattern** (lines 1-21):
```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  RACE_GAME_BUTTONS,
  RACE_STATUS,
  type RaceAnalogVector,
  type RaceShellSnapshot,
  type RaceSnapshot,
  type SessionStartedPayload,
} from '@blitz/shared';

import { AnalogPad } from '../components/game/AnalogPad';
import { FullscreenGameShell } from '../components/game/FullscreenGameShell';
import { GameHud } from '../components/game/GameHud';
import { GameViewport } from '../components/game/GameViewport';
import { useGameControls } from '../components/game/useGameControls';
```

**Shell snapshot adapter pattern** (lines 52-116):
```typescript
function createShellSnapshot(
  snapshot: RaceSnapshot | null,
  fallbackSessionId: string,
  fallbackLobbyCode: string,
  fallbackCountdown: number | null,
  inputLabel: string,
): RaceShellSnapshot | null {
  if (!snapshot) {
    return {
      sessionId: fallbackSessionId,
      lobbyCode: fallbackLobbyCode,
      modeId: 'circle',
      status: RACE_STATUS.countdown,
      countdown: fallbackCountdown,
      tick: 0,
      players: [],
      hud: {
        objective: 'Prepare to race',
        progressLabel: '0%',
        speedLabel: '0 km/h',
        penaltyLabel: 'Clear',
        inputLabel,
        modeMetricLabel: 'Start',
        modeMetricValue: String(fallbackCountdown),
      },
      mode: {},
    };
  }
  // Map authoritative snapshot fields into RaceShellSnapshot.
}
```

**Controls/socket/lifecycle pattern** (lines 118-156, 185-196):
```typescript
const { isConnected, snapshot, finished, submitInput } = useLiveRaceSocket(sessionId);
const {
  state: controlState,
  setAnalogVector,
  setButtonState,
  resetInput,
} = useGameControls({
  modeId: 'circle',
  enabled: snapshot?.status === RACE_STATUS.racing,
  onInput: submitInput,
});

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

**Fullscreen shell pattern** (lines 242-303):
```typescript
return (
  <FullscreenGameShell
    hud={<GameHud snapshot={shellSnapshot} fallbackSessionId={sessionId} />}
    viewport={
      <GameViewport label="Sprint circuit track" aspectRatio={`${SPRINT_CIRCUIT_SIZE.width} / ${SPRINT_CIRCUIT_SIZE.height}`}>
        <canvas ref={canvasRef} className="race-canvas-native" />
        <ol className="game-race-roster" aria-label="Race entrants">
          {(snapshot?.playersState ?? []).map((entrant) => (
            <li key={entrant.playerId}>
              <strong>{entrant.nickname}</strong>
            </li>
          ))}
        </ol>
      </GameViewport>
    }
    controls={/* AnalogPad and controls */}
    stateOverlay={!isConnected ? <GameErrorState /> : shellSnapshot ? null : <GameEmptyState />}
  />
);
```

**Apply to Phase 5:** Prefer `useGameSessionSocket()` over `useLiveRaceSocket()` unless Phase 4 already generalized the race hook. Use `RACE_SHELL_MODE_IDS.figureEight`; no app chrome; React HUD fields for lap, next gate, direction, crossing/course state, speed, and penalty; canvas only renders authoritative state.

---

### `apps/web/src/pages/FigureEightTrackPage.test.tsx` and `figureEightTrackCanvas.test.ts` (tests, event-driven/render)

**Analog:** `apps/web/src/pages/SprintCircuitPage.test.tsx`

**Vitest route mocking pattern** (lines 1-38):
```typescript
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockNavigate, mockSubmitInput, mockUseLiveRaceSocket } =
  vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockSubmitInput: vi.fn(),
    mockUseLiveRaceSocket: vi.fn(),
  }));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});
```

**Fullscreen/HUD/no-chrome assertions** (lines 143-191):
```typescript
test('renders the fullscreen race shell with HUD and controls', () => {
  renderRoute('/race/live/session-1');

  expect(screen.getByLabelText('Fullscreen race session')).toBeInTheDocument();
  expect(screen.getByLabelText(/sprint circuit canvas/i)).toBeInTheDocument();
  expect(screen.getByText(/reach the finish/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/steer/i)).toBeInTheDocument();
});

test('renders without normal app chrome or card layout classes', () => {
  const { container } = renderRoute('/race/live/session-1');

  expect(screen.queryByRole('link', { name: /home/i })).not.toBeInTheDocument();
  expect(container.querySelector('.viewport')).toBeNull();
  expect(container.querySelector('.panel')).toBeNull();
  expect(container.querySelector('.card')).toBeNull();
});
```

**Finish and input assertions** (lines 193-230):
```typescript
await waitFor(() => {
  expect(window.sessionStorage.getItem('blitz-results:session-1')).toBe(
    JSON.stringify(finished),
  );
});

fireEvent.pointerDown(screen.getByRole('button', { name: 'GO' }), {
  pointerId: 1,
});

expect(mockSubmitInput).toHaveBeenCalledWith(
  expect.objectContaining({
    kind: 'button',
    button: 'primary',
    state: 'pressed',
  }),
);
```

**Apply to Phase 5:** Mock `useGameSessionSocket` if the page uses it. Assert figure-eight route copy, canvas label, `Figure Eight` mode, `Next gate`, lobe/crossing direction, warning text, analog controls, `modeId: 'figure-eight'`, finish navigation/storage, and no topbar/panel/card layout. Canvas tests should use a minimal mock context and assert bridge/underpass, arrows, next gate highlight, labels, and warning colors are invoked.

---

### `apps/web/src/lib/sessionRoutes.ts`, `apps/web/src/app/router.tsx`, and tests (route utility/config, request-response)

**Analogs:** `apps/web/src/lib/sessionRoutes.ts`, `apps/web/src/app/router.tsx`, `apps/web/src/app/router.test.tsx`

**Route resolver pattern** (`sessionRoutes.ts` lines 1-13):
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

**Fullscreen route outside app chrome** (`router.tsx` lines 48-113):
```typescript
function buildRoutes() {
  return [
    {
      element: <AppLayout />,
      children: [
        { path: '/results/:sessionId', element: <ResultsPage /> },
      ],
    },
    {
      path: '/race/live/:sessionId',
      element: <SprintCircuitPage />,
    },
  ];
}
```

**Router test pattern** (`router.test.tsx` lines 152-169):
```typescript
test('renders live race route outside app chrome', () => {
  mockUseLiveRaceSocket.mockReturnValue({
    isConnected: true,
    snapshot: createSnapshot(),
    finished: null,
    submitInput: vi.fn(),
  });

  const { container } = renderRoute('/race/live/session-1');

  expect(screen.getByLabelText('Fullscreen race session')).toBeInTheDocument();
  expect(document.querySelector('.topbar')).toBeNull();
  expect(container.querySelector('.viewport')).toBeNull();
  expect(container.querySelector('.panel')).toBeNull();
});
```

**Apply to Phase 5:** Make `resolveSessionRoute()` variant-aware so figure-eight sessions route to a figure-eight fullscreen path. Add `FigureEightTrackPage` as a top-level route sibling outside `AppLayout`; extend route tests or create `sessionRoutes.test.ts` if Phase 4 has not already added one.

---

### `apps/web/src/pages/ResultsPage.tsx` and `ResultsPage.test.tsx` (component/page, request-response)

**Analog:** `apps/web/src/pages/ResultsPage.tsx`

**Payload normalization and stored results pattern** (lines 17-40, 58-73):
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

const storedPayload = window.sessionStorage.getItem(`blitz-results:${sessionId}`);
```

**Rank rendering and post-game actions** (lines 103-156):
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
) : null}
```

**Test payload with summary precedent** (`ResultsPage.test.tsx` lines 31-56):
```typescript
function createFinishedPayload(): SessionFinishedPayload {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    game: 'lights',
    variant: null,
    results: {
      rankings: [
        { playerId: 'socket-host', rank: 1, label: '182 ms media', value: 182 },
      ],
      summary: {
        rounds: 3,
      },
    },
  };
}
```

**Apply to Phase 5:** Ensure summary rendering includes figure-eight fields if Phase 4 did not already generalize summaries. Tests should cover `track: 'figure-eight-track'`, laps, penalties/cuts, and still preserve host-only post-game actions.

## Shared Patterns

### Generic Session Event Family

**Source:** `packages/shared/src/contracts.ts`, `apps/web/src/lib/useGameSessionSocket.ts`
**Apply to:** Figure-eight page/runtime and all socket integration.

```typescript
// packages/shared/src/contracts.ts lines 14-40
export const SOCKET_EVENTS = {
  client: {
    gameInput: 'client:game-input',
  },
  server: {
    sessionState: 'server:session-state',
    sessionFinished: 'server:session-finished',
  },
} as const;

// apps/web/src/lib/useGameSessionSocket.ts lines 42-55, 76-78
const handleSessionState = (payload: GameSessionEnvelope) => {
  if (payload.sessionId !== sessionId) {
    return;
  }

  setSession(payload);
};

submitInput(payload) {
  socket.emit(SOCKET_EVENTS.client.gameInput, payload);
}
```

### Authoritative Runtime Lifecycle

**Source:** `apps/server/src/games/runtime.ts`, `apps/server/src/games/manager.ts`
**Apply to:** `figureEightTrack.ts`.

```typescript
// apps/server/src/games/runtime.ts lines 13-20
export interface GameRuntimeInstance<TState = unknown | null> {
  sessionId: string;
  lobbyCode: string;
  start(): GameSessionEnvelope<TState>;
  applyInput(playerId: string, input: GameInputPayload): GameSessionEnvelope<TState> | null;
  removePlayer(playerId: string): void;
  dispose(): void;
}

// apps/server/src/games/manager.ts lines 92-100
applyInput(playerId, input) {
  const sessionId = sessionIdByPlayerId.get(playerId);

  if (!sessionId) {
    return;
  }

  runtimeBySessionId.get(sessionId)?.applyInput(playerId, input);
}
```

### Fullscreen Gameplay Shell and Controls

**Source:** `apps/web/src/components/game/FullscreenGameShell.tsx`, `apps/web/src/components/game/AnalogPad.tsx`, `apps/web/src/components/game/useGameControls.ts`
**Apply to:** `FigureEightTrackPage.tsx`.

```typescript
// FullscreenGameShell.tsx lines 20-31
return (
  <section className="game-shell" aria-label="Fullscreen race session">
    <div className="game-shell__hud">{hud}</div>
    <div className="game-shell__viewport">{viewport}</div>
    <div className="game-shell__controls">{controls}</div>
    {stateOverlay ? <div className="game-shell__state">{stateOverlay}</div> : null}
  </section>
);

// useGameControls.ts lines 118-129
sequenceRef.current += 1;
onInputRef.current({
  ...input,
  modeId: modeIdRef.current,
  sequence: sequenceRef.current,
  clientTimeMs: Date.now(),
} as RaceGameInput);
```

### HUD Text and Live Status

**Source:** `apps/web/src/components/game/GameHud.tsx`
**Apply to:** Figure-eight HUD adapter and tests.

```typescript
// GameHud.tsx lines 8-13, 31-79
const MODE_LABELS: Record<RaceShellModeId, string> = {
  drag: 'Drag',
  dodge: 'Dodge',
  circle: 'Circle',
  'figure-eight': 'Figure Eight',
};

<div className="game-hud" aria-label="Race status">
  <dl className="game-hud__grid">
    <div className="game-hud__item">
      <dt>Penalty</dt>
      <dd>{penalty}</dd>
    </div>
  </dl>
  <p className="game-hud__live" aria-live="polite">
    {status} · {countdown ?? 'waiting'} · {penalty}
  </p>
</div>
```

### Results Summary Shape

**Source:** `packages/shared/src/contracts.ts`, `apps/server/src/games/race/sprintCircuit.ts`
**Apply to:** `figureEightTrack.ts`, `ResultsPage.tsx`.

```typescript
// contracts.ts lines 110-113
export interface GameResults {
  rankings: GameResultEntry[];
  summary?: Record<string, string | number | boolean | null>;
}

// sprintCircuit.ts lines 453-460
results: allFinished
  ? {
      rankings: buildRankings(nextPlayers, finishTimesMs),
      summary: {
        laps,
        track: 'sprint-circuit',
      },
    }
  : null,
```

## No Analog Found

Phase 4 circle source files are not present in the current source tree. If Phase 4 execution lands before Phase 5, planner should prefer `circleTrackRules.ts`, `circleTrack.ts`, `CircleTrackPage.tsx`, and `circleTrackCanvas.ts` over the older `sprintCircuit` analogs.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/server/src/games/race/analogTrackGates.ts` | utility | transform | No current generic analog gate helper exists. Create only if it meaningfully de-duplicates landed Phase 4 circle and Phase 5 figure-eight gate logic. |

## Metadata

**Analog search scope:** `packages/shared/src`, `apps/server/src/games`, `apps/web/src/components/game`, `apps/web/src/game`, `apps/web/src/lib`, `apps/web/src/app`, `apps/web/src/pages`, Phase 4 planning artifacts for future-source caveat.
**Files scanned:** 54 source/test files plus Phase 4 pattern/plans.
**Pattern extraction date:** 2026-04-25
**Project instruction checks:** No root `CLAUDE.md`; no repo-local `.claude/skills` or `.agents/skills`; source of truth kept to `apps/**/src` and `packages/shared/src`.
