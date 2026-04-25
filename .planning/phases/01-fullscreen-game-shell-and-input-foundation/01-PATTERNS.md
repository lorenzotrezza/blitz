# Phase 1: Fullscreen Game Shell And Input Foundation - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 20
**Analogs found:** 20 / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/shared/src/game.ts` | model/contract | event-driven | `packages/shared/src/game.ts` | exact |
| `packages/shared/src/contracts.test.ts` | test | transform/event-driven | `packages/shared/src/contracts.test.ts` | exact |
| `packages/shared/src/index.ts` | config/barrel | transform | `packages/shared/src/index.ts` | exact |
| `apps/web/src/components/game/FullscreenGameShell.tsx` | component | request-response | `apps/web/src/pages/SprintCircuitPage.tsx` + `apps/web/src/styles.css` | role-match |
| `apps/web/src/components/game/FullscreenGameShell.test.tsx` | test | request-response | `apps/web/src/pages/SprintCircuitPage.test.tsx` | role-match |
| `apps/web/src/components/game/GameViewport.tsx` | component | request-response/canvas | `apps/web/src/pages/SprintCircuitPage.tsx` | role-match |
| `apps/web/src/components/game/GameHud.tsx` | component | request-response | `apps/web/src/pages/SprintCircuitPage.tsx` + `apps/web/src/pages/LightsSessionPage.tsx` | role-match |
| `apps/web/src/components/game/GameHud.test.tsx` | test | request-response | `apps/web/src/pages/LightsSessionPage.test.tsx` | role-match |
| `apps/web/src/components/game/AnalogPad.tsx` | component | event-driven | `apps/web/src/components/RetroRaceView.tsx` | partial |
| `apps/web/src/components/game/AnalogPad.test.tsx` | test | event-driven | `apps/web/src/pages/LobbyPage.test.tsx` | partial |
| `apps/web/src/components/game/ActionButton.tsx` | component | event-driven | `apps/web/src/components/RetroRaceView.tsx` | role-match |
| `apps/web/src/components/game/ActionButton.test.tsx` | test | event-driven | `apps/web/src/pages/LobbyPage.test.tsx` | partial |
| `apps/web/src/components/game/GameStates.tsx` | component | request-response | `apps/web/src/pages/LightsSessionPage.tsx` | role-match |
| `apps/web/src/components/game/useGameControls.ts` | hook | event-driven | `apps/web/src/lib/useLiveRaceSocket.ts` + `apps/web/src/game/useRetroRace.ts` | role-match |
| `apps/web/src/components/game/useGameControls.test.tsx` | test | event-driven | `apps/web/src/lib/useLobbySocket.test.ts` | role-match |
| `apps/web/src/pages/SprintCircuitPage.tsx` | page | event-driven/request-response | `apps/web/src/pages/SprintCircuitPage.tsx` | exact |
| `apps/web/src/pages/SprintCircuitPage.test.tsx` | test | request-response | `apps/web/src/pages/SprintCircuitPage.test.tsx` | exact |
| `apps/web/src/app/router.tsx` | route | request-response | `apps/web/src/app/router.tsx` | exact |
| `apps/web/src/app/router.test.tsx` | test | request-response | `apps/web/src/app/router.test.tsx` | exact |
| `apps/web/src/styles.css` | config/style | request-response | `apps/web/src/styles.css` | exact |

## Pattern Assignments

### `packages/shared/src/game.ts` (model/contract, event-driven)

**Analog:** `packages/shared/src/game.ts`

**Imports pattern:** no imports; this file currently keeps pure shared type/value definitions.

**Existing status and snapshot pattern** (lines 1-43):
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

**Existing input pattern to replace/extend** (lines 106-111):
```typescript
export interface PlayerInput {
  tick: number;
  steer: SteeringInput;
  accelerate: boolean;
  brake: boolean;
}
```

**Apply:** Add Phase 1 discriminated race-shell input and snapshot types here. Keep them pure TypeScript exports with no runtime dependency. Include `kind`, `sequence`, `clientTimeMs`, normalized analog vector, button press state, action events, common HUD fields, and a mode-detail extension point.

---

### `packages/shared/src/contracts.test.ts` (test, transform/event-driven)

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

**Shape test pattern** (lines 143-193):
```typescript
test('exports the expected race snapshot shape', () => {
  const snapshot: RaceSnapshot = {
    sessionId: 'session-1',
    lobbyCode: lobby.code,
    trackId: lobby.settings.trackId ?? 'track-oval',
    status: RACE_STATUS.racing,
    tick: 12,
    startedAt: 1_713_980_000_000,
    countdown: 0,
    playersState: [playerState],
    botsState: [botState],
  };

  assert.equal(snapshot.playersState[0]?.playerId, host.id);
  assert.equal(snapshot.botsState[0]?.botId, 'bot-1');
});
```

**Input packet test pattern** (lines 339-351):
```typescript
test('exports the expected player input packet shape without client identity', () => {
  const input: PlayerInput = {
    tick: 13,
    steer: 1,
    accelerate: true,
    brake: false,
  };

  assert.equal('playerId' in input, false);
  assert.equal(input.steer, 1);
});
```

**Apply:** Extend imports from `./index.js`, then add tests for sample `RaceGameInput` union members and `RaceShellSnapshot`. Assert the client input shape has no `playerId` and that discriminants/numeric fields are present.

---

### `packages/shared/src/index.ts` (config/barrel, transform)

**Analog:** `packages/shared/src/index.ts`

**Barrel export pattern** (lines 1-5):
```typescript
export const sharedBootstrap = 'blitz-shared-bootstrap';

export * from './contracts.js';
export * from './game.js';
export * from './lobby.js';
```

**Apply:** If new types stay in `game.ts`, no export change is needed. If a new adjacent shared file is introduced, export it from here using the same `.js` extension style.

---

### `apps/web/src/components/game/FullscreenGameShell.tsx` (component, request-response)

**Analog:** `apps/web/src/pages/SprintCircuitPage.tsx` and `apps/web/src/styles.css`

**Route component import pattern** (SprintCircuitPage lines 1-8):
```typescript
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { RACE_STATUS, type SessionFinishedPayload, type SessionStartedPayload } from '@blitz/shared';

import { drawSprintCircuitTrack, SPRINT_CIRCUIT_SIZE } from '../game/sprintCircuitTrack';
import { useLiveRaceSocket } from '../lib/useLiveRaceSocket';
```

**Current page-shell anti-pattern to avoid** (SprintCircuitPage lines 95-102):
```tsx
return (
  <section className="panel live-panel">
    <p className="eyebrow">Realtime Session</p>
    <h1>Sprint Circuit</h1>
    <p className="lede">
      Pista vera, checkpoint leggibili, giri completi e collisioni soft.
    </p>
```

**Existing chrome CSS to bypass for gameplay** (styles lines 81-85, 111-123, 172-184):
```css
.app-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 5;
}

.viewport {
  width: min(1120px, calc(100vw - 2rem));
  margin: 0 auto;
  padding: 2rem 0 3rem;
}

.panel {
  position: relative;
  padding: clamp(1.4rem, 3vw, 2.4rem);
}
```

**Apply:** Build a component that renders a fixed fullscreen gameplay surface and explicitly avoids `.panel`, `.card`, `.viewport`, `.topbar`, `.scanlines`, and `.shell-glow`. Use class names dedicated to gameplay.

---

### `apps/web/src/components/game/GameViewport.tsx` (component, request-response/canvas)

**Analog:** `apps/web/src/pages/SprintCircuitPage.tsx`

**Canvas ref and jsdom guard pattern** (lines 51-74):
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

**Canvas markup pattern** (lines 130-138):
```tsx
<div className="race-canvas-wrap live-canvas-wrap">
  <canvas
    ref={canvasRef}
    className="race-canvas-native"
    width={SPRINT_CIRCUIT_SIZE.width}
    height={SPRINT_CIRCUIT_SIZE.height}
    aria-label="Sprint circuit canvas"
  />
</div>
```

**Apply:** Keep canvas drawing guarded for jsdom tests. `GameViewport` should accept children or a render callback/track slot and keep a stable aspect-ratio container so snapshot arrival does not shift layout.

---

### `apps/web/src/components/game/GameHud.tsx` (component, request-response)

**Analog:** `apps/web/src/pages/SprintCircuitPage.tsx` and `apps/web/src/pages/LightsSessionPage.tsx`

**Existing race HUD text pattern** (SprintCircuitPage lines 111-128):
```tsx
<div className="retro-hud">
  <div className="retro-hud-box">
    <span className="retro-hud-label">SESSIONE</span>
    <strong>{sessionId}</strong>
  </div>
  <div className="retro-hud-box">
    <span className="retro-hud-label">TRACK</span>
    <strong>{snapshot?.trackId ?? 'sprint-circuit'}</strong>
  </div>
  <div className="retro-hud-box">
    <span className="retro-hud-label">TICK</span>
    <strong>{snapshot?.tick ?? 0}</strong>
  </div>
</div>
```

**Session status copy pattern** (LightsSessionPage lines 32-50):
```typescript
function phaseCopy(phase: LightsSessionView['phase']) {
  if (phase === 'armed') {
    return 'Tieni il sangue freddo';
  }

  if (phase === 'go') {
    return 'GO';
  }

  return 'Countdown';
}
```

**Apply:** Keep HUD fields React-rendered, not canvas-only. Add `aria-live="polite"` around countdown/status/penalty/finish text, but do not pipe every tick into live text.

---

### `apps/web/src/components/game/AnalogPad.tsx` (component, event-driven)

**Analog:** `apps/web/src/components/RetroRaceView.tsx`

**Existing clamp helper pattern** (lines 12-14):
```typescript
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
```

**Existing touch/mouse control pattern to improve** (lines 112-151):
```tsx
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

**Apply:** Use the clamp helper style, but implement Pointer Events instead of separate mouse/touch handlers. Use `setPointerCapture`, `pointermove`, `pointerup`, `pointercancel`, and `lostpointercapture`; output `{ x, y, magnitude }` clamped to `-1..1` / `0..1`. Add `touch-action: none` in CSS.

---

### `apps/web/src/components/game/ActionButton.tsx` (component, event-driven)

**Analog:** `apps/web/src/components/RetroRaceView.tsx`

**Existing press/release button pattern** (lines 126-138):
```tsx
<button
  className="btn btn-red"
  onMouseDown={() => setBrake(true)}
  onMouseUp={() => setBrake(false)}
  onMouseLeave={() => setBrake(false)}
  onTouchStart={(event) => {
    event.preventDefault();
    setBrake(true);
  }}
  onTouchEnd={() => setBrake(false)}
>
  ■ FRENO
</button>
```

**Apply:** Preserve the press/release semantics, but replace duplicated mouse/touch handlers with pointer and keyboard handlers. Support disabled, pressed, released/cancelled, Space/Enter activation for primary, and Shift/Control for secondary through `useGameControls`.

---

### `apps/web/src/components/game/GameStates.tsx` (component, request-response)

**Analog:** `apps/web/src/pages/LightsSessionPage.tsx`

**Fallback/session-state copy pattern** (lines 133-170):
```tsx
<article className="card live-card">
  <h2>Round {state ? `${state.round} / ${state.totalRounds}` : '1 / 3'}</h2>
  <p className="lobby-meta">
    {state
      ? phaseCopy(state.phase)
      : `Countdown ${initialPayload?.countdown ?? 3}`}
  </p>
  <button className="button button-primary" type="button" disabled={!canReact}>
    Reagisci
  </button>
  <p className="lobby-meta">
    {myPlayer?.status === 'reacted'
      ? `${myPlayer.lastReactionMs} ms registrati`
      : 'Aspetta il momento giusto'}
  </p>
</article>
```

**Apply:** Use UI-SPEC copy exactly for Phase 1: empty heading `Waiting for race`, body `No live snapshot yet. Keep this screen open; the countdown appears when the server starts the session.`, and error `Connection lost. Rejoin from the lobby or refresh this session.` Do not style these as normal cards inside the active gameplay shell.

---

### `apps/web/src/components/game/useGameControls.ts` (hook, event-driven)

**Analog:** `apps/web/src/lib/useLiveRaceSocket.ts` and `apps/web/src/game/useRetroRace.ts`

**Keyboard listener pattern** (useLiveRaceSocket lines 61-81):
```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') setSteer(-1);
    if (event.key === 'ArrowRight') setSteer(1);
    if (event.key === 'ArrowDown') setBrake(true);
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') setSteer((current) => (current === -1 ? 0 : current));
    if (event.key === 'ArrowRight') setSteer((current) => (current === 1 ? 0 : current));
    if (event.key === 'ArrowDown') setBrake(false);
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);
```

**Input emission pattern** (useLiveRaceSocket lines 83-101):
```typescript
useEffect(() => {
  const timer = window.setInterval(() => {
    if (!snapshot || snapshot.status !== RACE_STATUS.racing) {
      return;
    }

    tickRef.current += 1;
    socket.emit(SOCKET_EVENTS.client.gameInput, {
      tick: tickRef.current,
      steer,
      accelerate: !braking,
      brake: braking,
    });
  }, 50);

  return () => {
    window.clearInterval(timer);
  };
}, [braking, snapshot, socket, steer]);
```

**Pure rule helper pattern** (useRetroRace lines 65-112):
```typescript
export function advanceRaceState(
  state: RetroRaceState,
  input: RetroRaceInput,
): RetroRaceState {
  const accelRate = input.accelerate ? input.deltaMs * 0.0045 : 0;
  const brakeRate = input.brake ? input.deltaMs * 0.007 : 0;
  const nextSpeed = clamp(state.player.speed + accelRate - brakeRate, 0.9, maxSpeed);

  return {
    ...state,
    player: {
      ...state.player,
      speed: nextSpeed,
    },
  };
}
```

**Apply:** Centralize keyboard, blur, visibility, pointer cancel, and unmount reset here. Emit typed `RaceGameInput` intents with monotonically increasing sequence and `clientTimeMs`. Keep helper functions deterministic and testable.

---

### `apps/web/src/pages/SprintCircuitPage.tsx` (page, event-driven/request-response)

**Analog:** `apps/web/src/pages/SprintCircuitPage.tsx`

**Session route state and socket pattern** (lines 9-17):
```typescript
export function SprintCircuitPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialState = (location.state as SessionStartedPayload | null) ?? null;
  const [countdown, setCountdown] = useState<number | null>(initialState?.countdown ?? null);
  const { snapshot, finished, steer, braking, setSteer, setBrake } = useLiveRaceSocket(sessionId);
```

**Finish navigation pattern** (lines 39-49):
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
}, [finished, navigate]);
```

**Apply:** Make this page a consumer of the new fullscreen shell and controls. Keep finish navigation/sessionStorage behavior. Replace local old card/control layout with `FullscreenGameShell`, `GameViewport`, `GameHud`, `AnalogPad`, and `ActionButton`.

---

### `apps/web/src/app/router.tsx` (route, request-response)

**Analog:** `apps/web/src/app/router.tsx`

**Layout-wrapped route pattern** (lines 26-46):
```tsx
function AppLayout() {
  return (
    <div className="app-shell">
      <div className="scanlines" aria-hidden="true" />
      <div className="shell-glow" aria-hidden="true" />
      <header className="topbar">
        ...
      </header>
      <main className="viewport">
        <Outlet />
      </main>
    </div>
  );
}
```

**Current live route location** (lines 48-113):
```tsx
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
          path: '/race/live/:sessionId',
          element: <SprintCircuitPage />,
        },
      ],
    },
  ];
}
```

**Apply:** Move `/race/live/:sessionId` outside the `AppLayout` branch or introduce a layout branch without normal chrome. Keep `createMemoryRouter` support unchanged for tests.

---

### `apps/web/src/styles.css` (config/style, request-response)

**Analog:** `apps/web/src/styles.css`

**Theme token pattern** (lines 1-17):
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

**Canvas/control style pattern to replace or extend** (lines 474-499):
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

.race-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1rem;
}
```

**Apply:** Add fullscreen gameplay CSS using `position: fixed`, `inset: 0`, `width: 100vw`, `min-height: 100dvh`, `overflow: hidden`, safe-area `env()` padding, and `touch-action: none` on control surfaces. Use UI-SPEC font sizes exactly for gameplay classes: 12px label, 16px body, 20px heading, 28px display. Do not reuse tiny `.retro-hud-label` / `.lobby-meta` sizes for critical gameplay status.

---

## Test Pattern Assignments

### Component and Route Tests

**Analog:** `apps/web/src/pages/SprintCircuitPage.test.tsx`

**Router render and hook mock pattern** (lines 1-22):
```typescript
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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

**Snapshot fixture pattern** (lines 24-64):
```typescript
function createSnapshot(): RaceSnapshot {
  return {
    sessionId: 'session-1',
    lobbyCode: 'ABCD12',
    trackId: 'sprint-circuit',
    status: RACE_STATUS.racing,
    tick: 12,
    startedAt: 1_713_980_000_000,
    countdown: 0,
    playersState: [
      {
        playerId: 'socket-host',
        nickname: 'Blitz',
        lap: 1,
        checkpoint: 2,
        progress: 0.54,
        penalties: 0,
        speed: 3.8,
      },
    ],
    botsState: [],
  };
}
```

**Apply to:** `FullscreenGameShell.test.tsx`, `GameViewport` coverage inside shell tests, `GameHud.test.tsx`, `SprintCircuitPage.test.tsx`, and `router.test.tsx`. Assert the fullscreen route does not render `.panel`, `.card`, `.viewport`, `.topbar`, or normal chrome.

### Hook Tests

**Analog:** `apps/web/src/lib/useLobbySocket.test.ts`

**renderHook/act pattern** (lines 1-20, 77-96):
```typescript
import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { mockGetBlitzSocket } = vi.hoisted(() => ({
  mockGetBlitzSocket: vi.fn(),
}));

vi.mock('./socket', () => ({
  getBlitzSocket: mockGetBlitzSocket,
}));

test('host updateSettings emits client:update-lobby-settings with lobby code and typed race mode', () => {
  const { result } = renderHook(() => useLobbySocket('abcd12'));

  act(() => {
    result.current.updateSettings({
      raceMode: LOBBY_RACE_MODES.bestOf3,
    });
  });

  expect(socket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.client.updateLobbySettings, {
    code: 'ABCD12',
    settings: {
      raceMode: LOBBY_RACE_MODES.bestOf3,
    },
  });
});
```

**Apply to:** `useGameControls.test.tsx`. Use `renderHook` and `act` for keyboard events, blur, visibility reset, unmount reset, and emitted typed input sequence assertions.

### Interaction Tests

**Analog:** `apps/web/src/pages/LobbyPage.test.tsx`

**fireEvent pattern** (lines 1-4, 414-426):
```typescript
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

fireEvent.click(screen.getByRole('button', { name: /drag sprint/i }));
fireEvent.click(screen.getByRole('button', { name: /best of 3/i }));
fireEvent.click(screen.getByRole('button', { name: /sprint circuit/i }));
```

**Apply to:** `AnalogPad.test.tsx` and `ActionButton.test.tsx`. Existing dependencies support `fireEvent`; add `@testing-library/user-event` only if pointer sequence tests become awkward with `fireEvent`.

---

## Shared Patterns

### Socket Session Filtering

**Source:** `apps/web/src/lib/useGameSessionSocket.ts`
**Apply to:** `SprintCircuitPage.tsx`, any shell/session adapter code

```typescript
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
```

### Generic Input Transport

**Source:** `apps/web/src/lib/useGameSessionSocket.ts`
**Apply to:** `useGameControls.ts`, `SprintCircuitPage.tsx`

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

### Session Finish Navigation

**Source:** `apps/web/src/pages/SprintCircuitPage.tsx`
**Apply to:** `SprintCircuitPage.tsx` after shell integration

```typescript
window.sessionStorage.setItem(`blitz-results:${finished.sessionId}`, JSON.stringify(finished));
navigate(`/results/${finished.sessionId}`, {
  replace: true,
  state: finished,
});
```

### Canvas Test Guard

**Source:** `apps/web/src/pages/SprintCircuitPage.tsx`
**Apply to:** `GameViewport.tsx`

```typescript
if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) {
  return;
}
```

### CSS Theme Tokens

**Source:** `apps/web/src/styles.css`
**Apply to:** fullscreen shell and gameplay controls

```css
--panel: #0f0f1e;
--text: #ddeeff;
--accent: #00aadd;
--accent-2: #ff3333;
--accent-3: #ffd700;
--green: #33ff66;
```

## No Analog Found

All Phase 1 files have at least a usable local analog. The weakest matches are `AnalogPad.tsx`, `AnalogPad.test.tsx`, and `ActionButton.test.tsx` because the codebase has button press controls but no existing pointer-capture analog pad.

## Metadata

**Analog search scope:** `apps/web/src`, `packages/shared/src`, `.planning/phases/01-fullscreen-game-shell-and-input-foundation`, `.planning/codebase`
**Files scanned:** 42 source/planning files by `find`, `grep`, `sed`, `nl`, and `wc`
**Pattern extraction date:** 2026-04-25
**Project constraints applied:** source of truth stays in `apps/**/src` and `packages/shared/src`; server remains authoritative; shared contracts live in `packages/shared`; gameplay screens are mobile-first and fullscreen.
