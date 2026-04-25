# Phase 2: Drag Gear Race - Research

**Researched:** 2026-04-25 [VERIFIED: current prompt; `date` context]  
**Domain:** Server-authoritative arcade drag racing rules, shared Socket.IO contracts, mobile fullscreen React gameplay UI [VERIFIED: `.planning/ROADMAP.md`; `.planning/phases/02-drag-gear-race/02-CONTEXT.md`; `.planning/phases/02-drag-gear-race/02-UI-SPEC.md`]  
**Confidence:** HIGH for local architecture and required integration points; MEDIUM for first-pass physics tuning because finish-time spread must be play-tested after implementation [VERIFIED: local code audit; `.planning/phases/02-drag-gear-race/02-CONTEXT.md`]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Gear Timing Feel
- **D-01:** Use a visible, learnable shift window rather than a hidden or twitch-only timing model.
- **D-02:** Shift outcomes are `early`, `good`, `perfect`, and `late`.
- **D-03:** `perfect` shifts give the strongest acceleration benefit, `good` shifts give a smaller benefit, `early` shifts lose some acceleration, and `late` shifts apply a small speed or RPM drop.
- **D-04:** The first playable version should be forgiving enough to learn in one or two races, but consistent enough that better shift timing clearly improves finish time.

### Acceleration And Controls
- **D-05:** Use hold-to-accelerate plus a separate shift action.
- **D-06:** Drag race should not require steering. Player skill is throttle commitment plus shift timing.
- **D-07:** Touch controls should map cleanly to the Phase 1 two-thumb shell: one fixed action zone for accelerate and one fixed action zone for shift.
- **D-08:** Desktop fallback should support the same concepts, with a held acceleration key and a discrete shift key.

### Race Pacing And Difficulty
- **D-09:** Start with a short arcade drag race target, roughly 12-18 seconds for a competent run.
- **D-10:** Use 4 gears for the first implementation.
- **D-11:** One bad shift should be recoverable; multiple better shifts should still beat a mediocre run clearly.
- **D-12:** Tune finish-time spread so manual timing matters in a one-player test and in a two-player test.

### HUD And Results Feedback
- **D-13:** HUD must show RPM, current gear, speed, distance, and last shift quality during the race.
- **D-14:** RPM and the ideal shift cue are the mode-critical HUD focus for drag.
- **D-15:** Results must include finish time and a shift performance summary, such as counts of perfect/good/early/late shifts.
- **D-16:** Key status should be React-rendered text, not only canvas graphics, so tests and accessibility checks can inspect it.

### the agent's Discretion
- Exact RPM scale, numeric tuning constants, and visual meter design.
- Whether the first shift cue is a colored band, marker, flash, label, or equivalent readable indicator.
- Exact keyboard key choices, as long as they align with the Phase 1 control contract.
- How much of the old `dragSprint.ts` file is reused versus replaced, provided old lane/obstacle/powerup mechanics are removed from this mode.

### Claude's Discretion
No separate `## Claude's Discretion` section exists in `02-CONTEXT.md`; discretion is captured verbatim above under `### the agent's Discretion`. [VERIFIED: `.planning/phases/02-drag-gear-race/02-CONTEXT.md`]

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Steering, obstacles, lane changes, slowdown recovery, and obstacle hit counts belong to Phase 3.
- Analog steering, checkpoints, laps, off-track penalties, and wrong-way logic belong to Phases 4 and 5.
- Lobby catalog copy, mode cards, and broad result polish belong to Phase 6.
- Sound, haptics, camera shake, and advanced visual juice remain polish after the core mechanics work.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DRAG-01 | Player can start a straight drag race and control acceleration. | Use existing `race:drag-sprint` registry/session flow, but replace lane/obstacle mechanics with throttle-driven drag state in the server runtime. [VERIFIED: `.planning/REQUIREMENTS.md`; `apps/server/src/games/registry.ts`; `apps/server/src/games/race/dragSprint.ts`] |
| DRAG-02 | Player can shift gears during the race. | Add a shared drag input shape for throttle pressed/released and discrete shift action; consume it in `createDragSprintRuntime.applyInput()`. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/server/src/games/runtime.ts`; `02-UI-SPEC.md`] |
| DRAG-03 | The runtime scores shift timing as early, good/perfect, or late and changes acceleration/result accordingly. | Extract deterministic gear-rule helpers for RPM windows, shift quality, speed/RPM advancement, finish, and ranking; cover them with Node tests. [VERIFIED: `AGENTS.md`; `.planning/codebase/CONCERNS.md`; `apps/server/src/games/race/dragSprint.test.ts`] |
| DRAG-04 | Player can see RPM, current gear, speed, distance, and last shift quality during the race. | Add drag snapshot fields and render them as React text in the fullscreen drag HUD; canvas may show only track/cars. [VERIFIED: `.planning/phases/02-drag-gear-race/02-UI-SPEC.md`; `.planning/codebase/CONCERNS.md`] |
| DRAG-05 | Results show finish time and shift performance summary. | Emit `GameResults.summary` keys for finish time and shift counts, then extend `ResultsPage` or a drag summary component to display them. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/web/src/pages/ResultsPage.tsx`; `02-UI-SPEC.md`] |
| ARCH-02 | Server race rules are covered by deterministic tests for timing, collisions, checkpoints, penalties, and results. | For this phase, cover drag timing, acceleration, finish, ranking, and shift summary; collision/checkpoint categories apply to later race phases. [VERIFIED: `.planning/REQUIREMENTS.md`; `.planning/ROADMAP.md`; `apps/server/src/games/race/dragSprint.test.ts`] |
</phase_requirements>

## Summary

Phase 2 should preserve the existing lobby, registry, Socket.IO, and results lifecycle while replacing the `drag-sprint` mechanics with a straight-line gear timing game. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; `apps/server/src/games/registry.ts`; `apps/server/src/games/race/dragSprint.ts`] The current drag runtime still includes lanes, steering, obstacles, pickups, survival mode, and best-of-3 standings, which conflict with the locked Phase 2 boundary. [VERIFIED: `apps/server/src/games/race/dragSprint.ts`; `.planning/phases/02-drag-gear-race/02-CONTEXT.md`]

The standard approach is to add explicit shared drag contracts, implement pure deterministic gear-rule helpers, and keep the runtime as a small scheduler/session adapter around those helpers. [VERIFIED: `AGENTS.md`; `.planning/codebase/CONCERNS.md`; `packages/shared/src/game.ts`] The browser should emit throttle and shift intent only; server snapshots and results remain authoritative for RPM, speed, distance, shift quality, finish time, and rankings. [VERIFIED: `AGENTS.md`; `apps/server/src/games/runtime.ts`; `apps/web/src/lib/useGameSessionSocket.ts`; Socket.IO TypeScript docs]

**Primary recommendation:** Replace `dragSprint.ts` behavior around a pure `dragGearRules.ts` helper module, expose `DragGearInput`, `DragGearSnapshot`, `DragShiftQuality`, and `DragShiftSummary` from `packages/shared/src/game.ts`, then render `race:drag-sprint` through the Phase 1 fullscreen shell with throttle and shift controls. [VERIFIED: `.planning/phases/02-drag-gear-race/02-UI-SPEC.md`; `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-01-PLAN.md`; local code audit]

## Project Constraints (from AGENTS.md)

- Keep the current pnpm workspace architecture. [VERIFIED: `AGENTS.md`; `pnpm-workspace.yaml`; `package.json`]
- Treat `apps/**/src` and `packages/shared/src` as source of truth. [VERIFIED: `AGENTS.md`; `.planning/codebase/CONCERNS.md`]
- Keep server gameplay state authoritative. [VERIFIED: `AGENTS.md`; `.planning/codebase/ARCHITECTURE.md`]
- Put shared socket/input/snapshot contracts in `packages/shared`. [VERIFIED: `AGENTS.md`; `packages/shared/src/index.ts`]
- Prefer deterministic rule helpers with tests over adding more logic to large runtime files. [VERIFIED: `AGENTS.md`; `.planning/codebase/CONCERNS.md`]
- Gameplay screens must be mobile-first and fullscreen. [VERIFIED: `AGENTS.md`; `.planning/phases/02-drag-gear-race/02-UI-SPEC.md`]
- Completion checks are `pnpm run build`, `pnpm test`, and focused package tests during iteration. [VERIFIED: `AGENTS.md`; `package.json`]
- Render Free remains the intended deployment target with build command `corepack enable && pnpm install --frozen-lockfile && pnpm run build`, start command `pnpm start`, and health check `/health`. [VERIFIED: `AGENTS.md`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Drag input vocabulary | Shared package | Browser / Client and API / Backend | Shared contracts are imported by both web and server, and Phase 2 needs typed throttle/shift intent. [VERIFIED: `packages/shared/src/contracts.ts`; `.planning/codebase/ARCHITECTURE.md`] |
| Physical throttle/shift controls | Browser / Client | Shared package | Pointer/keyboard events originate in React controls, then emit shared intent payloads. [VERIFIED: `02-UI-SPEC.md`; MDN Pointer Events] |
| RPM, speed, distance, gear, shift scoring | API / Backend | Shared package | Server runtimes own authoritative gameplay state; shared types describe the snapshots. [VERIFIED: `AGENTS.md`; `apps/server/src/games/runtime.ts`; `packages/shared/src/game.ts`] |
| Finish time and ranking | API / Backend | Browser / Client display | Current runtimes emit `SessionFinishedPayload`; `ResultsPage` displays rankings. [VERIFIED: `apps/server/src/games/race/dragSprint.ts`; `apps/web/src/pages/ResultsPage.tsx`] |
| Straight track visualization | Browser / Client | API / Backend for positions | Canvas or DOM presentation can draw the track, but progress comes from server snapshots. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.tsx`; `02-UI-SPEC.md`] |
| Shift summary results UI | Browser / Client | API / Backend payload | Backend emits summary values; React renders them visibly without hidden modal interaction. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/web/src/pages/ResultsPage.tsx`; `02-UI-SPEC.md`] |
| Deterministic rule verification | API / Backend tests | Shared package tests | ARCH-02 maps to server race rules; shared contract shape tests protect cross-tier payload fields. [VERIFIED: `.planning/REQUIREMENTS.md`; `apps/server/src/games/race/dragSprint.test.ts`; `packages/shared/src/contracts.test.ts`] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@blitz/shared` | workspace package | Defines drag input, snapshot, result summary, and socket payload types. | It is the existing web/server contract boundary. [VERIFIED: `packages/shared/src/index.ts`; `.planning/codebase/ARCHITECTURE.md`] |
| React / React DOM | installed `19.2.5`; registry current `19.2.5`, modified 2026-04-24 | Render fullscreen HUD, controls, accessible labels, and results text. | Existing web app uses React, and official React docs define effects/cleanup for external systems such as DOM/socket listeners. [VERIFIED: `pnpm-lock.yaml`; `npm view react`; `npm view react-dom`] [CITED: https://react.dev/reference/react/useEffect] |
| React Router DOM | installed `7.14.2`; registry current `7.14.2`, modified 2026-04-22 | Keep `/race/live/:sessionId` route flow and memory-router tests. | Existing route tree uses React Router data routers and `createMemoryRouter` in tests. [VERIFIED: `apps/web/src/app/router.tsx`; `pnpm-lock.yaml`; `npm view react-router-dom`] |
| Socket.IO / Socket.IO Client | installed and registry current `4.8.3`, modified 2025-12-23 | Transport `client:game-input`, `server:session-state`, and `server:session-finished`. | Existing app already uses Socket.IO, and official docs support typed server/client event interfaces while warning that types do not replace input validation. [VERIFIED: `apps/server/package.json`; `apps/web/package.json`; `npm view socket.io`] [CITED: https://socket.io/docs/v4/typescript/] |
| Node test runner | Node `v24.14.1` available | Server/runtime deterministic tests beside `dragSprint.ts`. | Existing server/shared packages use `node --import tsx --test`. [VERIFIED: `node --version`; `apps/server/package.json`; `packages/shared/package.json`] |

### Supporting

| Library / API | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| TypeScript | lockfile `5.9.3`; registry current `6.0.3`, modified 2026-04-16 | Shared discriminated unions and runtime compile checks. | Use existing installed TypeScript; do not upgrade during Phase 2. [VERIFIED: `pnpm-lock.yaml`; `package.json`; `npm view typescript`] |
| Vite | lockfile `5.4.21`; registry current `8.0.10`, modified 2026-04-23 | Web build/test environment. | Keep existing Vite version because build-tool upgrades are outside this phase. [VERIFIED: `pnpm-lock.yaml`; `apps/web/package.json`; `npm view vite`] |
| Vitest | installed `3.2.4`; registry current `4.1.5`, modified 2026-04-23 | Web page/component tests for drag HUD, controls, and results summary. | Existing web package uses `vitest run`. [VERIFIED: `apps/web/package.json`; `pnpm-lock.yaml`; `npm view vitest`] |
| Testing Library React | installed and registry current `16.3.2`, modified 2026-01-19 | DOM assertions for React-rendered HUD/control/result text. | Existing page tests already use Testing Library. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.test.tsx`; `apps/web/package.json`; `npm view @testing-library/react`] |
| Browser Pointer Events | Web platform API | Touch/mouse throttle hold and discrete shift button input. | MDN describes Pointer Events as one event model for mouse, pen, and touch, with pointer capture for retargeting events to a chosen element. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events; https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture] |
| CSS `touch-action` | Web platform CSS | Prevent browser panning/zooming from stealing gameplay controls. | Use `touch-action: none` on throttle and shift controls, matching the UI contract. [VERIFIED: `02-UI-SPEC.md`] [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure deterministic drag helpers | Add gear logic directly into existing `dragSprint.ts` | Existing race runtime is large and already mixes lanes, obstacles, modes, timing, and result emission; helpers reduce regression risk. [VERIFIED: `.planning/codebase/CONCERNS.md`; `apps/server/src/games/race/dragSprint.ts`] |
| Generic `client:game-input` event family | Stale `client:player-input` / `server:race-snapshot` event family | Server socket flow currently emits generic session state, and concerns warn about stale race-specific events. [VERIFIED: `packages/shared/src/contracts.ts`; `.planning/codebase/CONCERNS.md`; `apps/server/src/socket/register.ts`] |
| Reuse `useLiveRaceSocket` interval controls | Drag-specific control adapter over `useGameSessionSocket` | Current hook emits steering/brake every 50ms and assumes acceleration when not braking; drag needs hold throttle plus one-shot shift. [VERIFIED: `apps/web/src/lib/useLiveRaceSocket.ts`; `02-CONTEXT.md`] |
| Keep lanes/obstacles/pickups | Straight gear-only track | Deferred ideas explicitly move steering, obstacles, lane changes, slowdown recovery, and obstacle counts to Phase 3. [VERIFIED: `02-CONTEXT.md`] |

**Installation:**
```bash
# No new runtime dependency is required for Phase 2.
# Use existing workspace dependencies and add only code/tests.
pnpm --filter @blitz/shared test
pnpm --filter @blitz/server test
pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx ResultsPage.test.tsx
```
[VERIFIED: `package.json`; `apps/server/package.json`; `apps/web/package.json`; `packages/shared/package.json`]

**Version verification:** `npm view` checks were run for `react`, `react-router-dom`, `socket.io`, `vite`, `vitest`, `typescript`, `@testing-library/react`, and `jsdom` on 2026-04-25. [VERIFIED: npm registry via `npm view`]

## Architecture Patterns

### System Architecture Diagram

```text
Touch / keyboard input
  -> DragActionControls
       - throttle pressed/released
       - shift one-shot action
  -> shared DragGearInput
  -> Socket.IO client: client:game-input
  -> server socket gateway
  -> GameManager.applyInput(playerId, input)
  -> createDragSprintRuntime.applyInput()
  -> dragGearRules pure helpers
       - validate input
       - advance RPM/speed/distance
       - score shift window
       - update shift summary
       - detect finish/rankings
  -> GameSessionEnvelope<DragGearSnapshot>
  -> Socket.IO server: server:session-state
  -> DragGearRacePage
       - StraightDragTrack visual
       - DragGearHud React text
       - RpmShiftMeter with visible window
       - throttle + shift controls
  -> SessionFinishedPayload
  -> ResultsPage / DragResultsSummary
```
[VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`; `apps/server/src/games/manager.ts`; `apps/server/src/games/race/dragSprint.ts`; `02-UI-SPEC.md`]

### Recommended Project Structure

```text
packages/shared/src/
├── game.ts                         # DragGearInput, DragGearSnapshot, shift/result types
├── contracts.ts                    # GameInputPayload includes drag input union
└── contracts.test.ts               # shared export/shape coverage

apps/server/src/games/race/
├── dragGearRules.ts                # pure gear/RPM/shift/finish/ranking helpers
├── dragGearRules.test.ts           # deterministic rule tests
├── dragSprint.ts                   # runtime adapter preserving race:drag-sprint registry
└── dragSprint.test.ts              # session lifecycle/integration tests

apps/web/src/pages/
├── DragGearRacePage.tsx            # fullscreen route-level drag screen
├── DragGearRacePage.test.tsx       # HUD/control/finish navigation tests
└── ResultsPage.tsx                 # render Shift Summary for drag results

apps/web/src/components/game/
└── [Phase 1 shell/control files]    # FullscreenGameShell, ActionButton, GameViewport, etc.
```
[VERIFIED: `.planning/codebase/STRUCTURE.md`; `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-02-PLAN.md`; `.planning/phases/02-drag-gear-race/02-UI-SPEC.md`]

### Pattern 1: Shared Drag Contract First

**What:** Add explicit types for drag input, snapshot, shift quality, shift window, player state, and shift summary before runtime/web implementation. [VERIFIED: `AGENTS.md`; `packages/shared/src/game.ts`]  
**When to use:** Use before modifying `dragSprint.ts` or drag UI, so server and web compile against the same fields. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`]  
**Example:**
```typescript
// Source: local @blitz/shared pattern in packages/shared/src/game.ts
export const DRAG_SHIFT_QUALITY = {
  early: 'early',
  good: 'good',
  perfect: 'perfect',
  late: 'late',
} as const;

export type DragShiftQuality =
  (typeof DRAG_SHIFT_QUALITY)[keyof typeof DRAG_SHIFT_QUALITY];

export type DragGearInput =
  | { kind: 'drag-throttle'; pressed: boolean; sequence: number; clientTimeMs: number }
  | { kind: 'drag-shift'; sequence: number; clientTimeMs: number };
```
[VERIFIED: existing `as const` convention in `packages/shared/src/contracts.ts` and `packages/shared/src/game.ts`]

### Pattern 2: Pure Gear Rules Under Runtime Adapter

**What:** Put RPM/gear/speed/shift/finish math in pure functions such as `advanceDragPlayer`, `scoreShift`, `createInitialDragPlayer`, and `rankDragPlayers`. [VERIFIED: `AGENTS.md`; `.planning/codebase/CONCERNS.md`]  
**When to use:** Use whenever changing gameplay math, because tests can drive helpers without timers or Socket.IO. [VERIFIED: `apps/server/src/games/race/dragSprint.test.ts`]  
**Example:**
```typescript
// Source: recommended deterministic helper pattern from AGENTS.md and existing runtime tests
export function scoreShift(rpm: number, window: DragShiftWindow): DragShiftQuality {
  if (rpm >= window.perfectMin && rpm <= window.perfectMax) return 'perfect';
  if (rpm >= window.goodMin && rpm <= window.goodMax) return 'good';
  if (rpm < window.goodMin) return 'early';
  return 'late';
}
```
[VERIFIED: `AGENTS.md`; `apps/server/src/games/race/dragSprint.test.ts`] [ASSUMED: exact helper names and window field names]

### Pattern 3: Discrete Shift Event, Held Throttle State

**What:** Treat throttle as a boolean state that persists until release/cancel, and shift as a one-shot action ignored on key repeat/long press. [VERIFIED: `02-CONTEXT.md`; `02-UI-SPEC.md`]  
**When to use:** Use in `DragActionControls`, keyboard fallback, and server input consumption. [VERIFIED: `02-UI-SPEC.md`]  
**Example:**
```typescript
// Source: Phase 2 UI contract and useGameSessionSocket submit pattern
submitInput({
  kind: 'drag-throttle',
  pressed: true,
  sequence: nextSequence(),
  clientTimeMs: Date.now(),
});

submitInput({
  kind: 'drag-shift',
  sequence: nextSequence(),
  clientTimeMs: Date.now(),
});
```
[VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`; `02-UI-SPEC.md`]

### Pattern 4: Results Summary Through `GameResults.summary`

**What:** Emit drag-specific summary values in the existing results payload instead of creating a separate results transport. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/web/src/pages/ResultsPage.tsx`]  
**When to use:** Use when runtime finishes, before `onFinished()` emits `SessionFinishedPayload`. [VERIFIED: `apps/server/src/games/race/dragSprint.ts`]  
**Example:**
```typescript
// Source: existing GameResults.summary pattern in apps/server/src/games/race/dragSprint.ts
results: {
  rankings: buildDragRankings(players),
  summary: {
    mode: 'drag-gear',
    distanceTarget,
    finishTimeMs: winner.finishTimeMs,
    perfectShifts,
    goodShifts,
    earlyShifts,
    lateShifts,
    totalShifts,
  },
}
```
[VERIFIED: `apps/server/src/games/race/dragSprint.ts`; `packages/shared/src/contracts.ts`] [ASSUMED: exact summary key names]

### Anti-Patterns to Avoid

- **Client-authoritative speed/RPM:** Browser feedback can be immediate for pressed visual state, but final speed, RPM, shift quality, finish time, and ranking must come from server snapshots. [VERIFIED: `AGENTS.md`; `02-UI-SPEC.md`]
- **Canvas-only HUD:** Required RPM, gear, speed, distance, and last shift quality must be React-rendered text. [VERIFIED: `02-CONTEXT.md`; `02-UI-SPEC.md`; `.planning/codebase/CONCERNS.md`]
- **Reusing old obstacle/lane systems:** Old obstacles, pickups, steering lanes, survival timeout, and best-of-3 behavior are out of scope for Phase 2 drag gear race. [VERIFIED: `apps/server/src/games/race/dragSprint.ts`; `02-CONTEXT.md`]
- **Interval-spam shift input:** Holding shift must not repeatedly shift; use discrete keydown/pointer activation and ignore repeats. [VERIFIED: `02-UI-SPEC.md`]
- **Broad `Record<string, unknown>` runtime trust:** Socket.IO types are not runtime validation, and official Socket.IO docs caution that type hints do not replace validation/sanitization. [VERIFIED: `packages/shared/src/contracts.ts`] [CITED: https://socket.io/docs/v4/typescript/]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Realtime transport | New WebSocket protocol or custom room manager | Existing Socket.IO `client:game-input` and `server:session-state` flow | The project already has typed Socket.IO contracts, gateway handlers, and game manager dispatch. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/server/src/socket/register.ts`; `apps/server/src/games/manager.ts`] |
| Lobby/session/result lifecycle | New drag-only session lifecycle | Existing registry/runtime `GameRuntimeInstance` lifecycle | `race:drag-sprint` is already registered and results already route through `SessionFinishedPayload`. [VERIFIED: `apps/server/src/games/registry.ts`; `apps/server/src/games/runtime.ts`; `apps/web/src/pages/ResultsPage.tsx`] |
| Touch/mouse abstraction | Separate mouse/touch code paths everywhere | Pointer Events plus pointer capture and `touch-action: none` | Pointer Events provide one DOM event model for mouse, pen, and touch, and pointer capture retargets a pointer to a chosen element. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events; https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture] |
| Physics engine | External 2D physics package | Small deterministic arcade helper functions | Phase 2 is straight-line arcade RPM/speed/distance math, not simulation-grade physics. [VERIFIED: `.planning/PROJECT.md`; `02-CONTEXT.md`] |
| Result persistence | Database or leaderboard | Existing in-memory session results and `sessionStorage` handoff | Persistence and leaderboards are out of scope for this milestone. [VERIFIED: `.planning/REQUIREMENTS.md`; `apps/web/src/pages/SprintCircuitPage.tsx`; `apps/web/src/pages/ResultsPage.tsx`] |

**Key insight:** The complex part is not infrastructure; it is making the server rule loop deterministic, visible, and testable while removing old drag mechanics that contradict the gear-timing game. [VERIFIED: `.planning/codebase/CONCERNS.md`; `apps/server/src/games/race/dragSprint.ts`; `02-CONTEXT.md`]

## Common Pitfalls

### Pitfall 1: Leaving Old Drag Mechanics Alive
**What goes wrong:** A player can still steer, hit obstacles, collect pickups, or enter survival/best-of-3 paths in a phase that should be pure gear timing. [VERIFIED: `apps/server/src/games/race/dragSprint.ts`; `02-CONTEXT.md`]  
**Why it happens:** Existing `dragSprint.ts` already implements these mechanics and tests assert them. [VERIFIED: `apps/server/src/games/race/dragSprint.test.ts`]  
**How to avoid:** Replace tests first around new gear behavior and remove lane/obstacle/pickup state from `DragGearSnapshot`. [VERIFIED: `AGENTS.md`; `02-UI-SPEC.md`]  
**Warning signs:** Snapshot still has `lane`, `obstacles`, `pickups`, `activePowerUp`, `steer`, or `brake` fields for `drag-sprint`. [VERIFIED: `packages/shared/src/game.ts`; `apps/server/src/games/race/dragSprint.ts`]

### Pitfall 2: Shifts Do Not Affect Finish Times Enough
**What goes wrong:** Early/good/perfect/late labels appear, but all runs finish with similar times. [VERIFIED: `.planning/ROADMAP.md` success criteria]  
**Why it happens:** Acceleration penalties/bonuses can be too small, or the race distance can be too short/long for four shifts to matter. [ASSUMED]  
**How to avoid:** Add deterministic tests that compare perfect-run, good-run, early-run, and late-run finish ticks/times, then tune until perfect clearly beats mediocre while one bad shift remains recoverable. [VERIFIED: `02-CONTEXT.md`; `.planning/ROADMAP.md`]  
**Warning signs:** Tests only assert labels, not acceleration curve or finish order. [VERIFIED: `.planning/ROADMAP.md`; `apps/server/src/games/race/dragSprint.test.ts`]

### Pitfall 3: Client Shift Timing Uses Local Time As Authority
**What goes wrong:** Latency or forged client timestamps can decide shift quality. [VERIFIED: `packages/shared/src/contracts.ts`; Socket.IO docs caution on validation]  
**Why it happens:** `clientTimeMs` is useful sequencing/debug data but is user-controlled. [VERIFIED: `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-01-PLAN.md`; Socket.IO docs]  
**How to avoid:** Score shifts against server runtime state at input receipt / runtime tick; use `sequence` only for ordering/replay protection where helpful, not as authoritative physics time. [VERIFIED: `AGENTS.md`; `apps/server/src/games/runtime.ts`]  
**Warning signs:** `scoreShift()` reads `clientTimeMs` to calculate RPM or finish time. [ASSUMED]

### Pitfall 4: Throttle Gets Stuck On Mobile
**What goes wrong:** Player releases touch or backgrounds the tab, but server still receives throttle pressed. [VERIFIED: `02-UI-SPEC.md`]  
**Why it happens:** Pointer cancel, lost capture, blur, visibility change, route unmount, finish, or disconnect reset paths are omitted. [VERIFIED: `02-UI-SPEC.md`; MDN pointercancel docs]  
**How to avoid:** Send throttle released on pointer up/cancel/lost capture, keyboard keyup, blur, visibility hidden, route unmount, finish, and connection loss. [VERIFIED: `02-UI-SPEC.md`]  
**Warning signs:** Tests cover pointer down but not pointer cancel/blur/unmount release. [VERIFIED: `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-02-PLAN.md`]

### Pitfall 5: Results Summary Is Hidden In Generic Summary Data
**What goes wrong:** Backend emits shift counts, but users cannot see them without inspecting JSON or opening hidden UI. [VERIFIED: `apps/web/src/pages/ResultsPage.tsx`; `02-UI-SPEC.md`]  
**Why it happens:** `ResultsPage` currently renders rankings but not `results.summary`. [VERIFIED: `apps/web/src/pages/ResultsPage.tsx`; `apps/web/src/pages/ResultsPage.test.tsx`]  
**How to avoid:** Add a `DragResultsSummary` section with required fields visible in DOM text. [VERIFIED: `02-UI-SPEC.md`]  
**Warning signs:** `ResultsPage.test.tsx` only checks ranking labels and host controls. [VERIFIED: `apps/web/src/pages/ResultsPage.test.tsx`]

## Code Examples

Verified patterns from official/local sources:

### Runtime Factory Registration
```typescript
// Source: apps/server/src/games/registry.ts
{
  key: 'race:drag-sprint',
  game: 'race',
  variant: 'drag-sprint',
  countdown: 3,
  createRuntime(lobby, sessionId, callbacks) {
    return createDragSprintRuntime(lobby, sessionId, {
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
[VERIFIED: `apps/server/src/games/registry.ts`]

### Generic Session Input Hook
```typescript
// Source: apps/web/src/lib/useGameSessionSocket.ts
submitInput(payload) {
  socket.emit(SOCKET_EVENTS.client.gameInput, payload);
}
```
[VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`]

### Session Finished Payload Shape
```typescript
// Source: packages/shared/src/contracts.ts
export interface GameResults {
  rankings: GameResultEntry[];
  summary?: Record<string, string | number | boolean | null>;
}
```
[VERIFIED: `packages/shared/src/contracts.ts`]

### React Effect Cleanup For Socket/DOM Synchronization
```typescript
// Source: official React useEffect docs and local hook pattern
useEffect(() => {
  socket.on(SOCKET_EVENTS.server.sessionState, handleSessionState);

  return () => {
    socket.off(SOCKET_EVENTS.server.sessionState, handleSessionState);
  };
}, [socket, sessionId]);
```
[VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`] [CITED: https://react.dev/reference/react/useEffect]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Untyped `GameInputPayload = Record<string, unknown>` for all session inputs | Discriminated race inputs planned in Phase 1 and drag-specific input fields in Phase 2 | Phase 1 planned on 2026-04-25; Phase 2 research on 2026-04-25 | Planner should add/consume typed drag input instead of extending anonymous object payloads. [VERIFIED: `packages/shared/src/contracts.ts`; `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-01-PLAN.md`] |
| Old race-specific socket events remain in shared contracts | Generic session events are the active server path | Codebase audit dated 2026-04-25 | Use `client:game-input`, `server:session-state`, and `server:session-finished` for drag. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/server/src/socket/register.ts`; `.planning/codebase/CONCERNS.md`] |
| Panel/card live race page with old controls | Fullscreen mobile gameplay shell from Phase 1 and Phase 2 UI contract | Phase 1/2 design contracts dated 2026-04-25 | Drag should not render normal app chrome, `.panel`, `.card`, or old control grid during active play. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.tsx`; `02-UI-SPEC.md`] |
| Old drag mode with steering, obstacles, pickups, survival, and best-of-3 | Straight hold-throttle and shift-timing race | Locked in `02-CONTEXT.md` on 2026-04-25 | Remove those mechanics from `drag-sprint` for Phase 2. [VERIFIED: `02-CONTEXT.md`; `apps/server/src/games/race/dragSprint.ts`] |

**Deprecated/outdated:**
- `client:player-input`, `server:race-snapshot`, and `server:race-finished` are stale for new Phase 2 work because active server flow uses generic session events. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/server/src/socket/register.ts`; `.planning/codebase/CONCERNS.md`]
- `useLiveRaceSocket` public API is outdated for drag because it emits steering/brake interval input rather than throttle/shift intent. [VERIFIED: `apps/web/src/lib/useLiveRaceSocket.ts`; `02-CONTEXT.md`]
- Existing `DragSprintSnapshot` lane/obstacle/pickup shape is outdated for this phase boundary. [VERIFIED: `packages/shared/src/game.ts`; `02-UI-SPEC.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact pure helper names and shift window field names in examples are implementation suggestions, not locked API. | Architecture Patterns / Code Examples | Planner may over-specify names that conflict with Phase 1 contracts. |
| A2 | First-pass physics tuning should make perfect/good/early/late runs measurably different, but exact acceleration constants require play-testing. | Common Pitfalls / Summary | Tests may pass mechanically while manual feel remains weak. |
| A3 | Summary key names such as `perfectShifts`, `goodShifts`, `earlyShifts`, and `lateShifts` are recommended but not already present in code. | Pattern 4 | Planner should align exact keys with shared types before implementation. |

## Open Questions

1. **Has Phase 1 been executed before Phase 2 starts?**  
   - What we know: `.planning/STATE.md` says Phase 1 is planned and ready to execute, while Phase 2 UI contract depends on the Phase 1 fullscreen shell. [VERIFIED: `.planning/STATE.md`; `.planning/phases/02-drag-gear-race/02-UI-SPEC.md`]  
   - What's unclear: The codebase currently does not contain `FullscreenGameShell`, `ActionButton`, or `RaceGameInput`; grep found those only in Phase 1 planning artifacts. [VERIFIED: local grep over `apps`, `packages`, and Phase 1 docs]  
   - Recommendation: Plan Phase 2 as depending on Phase 1 outputs; include a Wave 0 verification task that checks these files/types exist or adapts the plan if Phase 1 is not executed. [VERIFIED: `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-01-PLAN.md`; `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-02-PLAN.md`]

2. **Should drag continue respecting lobby `raceMode` variants?**  
   - What we know: Current `dragSprint.ts` branches on `finish-line`, `best-of-3`, and `survival`; Phase 2 context describes one gear timing race and defers unrelated mechanics. [VERIFIED: `apps/server/src/games/race/dragSprint.ts`; `02-CONTEXT.md`]  
   - What's unclear: Whether lobby settings should be ignored, normalized, or hidden until Phase 6 lobby polish. [VERIFIED: `.planning/ROADMAP.md`]  
   - Recommendation: For Phase 2 runtime, implement one `drag-sprint` gear race path and avoid survival/best-of-3 behavior; leave broad lobby catalog/settings cleanup to Phase 6 unless current startability blocks manual testing. [VERIFIED: `02-CONTEXT.md`; `.planning/ROADMAP.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Server/shared tests and builds | yes | `v24.14.1` | None needed. [VERIFIED: `node --version`] |
| pnpm | Workspace scripts | yes | `10.33.2` | None needed; project package manager is pnpm. [VERIFIED: `pnpm --version`; `package.json`] |
| npm registry access | Version verification only | yes | npm CLI `11.11.0` | Use lockfile/package.json if registry unavailable later. [VERIFIED: `npm --version`; `npm view` outputs] |
| Browser/mobile viewport | Manual gameplay check | not probed in research | — | Planner should include manual phone/viewport check after implementation. [VERIFIED: `02-UI-SPEC.md`; `.planning/STATE.md` open risk] |

**Missing dependencies with no fallback:** None found for planning and automated tests. [VERIFIED: environment probes]  
**Missing dependencies with fallback:** Real phone/browser manual testing was not executed during research; viewport/manual validation remains a planner verification step. [VERIFIED: `.planning/STATE.md`; `02-UI-SPEC.md`]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node test runner for server/shared; Vitest `3.2.4` for web. [VERIFIED: `apps/server/package.json`; `packages/shared/package.json`; `apps/web/package.json`; `pnpm-lock.yaml`] |
| Config file | Web uses `apps/web/vite.config.ts`; server/shared use TypeScript config plus Node test CLI. [VERIFIED: `apps/web/vite.config.ts`; package scripts] |
| Quick run command | `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts src/games/race/dragSprint.test.ts` and `pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx ResultsPage.test.tsx`. [VERIFIED: package scripts; current test naming conventions] |
| Full suite command | `pnpm test`. [VERIFIED: `package.json`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DRAG-01 | Player acceleration increases speed/distance only while throttle is held. | server unit/integration | `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts src/games/race/dragSprint.test.ts` | no - Wave 0 for `dragGearRules.test.ts`; existing `dragSprint.test.ts` must be rewritten. [VERIFIED: current file list] |
| DRAG-02 | Shift action advances gear and ignores repeated/invalid shifts. | server unit + web component | `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts` and `pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx` | no - Wave 0. [VERIFIED: current file list] |
| DRAG-03 | Early/good/perfect/late shifts produce different acceleration curves and finish times. | server deterministic unit | `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts` | no - Wave 0. [VERIFIED: current file list] |
| DRAG-04 | HUD renders RPM, gear, speed, distance, and last shift quality as DOM text. | web component/page | `pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx` | no - Wave 0. [VERIFIED: current file list] |
| DRAG-05 | Results render finish time and shift summary counts. | server integration + web page | `pnpm --filter @blitz/server test -- src/games/race/dragSprint.test.ts` and `pnpm --filter @blitz/web test -- ResultsPage.test.tsx` | partial - `ResultsPage.test.tsx` exists but lacks drag summary assertions. [VERIFIED: `apps/web/src/pages/ResultsPage.test.tsx`] |
| ARCH-02 | Runtime rule tests cover shift timing, acceleration, finish, and ranking. | server deterministic unit/integration | `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts src/games/race/dragSprint.test.ts` | partial - old drag tests exist for old mechanics. [VERIFIED: `apps/server/src/games/race/dragSprint.test.ts`] |

### Sampling Rate

- **Per task commit:** Run the focused package test for touched code, especially shared contract tests after type changes and server drag tests after rule changes. [VERIFIED: package scripts]
- **Per wave merge:** Run `pnpm --filter @blitz/shared test`, `pnpm --filter @blitz/server test`, and relevant `@blitz/web` page/component tests. [VERIFIED: package scripts]
- **Phase gate:** Run `pnpm run build` and `pnpm test` before claiming completion. [VERIFIED: `AGENTS.md`; `package.json`]

### Wave 0 Gaps

- [ ] `packages/shared/src/contracts.test.ts` updates for `DragGearInput`, `DragGearSnapshot`, `DragShiftQuality`, and `DragShiftSummary`. [VERIFIED: current shared test file]
- [ ] `apps/server/src/games/race/dragGearRules.test.ts` for pure shift timing, acceleration, finish, and ranking. [VERIFIED: current file list]
- [ ] `apps/server/src/games/race/dragSprint.test.ts` rewritten to remove lane/obstacle/pickup/survival/best-of-3 assertions. [VERIFIED: existing test content]
- [ ] `apps/web/src/pages/DragGearRacePage.test.tsx` for fullscreen route, HUD copy, throttle/shift controls, and finish navigation. [VERIFIED: current file list]
- [ ] `apps/web/src/pages/ResultsPage.test.tsx` additions for visible `Shift Summary`. [VERIFIED: existing test content; `02-UI-SPEC.md`]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no new auth in Phase 2 | Do not alter socket-id lobby identity in this gameplay phase. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; `.planning/codebase/CONCERNS.md`] |
| V3 Session Management | yes, existing session flow | Keep `sessionId` filtering and server-side `GameManager` player/session mapping. [VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`; `apps/server/src/games/manager.ts`] |
| V4 Access Control | yes, transport boundary | Runtime must ignore unknown player ids and invalid session state, matching existing `GameManager.applyInput()` dispatch boundary. [VERIFIED: `apps/server/src/games/manager.ts`; `apps/server/src/games/race/dragSprint.ts`] |
| V5 Input Validation | yes | Validate discriminated drag input, finite numeric sequence/client times, throttle boolean state, and shift action shape before applying rules. [VERIFIED: `packages/shared/src/contracts.ts`; Socket.IO TypeScript docs] |
| V6 Cryptography | no | No cryptography is introduced by drag gear gameplay. [VERIFIED: Phase 2 scope in `02-CONTEXT.md`] |

### Known Threat Patterns for Socket Realtime Gameplay

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged client speed/RPM/finish payload | Tampering | Input payloads contain intent only; server derives authoritative speed, RPM, finish time, and rankings. [VERIFIED: `AGENTS.md`; `02-UI-SPEC.md`] |
| High-rate shift/throttle spam | Denial of Service / Tampering | Clamp/ignore invalid sequence or repeated shift actions per runtime tick; keep final state server-side. [VERIFIED: `.planning/codebase/CONCERNS.md`; `apps/server/src/games/manager.ts`] [ASSUMED: exact anti-repeat policy] |
| Stuck throttle after disconnect/background | Tampering / Reliability | Client sends release on cancel/blur/unmount; server can treat disconnect/removePlayer as no further input. [VERIFIED: `02-UI-SPEC.md`; `apps/server/src/games/race/dragSprint.ts`] |
| Type-only validation mistaken for runtime validation | Tampering | Add runtime guards; Socket.IO docs explicitly caution that TypeScript hints do not replace input validation/sanitization. [CITED: https://socket.io/docs/v4/typescript/] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/02-drag-gear-race/02-CONTEXT.md` - locked user decisions, phase boundary, deferred scope. [VERIFIED: local file]
- `.planning/phases/02-drag-gear-race/02-UI-SPEC.md` - fullscreen drag UI, HUD, controls, accessibility, and shared contract expectations. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` - DRAG-01 through DRAG-05 and ARCH-02. [VERIFIED: local file]
- `.planning/ROADMAP.md` - Phase 2 goal, success criteria, and implementation notes. [VERIFIED: local file]
- `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, `STRUCTURE.md`, `CONVENTIONS.md` - local architecture, risks, edit locations, and coding conventions. [VERIFIED: local files]
- `AGENTS.md` - project engineering rules and verification commands. [VERIFIED: local file]
- `packages/shared/src/game.ts`, `packages/shared/src/contracts.ts`, `apps/server/src/games/race/dragSprint.ts`, `apps/server/src/games/race/dragSprint.test.ts`, `apps/web/src/lib/useGameSessionSocket.ts`, `apps/web/src/lib/useLiveRaceSocket.ts`, `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/pages/ResultsPage.tsx` - concrete integration points. [VERIFIED: local source]
- npm registry via `npm view` - current package versions and modification timestamps for React, React Router DOM, Socket.IO, Vite, Vitest, TypeScript, Testing Library React, and jsdom. [VERIFIED: npm registry]
- Socket.IO TypeScript documentation - typed event patterns and runtime validation caution. [CITED: https://socket.io/docs/v4/typescript/]
- MDN Pointer Events, `setPointerCapture`, and `touch-action` documentation - pointer/touch control behavior. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events; https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture; https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action]
- React `useEffect` documentation - effect setup/cleanup lifecycle for socket/DOM listeners. [CITED: https://react.dev/reference/react/useEffect]

### Secondary (MEDIUM confidence)

- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-01-PLAN.md`, `01-02-PLAN.md`, `01-03-PLAN.md`, `01-04-PLAN.md` - planned Phase 1 shell/contract outputs that Phase 2 should consume if executed first. [VERIFIED: local planning files]

### Tertiary (LOW confidence)

- None. [VERIFIED: source review]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - current versions were checked against package files, lockfile, and npm registry. [VERIFIED: package files; `pnpm-lock.yaml`; `npm view`]
- Architecture: HIGH - local source shows registry, runtime interface, generic session socket flow, and results lifecycle. [VERIFIED: local source audit]
- Runtime rule design: MEDIUM - helper boundaries are strongly supported by project constraints, but numeric tuning requires tests and manual play. [VERIFIED: `AGENTS.md`; `02-CONTEXT.md`] [ASSUMED: first-pass tuning constants]
- UI implementation: MEDIUM - UI contract is approved, but Phase 1 shell code is planned rather than present in current source. [VERIFIED: `.planning/STATE.md`; local grep]

**Research date:** 2026-04-25 [VERIFIED: current prompt]  
**Valid until:** 2026-05-25 for local architecture; re-check npm/package docs if dependency work is added. [ASSUMED]
