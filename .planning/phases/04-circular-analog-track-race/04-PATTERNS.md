# Phase 04: circular-analog-track-race - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 17
**Analogs found:** 17 / 17

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/shared/src/game.ts` | model/contract | transform | `packages/shared/src/game.ts` | exact |
| `packages/shared/src/lobby.ts` | config/model | request-response | `packages/shared/src/lobby.ts` | exact |
| `packages/shared/src/contracts.test.ts` | test | transform/request-response | `packages/shared/src/contracts.test.ts` | exact |
| `apps/server/src/games/race/circleTrackRules.ts` | utility | transform | `apps/server/src/games/race/sprintCircuit.ts` | partial |
| `apps/server/src/games/race/circleTrackRules.test.ts` | test | transform | `apps/server/src/games/race/sprintCircuit.test.ts` | role-match |
| `apps/server/src/games/race/circleTrack.ts` | service/runtime | event-driven | `apps/server/src/games/race/sprintCircuit.ts` | exact |
| `apps/server/src/games/race/circleTrack.test.ts` | test | event-driven | `apps/server/src/games/race/sprintCircuit.test.ts` | exact |
| `apps/server/src/games/registry.ts` | config/factory | request-response | `apps/server/src/games/registry.ts` | exact |
| `apps/web/src/game/circleTrackCanvas.ts` | utility | transform/render | `apps/web/src/game/sprintCircuitTrack.ts` | role-match |
| `apps/web/src/game/circleTrackCanvas.test.ts` | test | transform/render | `apps/web/src/pages/SprintCircuitPage.test.tsx` | partial |
| `apps/web/src/pages/CircleTrackPage.tsx` | component/page | event-driven | `apps/web/src/pages/SprintCircuitPage.tsx` | exact |
| `apps/web/src/pages/CircleTrackPage.test.tsx` | test | event-driven | `apps/web/src/pages/SprintCircuitPage.test.tsx` | exact |
| `apps/web/src/lib/sessionRoutes.ts` | route utility | request-response | `apps/web/src/lib/sessionRoutes.ts` | exact |
| `apps/web/src/app/router.tsx` | route config | request-response | `apps/web/src/app/router.tsx` | exact |
| `apps/web/src/pages/ResultsPage.tsx` | component/page | request-response | `apps/web/src/pages/ResultsPage.tsx` | exact |
| `apps/web/src/pages/ResultsPage.test.tsx` | test | request-response | `apps/web/src/pages/ResultsPage.test.tsx` | exact |
| `apps/web/src/styles.css` | config/style | responsive layout | `apps/web/src/styles.css` | exact |

## Pattern Assignments

### `packages/shared/src/game.ts` (model/contract, transform)

**Analog:** `packages/shared/src/game.ts`

**Imports pattern:** none. This file is the shared contract root and currently has no imports.

**Enum-like constants and discriminated input pattern** (lines 11-36):
```typescript
export const RACE_SHELL_MODE_IDS = {
  drag: 'drag',
  dodge: 'dodge',
  circle: 'circle',
  figureEight: 'figure-eight',
} as const;

export type RaceShellModeId =
  (typeof RACE_SHELL_MODE_IDS)[keyof typeof RACE_SHELL_MODE_IDS];

export const RACE_GAME_INPUT_KIND = {
  analog: 'analog',
  button: 'button',
  action: 'action',
} as const;
```

**Analog input shape** (lines 53-82):
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

export type RaceGameInput = RaceAnalogInput | RaceButtonInput | RaceActionInput;
```

**Snapshot/HUD contract pattern** (lines 92-112):
```typescript
export interface RaceShellHud {
  objective: string;
  progressLabel: string;
  speedLabel: string;
  penaltyLabel: string;
  inputLabel: string;
  modeMetricLabel: string;
  modeMetricValue: string;
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

**Validation/clamping pattern** (lines 244-302):
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
  // Continue with kind-specific checks, returning false for malformed payloads.
}
```

**Apply to Phase 4:** Add circle-specific player/snapshot/course state types here. Reuse `RaceAnalogInput`, `RaceShellSnapshot`, `clampRaceAnalogVector()`, and `isRaceGameInput()` instead of adding parallel socket payload families.

---

### `packages/shared/src/lobby.ts` (config/model, request-response)

**Analog:** `packages/shared/src/lobby.ts`

**Imports pattern** (line 1):
```typescript
import type { DragSprintMode } from './game.js';
```

**Variant constants pattern** (lines 20-34):
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

**Apply to Phase 4:** Add `circleTrack: 'circle-track'` to `PARTY_GAME_VARIANTS` and return `true` for race `circleTrack` startability. Keep final lobby copy/card polish out of this phase.

---

### `apps/server/src/games/race/circleTrackRules.ts` (utility, transform)

**Analog:** `apps/server/src/games/race/sprintCircuit.ts`

**Imports pattern:** pure helpers in `sprintCircuit.ts` are local and only import shared types at file top. New circle rules should import only shared types/helpers needed for deterministic math.

**Constants and geometry data pattern** (lines 16-28, 49-67):
```typescript
const DEFAULT_COUNTDOWN_MS = 3_000;
const DEFAULT_LAPS = 3;
const DEFAULT_MAX_SPEED = 5.2;
const DEFAULT_ACCELERATION = 0.28;
const DEFAULT_BRAKE = 0.36;
const DEFAULT_DRAG = 0.05;

const TRACK_POINTS: TrackPoint[] = [
  { x: 112, y: 88 },
  { x: 286, y: 88 },
  // ...
];

const CHECKPOINT_MARKERS = [0.16, 0.32, 0.5, 0.66, 0.82, 0.96];
```

**Pure math/helper pattern** (lines 83-145):
```typescript
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sampleTrackPose(trackProgress: number, laneOffset: number) {
  const normalizedProgress = clamp(trackProgress, 0, 0.999999);
  const targetDistance = TRACK_TOTAL_LENGTH * normalizedProgress;
  let traversed = 0;

  for (const segment of TRACK_SEGMENTS) {
    // compute local progress, tangent, normal, x/y, angle
  }

  return sampleTrackPose(0, laneOffset);
}
```

**State projection pattern** (lines 147-176):
```typescript
function projectPlayerState(
  totalProgress: number,
  laneOffset: number,
  laps: number,
  previous: RacePlayerState,
): RacePlayerState {
  const normalizedProgress = clamp(totalProgress, 0, 1);
  const totalLapProgress = normalizedProgress * laps;
  const pose = sampleTrackPose(circuitProgress, laneOffset);

  return {
    ...previous,
    x: pose.x,
    y: pose.y,
    vx: pose.x - previous.x,
    vy: pose.y - previous.y,
    angle: pose.angle,
    lap: completedLaps,
    checkpoint,
    progress: normalizedProgress,
  };
}
```

**Apply to Phase 4:** Use this helper style but do not copy polyline/angle-only progress as the validation mechanism. Implement exported pure functions for circle pose integration, radial on/off-track classification, explicit gate crossing, checkpoint order, lap completion, wrong-way accumulation, and penalty grace windows.

---

### `apps/server/src/games/race/circleTrack.ts` (service/runtime, event-driven)

**Analog:** `apps/server/src/games/race/sprintCircuit.ts`

**Imports pattern** (lines 1-14):
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
```

**Runtime options pattern** (lines 42-47):
```typescript
export interface SprintCircuitRuntimeOptions extends RuntimeCallbacks<RaceSnapshot> {
  countdownMs?: number;
  laps?: number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}
```

**Initial authoritative session envelope pattern** (lines 258-277):
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

**Lifecycle and countdown pattern** (lines 279-318):
```typescript
const emitState = () => {
  options.onState?.(state);
  return state;
};

const activateRace = () => {
  state = {
    ...state,
    status: GAME_SESSION_STATUS.active,
    countdown: 0,
    state: {
      ...state.state,
      status: RACE_STATUS.racing,
      countdown: 0,
      startedAt: Date.now(),
    },
  };
  emitState();
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

**Input guard and state update pattern** (lines 336-350, 444-468):
```typescript
applyInput(playerId, input) {
  if (state.state.status !== RACE_STATUS.racing) {
    return state;
  }

  const playerIndex = state.state.playersState.findIndex((player) => player.playerId === playerId);

  if (playerIndex < 0) {
    return state;
  }

  // compute nextPlayers, finishTimes, allFinished
  state = {
    ...state,
    status: allFinished ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
    results: allFinished
      ? {
          rankings: buildRankings(nextPlayers, finishTimesMs),
          summary: {
            laps,
            track: 'sprint-circuit',
          },
        }
      : null,
  };

  emitState();

  if (allFinished) {
    emitFinished();
  }

  return state;
}
```

**Apply to Phase 4:** Keep the same factory shape, timer injection, `GameSessionEnvelope`, `onState`, `onFinished`, `removePlayer`, and `dispose()` lifecycle. Replace old discrete input parsing with `isRaceGameInput(input)`, `input.kind === 'analog'`, `input.modeId === 'circle'`, and `clampRaceAnalogVector(input.vector)`.

---

### `apps/server/src/games/race/circleTrackRules.test.ts` and `circleTrack.test.ts` (tests, transform/event-driven)

**Analog:** `apps/server/src/games/race/sprintCircuit.test.ts`

**Imports and fixture pattern** (lines 1-12):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_STATUS,
  PLAYER_CONNECTION_STATE,
  type LobbyState,
  type RaceSnapshot,
} from '@blitz/shared';

import { createSprintCircuitRuntime } from './sprintCircuit.js';
```

**Lobby fixture pattern** (lines 13-42):
```typescript
function createLobby(): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'sprint-circuit',
    status: LOBBY_STATUS.waiting,
    settings: {
      maxPlayers: 8,
      laps: 2,
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

**Runtime assertion pattern** (lines 44-65):
```typescript
test('advances players through checkpoints on a sprint circuit track', () => {
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

  assert.equal(nextSnapshot.trackId, 'sprint-circuit');
  assert.ok(nextSnapshot.playersState[0]!.progress > initialSnapshot.playersState[0]!.progress);
});
```

**Apply to Phase 4:** Use Node's built-in test runner, local fixtures, and direct runtime/helper calls. Add explicit tests for ordered gates, skipped gates, start/finish lap completion only after gates, off-track grace, wrong-way grace, slowdown/penalty, analog vector clamping, finish ranking, and result summary fields.

---

### `apps/server/src/games/registry.ts` (config/factory, request-response)

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

**Registry entry pattern** (lines 55-70):
```typescript
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
      return (
        entries.find((entry) => entry.game === game && entry.variant === variant) ??
        null
      );
    },
  };
}
```

**Apply to Phase 4:** Import `createCircleTrackRuntime` with `.js` extension and add a `race:circle-track` entry using the same callback forwarding pattern.

---

### `apps/web/src/game/circleTrackCanvas.ts` (utility, transform/render)

**Analog:** `apps/web/src/game/sprintCircuitTrack.ts`

**Exported geometry constants pattern** (lines 1-9):
```typescript
export interface TrackPoint {
  x: number;
  y: number;
}

export const SPRINT_CIRCUIT_SIZE = {
  width: 420,
  height: 560,
} as const;
```

**Canvas drawing pattern** (lines 38-60):
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

**Checkpoint marker pattern** (lines 92-107):
```typescript
context.fillStyle = '#00aadd';
SPRINT_CIRCUIT_CHECKPOINTS.forEach((point, index) => {
  context.fillRect(point.x - 5, point.y - 5, 10, 10);
  context.fillStyle = '#ddeeff';
  context.font = '7px "Press Start 2P", monospace';
  context.fillText(String(index + 1), point.x + 8, point.y - 8);
  context.fillStyle = '#00aadd';
});

context.strokeStyle = '#ff3333';
context.lineWidth = 6;
context.beginPath();
context.moveTo(96, 78);
context.lineTo(128, 102);
context.stroke();
```

**Apply to Phase 4:** Create a circle/oval canvas helper with exported size/config and a drawing function that receives server snapshot/course state. Draw inner/outer boundaries, center guide, clockwise arrows, `Start`, gates `1`-`4`, accent next gate, warning/destructive course state, and car poses from snapshot data.

---

### `apps/web/src/pages/CircleTrackPage.tsx` (component/page, event-driven)

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
import { GameEmptyState, GameErrorState } from '../components/game/GameStates';
import { GameViewport } from '../components/game/GameViewport';
import { useGameControls } from '../components/game/useGameControls';
import { useLiveRaceSocket } from '../lib/useLiveRaceSocket';
```

**Snapshot-to-HUD adapter pattern** (lines 52-116):
```typescript
function createShellSnapshot(
  snapshot: RaceSnapshot | null,
  fallbackSessionId: string,
  fallbackLobbyCode: string,
  fallbackCountdown: number | null,
  inputLabel: string,
): RaceShellSnapshot | null {
  if (!snapshot) {
    if (fallbackCountdown === null) {
      return null;
    }

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

**Generic controls and session wiring pattern** (lines 118-156):
```typescript
export function SprintCircuitPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialState = (location.state as SessionStartedPayload | null) ?? null;
  const [countdown, setCountdown] = useState<number | null>(initialState?.countdown ?? null);
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
}
```

**Finish navigation pattern** (lines 185-196):
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

**Canvas render pattern with jsdom guard** (lines 198-240):
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
  snapshot.playersState.forEach((entrant, index) => {
    context.save();
    context.translate(entrant.x, entrant.y);
    context.rotate(entrant.angle);
    // draw car
    context.restore();
  });
}, [snapshot]);
```

**Fullscreen shell composition pattern** (lines 242-303):
```typescript
return (
  <FullscreenGameShell
    hud={<GameHud snapshot={shellSnapshot} fallbackSessionId={sessionId} />}
    viewport={
      <GameViewport label="Sprint circuit track">
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
    controls={
      <div className="game-control-zone game-control-zone--left">
        <span className="game-control-zone__label">STEER</span>
        <AnalogPad
          label="STEER"
          value={analog}
          disabled={!controlsEnabled}
          onVectorChange={setAnalogVector}
        />
      </div>
    }
    stateOverlay={!isConnected ? <GameErrorState /> : shellSnapshot ? null : <GameEmptyState />}
  />
);
```

**Apply to Phase 4:** Prefer `useGameSessionSocket()` over `useLiveRaceSocket()` for the new page. Keep the fullscreen shell, `GameHud`, `GameViewport`, `AnalogPad`, countdown fallback, finish storage/navigation, input reset, canvas jsdom guard, and no normal app chrome/card layout.

---

### `apps/web/src/components/game/useGameControls.ts` and `AnalogPad.tsx` (shared control patterns)

**Analogs:** `apps/web/src/components/game/useGameControls.ts`, `apps/web/src/components/game/AnalogPad.tsx`

**Keyboard analog normalization** (`useGameControls.ts` lines 71-91):
```typescript
export function combineKeyboardVector(keys: Set<string>): RaceAnalogVector {
  const rawX = normalizeKeyboardAxis(
    keySetHasAny(keys, LEFT_KEYS),
    keySetHasAny(keys, RIGHT_KEYS),
  );
  const rawY = normalizeKeyboardAxis(keySetHasAny(keys, UP_KEYS), keySetHasAny(keys, DOWN_KEYS));
  const rawMagnitude = Math.hypot(rawX, rawY);

  if (rawMagnitude === 0) {
    return createNeutralAnalogVector();
  }

  const magnitude = Math.min(rawMagnitude, 1);
  const divisor = rawMagnitude > 1 ? rawMagnitude : 1;

  return clampRaceAnalogVector({
    x: rawX / divisor,
    y: rawY / divisor,
    magnitude,
  });
}
```

**Sequenced input emission** (`useGameControls.ts` lines 118-140):
```typescript
const emitInput = useCallback((input: RaceInputDraft) => {
  if (!enabledRef.current) {
    return;
  }

  sequenceRef.current += 1;
  onInputRef.current({
    ...input,
    modeId: modeIdRef.current,
    sequence: sequenceRef.current,
    clientTimeMs: Date.now(),
  } as RaceGameInput);
}, []);

const setAnalogVector = useCallback(
  (vector: RaceAnalogVector) => {
    const next = clampRaceAnalogVector(vector);
    analogRef.current = next;
    setState((current) => ({ ...current, analog: next }));
    emitInput({ kind: 'analog', vector: next });
  },
  [emitInput],
);
```

**Reset lifecycle** (`useGameControls.ts` lines 172-207, 263-280):
```typescript
const resetInput = useCallback(() => {
  pressedKeysRef.current.clear();
  const shouldResetAnalog = !isNeutralAnalogVector(analogRef.current);
  analogRef.current = createNeutralAnalogVector();
  setState({
    analog: createNeutralAnalogVector(),
    primaryPressed: false,
    secondaryPressed: false,
  });

  if (shouldResetAnalog) {
    emitInput({ kind: 'analog', vector: createNeutralAnalogVector() });
  }
}, [emitInput]);

window.addEventListener('blur', resetInput);
document.addEventListener('visibilitychange', handleVisibilityChange);
return () => {
  window.removeEventListener('blur', resetInput);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  resetInput();
};
```

**Pointer analog pattern** (`AnalogPad.tsx` lines 17-31, 58-87):
```typescript
function calculateAnalogVector(element: HTMLElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);
  const rawX = (clientX - centerX) / radius;
  const rawY = (clientY - centerY) / radius;
  const distance = Math.hypot(rawX, rawY);

  return clampRaceAnalogVector({
    x: rawX / divisor,
    y: rawY / divisor,
    magnitude: Math.min(distance, 1),
  });
}

const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
  event.preventDefault();
  activePointerIdRef.current = event.pointerId;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  onVectorChange(calculateAnalogVector(event.currentTarget, event.clientX, event.clientY));
};
```

**Apply to Phase 4:** Consume these existing primitives from `CircleTrackPage`; do not redefine analog pad or keyboard fallback unless the current files change before planning.

---

### `apps/web/src/lib/sessionRoutes.ts` (route utility, request-response)

**Analog:** `apps/web/src/lib/sessionRoutes.ts`

**Current resolver pattern** (lines 1-13):
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

**Apply to Phase 4:** Add a specific branch for `payload.game === 'race' && payload.variant === 'circle-track'` returning the new fullscreen circle route. Keep old fallback for existing sprint route until Phase 6 cleanup.

---

### `apps/web/src/app/router.tsx` (route config, request-response)

**Analog:** `apps/web/src/app/router.tsx`

**Import page pattern** (lines 1-13):
```typescript
import { Link, NavLink, Outlet, createBrowserRouter, createMemoryRouter } from 'react-router-dom';

import { ResultsPage } from '../pages/ResultsPage';
import { SprintCircuitPage } from '../pages/SprintCircuitPage';
```

**Fullscreen route outside app chrome** (lines 48-113):
```typescript
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
          path: '/results/:sessionId',
          element: <ResultsPage />,
        },
      ],
    },
    {
      path: '/race/live/:sessionId',
      element: <SprintCircuitPage />,
    },
  ];
}
```

**Testable router factory** (lines 116-126):
```typescript
export function createAppRouter(options: AppRouterOptions = {}) {
  const routes = buildRoutes();

  if (options.initialEntries) {
    return createMemoryRouter(routes, {
      initialEntries: options.initialEntries,
    });
  }

  return createBrowserRouter(routes);
}
```

**Apply to Phase 4:** Import `CircleTrackPage` and add its route as a top-level sibling outside `AppLayout`, matching `/race/live/:sessionId`.

---

### `apps/web/src/pages/ResultsPage.tsx` (component/page, request-response)

**Analog:** `apps/web/src/pages/ResultsPage.tsx`

**Imports pattern** (lines 1-7):
```typescript
import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import type { RaceFinishedPayload, SessionFinishedPayload } from '@blitz/shared';

import { resolveSessionRoute } from '../lib/sessionRoutes';
import { usePostGameActions } from '../lib/usePostGameActions';
```

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

**Stored/session payload and rematch routing pattern** (lines 58-92):
```typescript
export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const locationPayload =
    (location.state as SessionFinishedPayload | RaceFinishedPayload | null) ?? null;
  const storedPayload = window.sessionStorage.getItem(`blitz-results:${sessionId}`);
  const payload = normalizePayload(
    locationPayload ??
      (storedPayload
        ? (JSON.parse(storedPayload) as SessionFinishedPayload | RaceFinishedPayload)
        : null),
  );

  useEffect(() => {
    if (!sessionStarted) {
      return;
    }

    navigate(resolveSessionRoute(sessionStarted), {
      replace: true,
      state: sessionStarted,
    });
  }, [navigate, sessionStarted]);
}
```

**Rank rendering pattern** (lines 103-115):
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

**Apply to Phase 4:** Add generic summary rendering for `payload.results.summary` so circle results can show `Circle Track`, `Time`, `Laps`, and `Penalties`. Preserve `sessionStorage`, post-game actions, rematch routing, and legacy race payload normalization.

---

### `packages/shared/src/contracts.test.ts` (test, transform/request-response)

**Analog:** `packages/shared/src/contracts.test.ts`

**Shared import pattern** (lines 1-17):
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

**Startability assertion pattern** (lines 127-149):
```typescript
test('exports the current lobby selection startability policy', () => {
  assert.equal(isLobbySelectionStartable('lights', null), true);
  assert.equal(isLobbySelectionStartable('penalty', null), true);
  assert.equal(isLobbySelectionStartable('race', 'sprint-circuit'), true);
  assert.equal(isLobbySelectionStartable('race', null), false);
});
```

**Discriminated input contract test** (lines 361-418):
```typescript
test('exports discriminated race game input contract shapes', () => {
  const circleMode: RaceShellModeId = 'circle';
  const analogInput: RaceGameInput = {
    kind: 'analog',
    sequence: 1,
    clientTimeMs: 1_713_980_000_123,
    modeId: circleMode,
    vector: {
      x: 0.5,
      y: -0.25,
      magnitude: 0.56,
    },
  };

  assert.equal(analogInput.kind, 'analog');
  assert.equal(analogInput.modeId, 'circle');
  assert.equal('playerId' in analogInput, false);
});
```

**Guard/clamp test pattern** (lines 461-551):
```typescript
test('exports race input guard and analog clamp helpers', () => {
  assert.deepEqual(
    clampRaceAnalogVector({
      x: 1.2345,
      y: Number.POSITIVE_INFINITY,
      magnitude: -0.2,
    }),
    {
      x: 1,
      y: 0,
      magnitude: 0,
    },
  );

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
});
```

**Apply to Phase 4:** Add assertions for `PARTY_GAME_VARIANTS.circleTrack`, `isLobbySelectionStartable('race', PARTY_GAME_VARIANTS.circleTrack)`, and any new circle snapshot/player/course types.

---

### `apps/web/src/pages/CircleTrackPage.test.tsx` and `circleTrackCanvas.test.ts` (tests, event-driven/render)

**Analogs:** `apps/web/src/pages/SprintCircuitPage.test.tsx`, `apps/web/src/components/game/useGameControls.test.tsx`

**Vitest page mocking pattern** (`SprintCircuitPage.test.tsx` lines 1-38):
```typescript
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockNavigate, mockSubmitInput, mockUseLiveRaceSocket, mockUsePostGameActions } =
  vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockSubmitInput: vi.fn(),
    mockUseLiveRaceSocket: vi.fn(),
    mockUsePostGameActions: vi.fn(),
  }));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
```

**Fullscreen/no-chrome assertion pattern** (`SprintCircuitPage.test.tsx` lines 143-191):
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

**Input emission assertion pattern** (`SprintCircuitPage.test.tsx` lines 216-230):
```typescript
test('emits shared typed race input from route controls', () => {
  renderRoute('/race/live/session-1');

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
});
```

**Keyboard fallback test pattern** (`useGameControls.test.tsx` lines 32-72):
```typescript
test('maps keyboard fallback to race game inputs', () => {
  const inputs: RaceGameInput[] = [];

  renderHook(() =>
    useGameControls({
      modeId: 'circle',
      onInput: (input) => inputs.push(input),
    }),
  );

  act(() => keyDown('ArrowLeft'));
  expect(latestInput(inputs)).toMatchObject({
    kind: 'analog',
    modeId: 'circle',
    vector: { x: -1, y: 0, magnitude: 1 },
  });
});
```

**Apply to Phase 4:** Mock `useGameSessionSocket` for the new circle page. Assert fullscreen shell, circle copy (`Complete 3 laps clockwise`, `Gate 2/4`, `Clockwise`, `On course`), analog control availability, no app chrome/card layout, result storage/navigation, and analog input emission. For canvas helper tests, prefer pure helper output checks or a minimal mocked canvas context.

---

### `apps/web/src/styles.css` (config/style, responsive layout)

**Analog:** `apps/web/src/styles.css`

**Fullscreen shell CSS pattern** (lines 582-596):
```css
.game-shell {
  position: fixed;
  inset: 0;
  width: 100vw;
  min-height: 100dvh;
  overflow: hidden;
  background: #06060d;
  color: #ddeeff;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
  font-size: 16px;
  letter-spacing: 0;
}
```

**Control dock and viewport pattern** (lines 636-671):
```css
.game-shell__controls {
  position: fixed;
  left: max(16px, env(safe-area-inset-left));
  right: max(16px, env(safe-area-inset-right));
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(144px, max-content) minmax(144px, max-content);
  justify-content: space-between;
  align-items: end;
  gap: 32px;
  pointer-events: none;
}

.game-viewport {
  width: min(100%, 1040px);
  max-height: calc(100dvh - 232px);
  display: grid;
  overflow: hidden;
  border: 2px solid #273448;
  background: #0f0f1e;
}
```

**HUD readable text pattern** (lines 687-736):
```css
.game-hud {
  display: grid;
  gap: 8px;
  color: #ddeeff;
  font-size: 16px;
}

.game-hud__item dt {
  margin: 0 0 4px;
  color: #00aadd;
  font-size: 12px;
  line-height: 1.3;
  text-transform: uppercase;
}

.game-hud__live {
  min-height: 20px;
  color: #33ff66;
  font-size: 12px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
```

**Analog/focus/mobile pattern** (lines 764-859):
```css
.game-analog-pad {
  position: relative;
  min-width: 144px;
  min-height: 144px;
  display: grid;
  place-items: center;
  border: 2px solid #00aadd;
  border-radius: 50%;
  background: #0f0f1e;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.game-action-button:focus-visible,
.game-analog-pad:focus-visible,
.game-shell__back:focus-visible {
  outline: 3px solid #ffd700;
  outline-offset: 4px;
}

@media (orientation: portrait) {
  .game-shell__controls {
    grid-template-columns: minmax(128px, max-content) minmax(128px, max-content);
    gap: 16px;
  }

  .game-analog-pad {
    min-width: 128px;
    min-height: 128px;
  }
}
```

**Apply to Phase 4:** Extend existing fullscreen classes for circle-specific canvas/roster/status only where needed. Keep spacing in 4px multiples, no app chrome, no `.panel`/`.card` active route layout, readable 12px+ HUD text, safe areas, fixed analog pad sizes, and focus-visible rings.

## Shared Patterns

### Generic Session Event Family

**Source:** `packages/shared/src/contracts.ts` and `apps/web/src/lib/useGameSessionSocket.ts`
**Apply to:** `CircleTrackPage`, `circleTrack.ts`, registry/socket integration.

```typescript
// packages/shared/src/contracts.ts lines 9-20, 24-30
export const SOCKET_EVENTS = {
  client: {
    gameInput: 'client:game-input',
  },
  server: {
    sessionStarted: 'server:session-started',
    sessionState: 'server:session-state',
    sessionFinished: 'server:session-finished',
  },
} as const;

// apps/web/src/lib/useGameSessionSocket.ts lines 60-78
socket.on(SOCKET_EVENTS.server.sessionState, handleSessionState);
socket.on(SOCKET_EVENTS.server.sessionFinished, handleSessionFinished);
socket.emit(SOCKET_EVENTS.client.gameInput, payload);
```

### Authoritative Runtime Lifecycle

**Source:** `apps/server/src/games/runtime.ts`, `apps/server/src/games/manager.ts`
**Apply to:** `circleTrack.ts`.

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

### Results Summary Shape

**Source:** `packages/shared/src/contracts.ts`, `apps/server/src/games/race/sprintCircuit.ts`, `apps/web/src/pages/ResultsPage.tsx`
**Apply to:** `circleTrack.ts`, `ResultsPage.tsx`, `ResultsPage.test.tsx`.

```typescript
// packages/shared/src/contracts.ts lines 101-104
export interface GameResults {
  rankings: GameResultEntry[];
  summary?: Record<string, string | number | boolean | null>;
}

// apps/server/src/games/race/sprintCircuit.ts lines 453-460
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

### Fullscreen Gameplay Route

**Source:** `apps/web/src/app/router.tsx`, `apps/web/src/components/game/FullscreenGameShell.tsx`
**Apply to:** `CircleTrackPage.tsx`, router, route tests.

```typescript
// apps/web/src/app/router.tsx lines 109-112
{
  path: '/race/live/:sessionId',
  element: <SprintCircuitPage />,
}

// apps/web/src/components/game/FullscreenGameShell.tsx lines 20-31
return (
  <section className="game-shell" aria-label="Fullscreen race session">
    <div className="game-shell__hud">{hud}</div>
    <div className="game-shell__viewport">{viewport}</div>
    <div className="game-shell__controls">{controls}</div>
    {stateOverlay ? <div className="game-shell__state">{stateOverlay}</div> : null}
  </section>
);
```

### Test Style

**Source:** `packages/shared/src/contracts.test.ts`, `apps/web/src/pages/SprintCircuitPage.test.tsx`
**Apply to:** all Phase 4 tests.

```typescript
// Node/shared/server tests use node:test.
import assert from 'node:assert/strict';
import test from 'node:test';

// Web tests use Vitest + Testing Library.
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
```

## No Analog Found

All inferred Phase 4 files have at least a usable analog. The weakest match is `circleTrackRules.ts`: no standalone pure race-rules module exists yet, so planner should use the embedded geometry/runtime helpers in `sprintCircuit.ts` only as a partial source and prefer the Phase 4 research guidance for explicit gate validation.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | All files have exact, role-match, or partial analogs. |

## Metadata

**Analog search scope:** `packages/shared/src`, `apps/server/src/games`, `apps/web/src/components/game`, `apps/web/src/game`, `apps/web/src/lib`, `apps/web/src/app`, `apps/web/src/pages`, `apps/web/src/styles.css`
**Files scanned:** 54 source/test/style files in source-of-truth directories
**Pattern extraction date:** 2026-04-25
**Project instruction checks:** No root `CLAUDE.md`; no repo-local `.claude/skills` or `.agents/skills`; source of truth kept to `apps/**/src` and `packages/shared/src`.
