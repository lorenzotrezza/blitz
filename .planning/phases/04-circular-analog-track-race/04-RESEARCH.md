# Phase 04: circular-analog-track-race - Research

**Researched:** 2026-04-25 [VERIFIED: system date]
**Domain:** Server-authoritative realtime browser racing with analog touch input, circular track geometry, checkpoint/lap validation, and fullscreen mobile HUD [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]
**Confidence:** HIGH for local architecture and implementation path; MEDIUM for final tuning constants because mobile feel must be tuned by playtesting [VERIFIED: codebase scan; VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Analog Control Feel
- **D-01:** Use the Phase 1 analog-pad concept as the primary control: continuous `{ x, y, magnitude }`, not discrete left/right steering.
- **D-02:** The first circular mode should use one analog pad for direction and throttle magnitude. Pushing farther from center means stronger movement; releasing the pad coasts/slows back toward neutral.
- **D-03:** Keep the analog baseline forgiving on phones: smooth input, damp sudden turns, and avoid twitch-only steering.
- **D-04:** Desktop fallback should map WASD and arrow keys to the same normalized analog vector. Mouse drag on the analog pad remains useful for local testing.
- **D-05:** Right-side action buttons may expose brake/reset later if Phase 1 primitives exist, but the core phase 4 skill loop is analog steering and speed control, not extra buttons.

### Circular Track Shape And Readability
- **D-06:** Use a simple readable circular or oval ring as the baseline analog map, not the existing complex `sprint-circuit` polyline.
- **D-07:** Default route direction is clockwise and must be visible through arrows, start/finish marking, and next-checkpoint emphasis.
- **D-08:** Render clear inner and outer track boundaries, a center guide, checkpoint gates, and lap progress. The player should understand where to go from the track itself, not from long text.
- **D-09:** Use broad road width and a modest first-pass speed so mobile tuning can focus on control feel before difficulty.
- **D-10:** Start with three laps unless testing shows the first run feels too long; planners may tune lap count, but lap validation must support multiple laps.

### Checkpoints And Laps
- **D-11:** Validate progress through ordered checkpoint gates around the circle. A lap completes only after the player crosses the start/finish gate after completing the ordered checkpoint sequence.
- **D-12:** Do not rely only on nearest-point projection or raw angle progress for validation. Use explicit gates so tests can prove correct order, skipped gates, and lap completion.
- **D-13:** The HUD should show current lap, next checkpoint, direction cue, and whether the player is on course.
- **D-14:** Keep checkpoint rules deterministic and isolated in pure helpers where practical, rather than embedding all geometry and validation directly in a large runtime file.

### Off-Track And Wrong-Way Handling
- **D-15:** Off-track behavior should be recoverable: apply a visible speed cap or slowdown and increment penalty state if the car remains outside the drivable ring beyond a short grace window.
- **D-16:** Wrong-way behavior should warn first, then apply a slowdown/penalty if it persists for roughly a second. Do not instantly fail or teleport the player for a brief mistake.
- **D-17:** Penalty feedback must be visible in both track feedback and React-rendered HUD text.
- **D-18:** Avoid player-to-player collision mechanics in the first circular analog implementation unless already trivial to preserve. The phase goal is analog control, checkpoints, laps, and penalties.

### Results And Multiplayer Fairness
- **D-19:** Results should rank by finish time, with penalty count available in the summary so the run is explainable.
- **D-20:** Server state remains authoritative. The client emits compact analog input intents; final position, speed, checkpoint, lap, penalties, and results are computed by the server runtime.
- **D-21:** Snapshot fields should expose enough state for a readable phone HUD: lap, next checkpoint, speed, analog/input state, off-track or wrong-way warning, penalty count, and finish state.
- **D-22:** Tune the first version for learnability: one clean one-player run should make the route and checkpoint loop obvious, and a two-player run should make smoother analog control produce a better time.

### Integration Shape
- **D-23:** Prefer a dedicated circular analog race identity such as `circle-track` instead of overloading old `sprint-circuit` behavior. If Phase 6 later renames/exposes the final catalog, keep this phase's mode identity easy to migrate.
- **D-24:** Use the active generic session event family: `client:game-input`, `server:session-state`, and `server:session-finished`. Do not build against stale race-specific socket events.
- **D-25:** If Phase 1 implementation artifacts are present by planning time, use `FullscreenGameShell`, `AnalogPad`, `GameHud`, and shared input contracts from that work. If they are not present yet, plan against the approved Phase 1 context and UI contract rather than inventing conflicting patterns.

### Claude's Discretion
### the agent's Discretion
- Exact analog sensitivity, drag, speed cap, turn damping, and grace-window constants.
- Exact number and placement of circular checkpoint gates, provided validation is deterministic and readable.
- Exact visual treatment for arrows, gates, off-track warning, and wrong-way warning.
- Whether the first implementation creates new helper modules under `apps/server/src/games/race/` or refactors reusable pieces out of `sprintCircuit.ts`, as long as new rules are tested and large runtime files do not grow unnecessarily.
- Exact route/page naming, provided the mode can be started and played through the existing session flow.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Figure-eight map, crossing/intersection behavior, and crossing-specific checkpoint ambiguity belong to Phase 5.
- Final lobby catalog polish, mode cards, and broad route/result polish belong to Phase 6.
- Simulation-grade tire physics, car handling differences, powerups, haptics, and advanced camera effects remain out of scope for this milestone's first analog circle.
- Player-to-player collision in analog track races is deferred unless it falls out naturally from existing helpers without risking analog control feel.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANLG-01 | Player can control a car with an analog-style touch pad that outputs continuous direction/magnitude. | Reuse `RaceAnalogInput`, `clampRaceAnalogVector`, `AnalogPad`, and `useGameControls`; server runtime must accept `kind: 'analog'` for `modeId: 'circle'`. [VERIFIED: packages/shared/src/game.ts; VERIFIED: apps/web/src/components/game/AnalogPad.tsx; VERIFIED: apps/web/src/components/game/useGameControls.ts] |
| ANLG-02 | Player can race on a circular track with checkpoint/lap validation. | Add dedicated `circle-track` contracts/runtime with explicit gate crossing helpers and tests for ordered gates, skipped gates, and start/finish lap completion. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; VERIFIED: apps/server/src/games/race/sprintCircuit.ts] |
| ANLG-04 | Runtime detects off-track or wrong-way behavior and applies clear feedback/penalties. | Track helper should classify radial distance against inner/outer ring and signed clockwise progress against expected gate order, then expose warning/penalty state in snapshot and HUD. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; CITED: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events] |
| ANLG-05 | Player can see lap, checkpoint, direction, speed, and penalty feedback during analog races. | `GameHud` already renders React-readable objective/progress/speed/penalty/input/status fields with a polite live region, but Phase 4 needs circle-specific labels for lap, gate, direction, course state, and penalty count. [VERIFIED: apps/web/src/components/game/GameHud.tsx; VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md] |
</phase_requirements>

## Summary

Phase 4 should implement a new dedicated `circle-track` race variant instead of mutating `sprint-circuit`, because the locked design requires a simple circular/oval ring, explicit checkpoint gates, analog magnitude-as-throttle input, and recoverable off-track/wrong-way penalties. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md]

The strongest implementation path is: extend shared race snapshot/variant contracts, add small pure circular geometry/rule helpers, wrap them in a server-authoritative runtime registered through `apps/server/src/games/registry.ts`, then render a new fullscreen circle page using existing Phase 1 `FullscreenGameShell`, `AnalogPad`, `useGameControls`, `GameViewport`, and `GameHud` primitives. [VERIFIED: packages/shared/src/game.ts; VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/games/registry.ts; VERIFIED: apps/web/src/components/game]

The riskiest areas are not library choice; they are deterministic gate crossing, avoiding canvas-only gameplay state, preventing stale race-specific socket usage, and keeping analog input forgiving on mobile. [VERIFIED: .planning/codebase/CONCERNS.md; VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]

**Primary recommendation:** Build `race:circle-track` as a new variant with shared `CircleTrackSnapshot` state, pure circle-rule helpers, `createCircleTrackRuntime()`, a new fullscreen `CircleTrackPage`, and focused tests before any visual polish. [VERIFIED: .planning/codebase/STRUCTURE.md; VERIFIED: apps/server/src/games/runtime.ts]

## Project Constraints (from AGENTS/session instructions)

- Keep the current pnpm workspace architecture. [VERIFIED: session AGENTS instructions; VERIFIED: package.json]
- Source of truth is `apps/**/src` and `packages/shared/src`; do not edit generated `dist` output or root legacy HTML for this phase. [VERIFIED: session AGENTS instructions; VERIFIED: .planning/codebase/CONCERNS.md]
- Server gameplay state is authoritative; client controls emit compact input intents only. [VERIFIED: session AGENTS instructions; VERIFIED: .planning/PROJECT.md]
- Shared socket/input/snapshot contracts belong in `packages/shared`. [VERIFIED: session AGENTS instructions; VERIFIED: packages/shared/src/contracts.ts; VERIFIED: packages/shared/src/game.ts]
- Prefer deterministic rule helpers with tests over adding more logic to large runtime files. [VERIFIED: session AGENTS instructions; VERIFIED: .planning/codebase/CONCERNS.md]
- Gameplay screens must be mobile-first and fullscreen. [VERIFIED: session AGENTS instructions; VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md]
- Required verification before implementation completion is `pnpm run build`, `pnpm test`, and focused package tests while iterating. [VERIFIED: session AGENTS instructions; VERIFIED: package.json]
- No `CLAUDE.md` file exists in the repository root, so no extra CLAUDE-specific directives were found. [VERIFIED: `test -f CLAUDE.md` returned false]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Analog input capture and keyboard fallback | Browser / Client | Shared Contracts | Pointer, keyboard, blur, visibility, and unmount lifecycle are browser concerns, while the emitted payload shape is shared. [VERIFIED: apps/web/src/components/game/useGameControls.ts; VERIFIED: packages/shared/src/game.ts] |
| Authoritative vehicle motion, speed, checkpoint, lap, off-track, wrong-way, penalties, and rankings | API / Backend | Shared Contracts | The server runtime owns game truth and results; shared types make snapshots and inputs explicit. [VERIFIED: apps/server/src/games/runtime.ts; VERIFIED: .planning/PROJECT.md] |
| Circle/oval rendering, route arrows, gates, car poses, warning color, and HUD composition | Browser / Client | API / Backend | Canvas draws the visual state, but it should render server snapshot values instead of locally inferring progress. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md; VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx] |
| Session transport and room broadcast | API / Backend | Browser / Client | Existing Socket.IO flow sends `client:game-input` and broadcasts `server:session-state`/`server:session-finished` to the lobby/session clients. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; CITED: https://socket.io/docs/v4/rooms/] |
| Lobby variant startability and route selection | Shared Contracts | Browser / Client, API / Backend | `PartyGameVariant`, startability, runtime registry, session route resolver, and router must all recognize `circle-track`. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/games/registry.ts; VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: apps/web/src/app/router.tsx] |
| Results explanation | API / Backend | Browser / Client | Runtime should emit ranking and summary fields; results page can render mode-specific summaries after Phase 4 data is available. [VERIFIED: apps/server/src/games/race/sprintCircuit.ts; VERIFIED: apps/web/src/pages/ResultsPage.tsx] |

## Standard Stack

### Core

| Library | Project Version | Current npm Version | Purpose | Why Standard |
|---------|-----------------|---------------------|---------|--------------|
| TypeScript | `^5.6.3` | `6.0.3`, modified 2026-04-16 | Cross-package type contracts, strict runtime input guards, server/web builds. | Already the workspace language and lint gate; do not change during Phase 4. [VERIFIED: package.json; VERIFIED: npm registry] |
| React | `^19.2.0` | `19.2.5`, modified 2026-04-24 | Fullscreen gameplay route, HUD, controls, and result UI. | Existing web app framework; Phase 4 should reuse current React route/component patterns. [VERIFIED: apps/web/package.json; VERIFIED: npm registry] |
| React Router DOM | `^7.9.4` | `7.14.2`, modified 2026-04-22 | Add the new circle session route and route resolver target. | Existing app uses route objects and `RouterProvider`; React Router docs identify `createBrowserRouter` inputs as route objects. [VERIFIED: apps/web/src/app/router.tsx; VERIFIED: npm registry; CITED: https://reactrouter.com/start/data/route-object] |
| Socket.IO / Socket.IO Client | `^4.8.3` | `4.8.3`, modified 2025-12-23 | Realtime game input, session snapshots, finish payloads, room broadcasts. | Existing generic event family is the active transport; Socket.IO docs support typed event emit/listen patterns and rooms for broadcast subsets. [VERIFIED: apps/server/package.json; VERIFIED: apps/web/package.json; VERIFIED: npm registry; CITED: https://socket.io/docs/v4/emitting-events/; CITED: https://socket.io/docs/v4/listening-to-events/; CITED: https://socket.io/docs/v4/rooms/] |
| Express | `^5.2.1` | `5.2.1`, modified 2026-04-16 | Server HTTP process and `/health`. | Keep unchanged; Phase 4 does not need new HTTP endpoints. [VERIFIED: apps/server/package.json; VERIFIED: apps/server/src/http/health.ts; VERIFIED: npm registry] |

### Supporting

| Library | Project Version | Current npm Version | Purpose | When to Use |
|---------|-----------------|---------------------|---------|-------------|
| Vitest | `^3.2.4` | `4.1.5`, modified 2026-04-23 | Web component/hook tests. | Use existing config for route, HUD, controls, and canvas-adjacent rendering tests; do not upgrade in this phase. [VERIFIED: apps/web/package.json; VERIFIED: apps/web/vite.config.ts; VERIFIED: npm registry] |
| Node built-in test runner | Node `v24.14.1` available locally | Built into Node | Server/shared deterministic tests. | Use for circle geometry/rule/runtime tests beside server modules. [VERIFIED: node --version; VERIFIED: apps/server/package.json; VERIFIED: packages/shared/package.json] |
| React Testing Library | `^16.3.0` | `16.3.2`, modified 2026-01-19 | DOM/user-facing tests for route/HUD/control availability. | Use role/text queries for HUD and controls; official docs encourage user-facing DOM tests. [VERIFIED: apps/web/package.json; VERIFIED: npm registry; CITED: https://testing-library.com/docs/react-testing-library/intro/] |
| Vite / `@vitejs/plugin-react` | Vite `^5.4.11`, plugin `^5.1.0` | Vite `8.0.10`, plugin `6.0.1` | Web build/test runner integration. | Keep current versions; Phase 4 only adds source and tests. [VERIFIED: apps/web/package.json; VERIFIED: apps/web/vite.config.ts; VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure circular geometry helpers | A physics engine such as Matter.js or planck.js | Too much dependency and tuning surface for a forgiving arcade ring; explicit gates/radial checks are smaller and more testable for Phase 4. [ASSUMED] |
| Existing `SprintCircuitPage` route and runtime | Fork or overload `sprint-circuit` | Overloading conflicts with locked `circle-track` identity and risks preserving old polyline/discrete behavior. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; VERIFIED: apps/server/src/games/race/sprintCircuit.ts] |
| New socket event names | Existing `client:game-input`, `server:session-state`, `server:session-finished` | New events would duplicate a stale parallel race event surface that codebase concerns already warn against. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: .planning/codebase/CONCERNS.md] |

**Installation:**
```bash
# No new runtime dependencies recommended for Phase 4.
pnpm install --frozen-lockfile
```

**Version verification:** Versions above were checked with `npm view <package> version time.modified` on 2026-04-25. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Player thumb / keyboard
        |
        v
AnalogPad + useGameControls
  - clamp vector
  - sequence + clientTimeMs
  - reset on blur/cancel/unmount
        |
        v
client:game-input { kind: "analog", modeId: "circle", vector }
        |
        v
Socket gateway -> GameManager.applyInput()
        |
        v
createCircleTrackRuntime()
  - validate RaceGameInput
  - apply analog acceleration/damping
  - classify off-track radial state
  - detect wrong-way persistence
  - test explicit gate crossings
        |
        +--> all players finished?
        |        |
        |        v
        |   server:session-finished + results summary
        |
        v
server:session-state { CircleTrackSnapshot }
        |
        v
CircleTrackPage
  - CircleTrackCanvas draws ring/gates/arrows/cars
  - React HUD renders lap/gate/speed/course/penalty
  - ResultsPage explains time/laps/penalties
```

This flow preserves server authority and keeps browser rendering derived from snapshot state. [VERIFIED: apps/server/src/games/manager.ts; VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]

### Recommended Project Structure

```text
packages/shared/src/
├── game.ts                 # Add CircleTrackSnapshot/player/course state types and guards.
├── lobby.ts                # Add PARTY_GAME_VARIANTS.circleTrack and startability.
└── contracts.test.ts       # Assert new variant/types/guard compatibility.

apps/server/src/games/race/
├── circleTrackRules.ts     # Pure circle geometry, gate, lap, off-track, wrong-way helpers.
├── circleTrackRules.test.ts
├── circleTrack.ts          # GameRuntimeInstance wrapper and finish/result emission.
└── circleTrack.test.ts

apps/web/src/game/
├── circleTrackCanvas.ts    # Browser-only canvas drawing for ring, arrows, gates, cars.
└── circleTrackCanvas.test.ts # Optional pure geometry/draw input tests if useful.

apps/web/src/pages/
├── CircleTrackPage.tsx
└── CircleTrackPage.test.tsx
```

This structure follows the existing shared/server/web ownership boundaries and keeps the large `sprintCircuit.ts` file from absorbing new analog rules. [VERIFIED: .planning/codebase/STRUCTURE.md; VERIFIED: .planning/codebase/CONCERNS.md]

### Pattern 1: Shared Discriminated Race Input

**What:** Use existing `RaceGameInput` with `kind: 'analog'`, `modeId: 'circle'`, sequence, timestamp, and clamped vector. [VERIFIED: packages/shared/src/game.ts]
**When to use:** Every analog pad, keyboard, and mouse-drag input emission for Phase 4. [VERIFIED: apps/web/src/components/game/useGameControls.ts]
**Example:**
```typescript
// Source: packages/shared/src/game.ts and apps/web/src/components/game/useGameControls.ts
submitInput({
  kind: 'analog',
  modeId: 'circle',
  sequence: nextSequence,
  clientTimeMs: Date.now(),
  vector: clampRaceAnalogVector({ x, y, magnitude }),
});
```

### Pattern 2: Pure Circle Rules Before Runtime Wiring

**What:** Put deterministic math in helper functions that take prior state, input, constants, and delta/tick data and return next player state plus events. [VERIFIED: .planning/codebase/CONCERNS.md]
**When to use:** Gate crossing, lap completion, radial off-track classification, wrong-way accumulation, speed cap, and finish time updates. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]
**Example:**
```typescript
// Source: recommended from local runtime/test pattern in apps/server/src/games/race/sprintCircuit.ts
export function advanceCirclePlayer(
  player: CircleTrackPlayerState,
  input: RaceAnalogInput,
  config: CircleTrackConfig,
): CircleTrackPlayerState {
  const vector = clampRaceAnalogVector(input.vector);
  const throttle = vector.magnitude;
  const targetAngle = Math.atan2(vector.y, vector.x);
  const nextSpeed = applyThrottleAndDrag(player.speed, throttle, config);
  const nextPose = integratePose(player, targetAngle, nextSpeed, config);
  return validateCircleProgress(player, nextPose, config);
}
```

### Pattern 3: Snapshot-Driven HUD and Canvas

**What:** The canvas should draw positions/gates/warnings from `CircleTrackSnapshot`, while React HUD text shows lap, gate, speed, direction, course state, and penalties. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md]
**When to use:** New `CircleTrackPage` should not infer checkpoint, penalty, or direction locally from canvas geometry. [VERIFIED: .planning/codebase/CONCERNS.md]
**Example:**
```typescript
// Source: apps/web/src/pages/SprintCircuitPage.tsx + Phase 4 UI contract
const hudSnapshot: RaceShellSnapshot = {
  ...commonSessionFields,
  modeId: 'circle',
  hud: {
    objective: 'Complete 3 laps clockwise',
    progressLabel: `Lap ${player.lap}/${snapshot.totalLaps}`,
    speedLabel: `${Math.round(player.speedKmh)} km/h`,
    penaltyLabel: player.courseState === 'penalty' ? `Penalty ${player.penalties}` : player.courseLabel,
    inputLabel,
    modeMetricLabel: 'Gate',
    modeMetricValue: `${player.nextCheckpoint}/${snapshot.totalCheckpoints}`,
  },
  mode: snapshot,
};
```

### Anti-Patterns to Avoid

- **Raw angle-only lap validation:** Angle can imply progress even when the player cuts across the infield or skips gates; explicit gates are required by the phase decisions. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]
- **Client-authoritative position or penalties:** Browser input is intent only; server computes authoritative outcome. [VERIFIED: .planning/PROJECT.md; VERIFIED: apps/server/src/games/runtime.ts]
- **Building against `server:race-snapshot` or `client:player-input`:** Those events remain in shared contracts but active server session flow uses generic session events. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: .planning/codebase/CONCERNS.md]
- **Canvas-only status:** HUD and warning state must be React text for tests and assistive tech. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md; VERIFIED: .planning/codebase/CONCERNS.md]
- **Adding right-side buttons as core mechanics:** Phase 4 skill loop is analog steering/speed; optional brake/reset must stay secondary. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pointer capture and touch lifecycle | Custom mouse/touch parallel handlers | Existing `AnalogPad` with Pointer Events, capture, `touch-action: none`, cancel/reset behavior | Pointer Events unify mouse/touch/pen and MDN documents `touch-action: none` for disabling default panning/zooming in a region. [VERIFIED: apps/web/src/components/game/AnalogPad.tsx; CITED: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events; CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture] |
| Keyboard fallback normalization | Page-specific WASD/Arrow listeners | Existing `useGameControls` | It already normalizes diagonals, sequences inputs, emits shared payloads, and resets lifecycle state. [VERIFIED: apps/web/src/components/game/useGameControls.ts; VERIFIED: apps/web/src/components/game/useGameControls.test.tsx] |
| Realtime transport family | New race-specific Socket.IO events | Existing `client:game-input`, `server:session-state`, `server:session-finished` | Existing server manager and hooks already use generic session events; Socket.IO supports event emit/listen and room broadcasts. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; CITED: https://socket.io/docs/v4/emitting-events/; CITED: https://socket.io/docs/v4/rooms/] |
| Fullscreen mobile shell | New page chrome and scroll layout | `FullscreenGameShell`, `GameViewport`, `GameHud`, `AnalogPad` | Phase 1 primitives exist and are covered by component tests. [VERIFIED: apps/web/src/components/game; VERIFIED: apps/web/src/components/game/FullscreenGameShell.test.tsx] |
| Results ranking plumbing | A separate results route | Existing `SessionFinishedPayload`, `GameResults`, `ResultsPage` plus summary rendering enhancement | Current result storage/navigation flow already handles session finish payloads. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx] |

**Key insight:** Hand-roll the circle game rules because they are the product-specific mechanic, but reuse the app/session/control scaffolding because it is already the local standard. [VERIFIED: .planning/PROJECT.md; VERIFIED: apps/web/src/components/game; VERIFIED: apps/server/src/games/runtime.ts]

## Common Pitfalls

### Pitfall 1: Wrong Coordinate Convention Between Analog Pad and Car Heading
**What goes wrong:** `AnalogPad` emits `y: -1` for up and `y: 1` for down, while canvas coordinates also increase downward; using `Math.atan2(y, x)` without deciding whether the car sprite points along +x or -y can rotate the car 90 or 180 degrees from input. [VERIFIED: apps/web/src/components/game/useGameControls.test.tsx; VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx]
**Why it happens:** Canvas transforms and thumb-stick vectors use related but not identical visual conventions. [VERIFIED: apps/web/src/components/game/AnalogPad.tsx]
**How to avoid:** Define one helper for `vectorToHeadingRadians()` and test cardinal directions before integrating runtime and drawing. [ASSUMED]
**Warning signs:** WASD up moves visually down, clockwise route feels counter-steered, or car sprite points sideways while moving. [ASSUMED]

### Pitfall 2: Checkpoint Tunneling At Higher Speed
**What goes wrong:** A player can move from before a gate to after it in one tick without the new position landing inside the gate rectangle/arc. [ASSUMED]
**Why it happens:** Gate collision checks that only inspect the final position miss segment crossings. [ASSUMED]
**How to avoid:** Validate crossing between previous and next positions/angles, not only the final pose, and keep first-pass speed modest. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]
**Warning signs:** Players visibly cross gates but HUD does not advance, especially after speed tuning. [ASSUMED]

### Pitfall 3: Off-Track Recovery Feels Like Failure
**What goes wrong:** Immediate teleport/fail penalties make the analog track feel punishing on phones. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]
**Why it happens:** Runtime applies penalties on first out-of-bounds sample instead of honoring a grace window. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]
**How to avoid:** Track `offTrackSinceMs` or tick count, warn first, then cap speed/increment penalty after the grace threshold. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]
**Warning signs:** New players rack up penalties within the first turn or cannot re-enter the track. [ASSUMED]

### Pitfall 4: Results Summary Exists In Runtime But Not Results UI
**What goes wrong:** Runtime emits lap/penalty summary, but `ResultsPage` only renders rankings and ignores `results.summary`. [VERIFIED: apps/web/src/pages/ResultsPage.tsx]
**Why it happens:** Existing results page predates mode-specific summaries. [VERIFIED: .planning/REQUIREMENTS.md]
**How to avoid:** Plan a small results UI task to render `Circle Track`, `Time`, `Laps`, and `Penalties` from `GameResults.summary`. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md]
**Warning signs:** Finish page only shows rank/time and cannot explain penalties. [VERIFIED: apps/web/src/pages/ResultsPage.tsx]

### Pitfall 5: Lobby Variant Is Registered Server-Side But Not Startable/Routable
**What goes wrong:** `createGameRuntimeRegistry()` resolves `race:circle-track`, but lobby startability or web route resolver still falls back to `/race/live/:sessionId`. [VERIFIED: apps/server/src/games/registry.ts; VERIFIED: apps/web/src/lib/sessionRoutes.ts]
**Why it happens:** Variant identity must be added in shared lobby constants, server registry, route resolver, router, and tests. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/web/src/app/router.tsx]
**How to avoid:** Plan a contract/startability/router task before runtime/page tasks. [VERIFIED: .planning/codebase/STRUCTURE.md]
**Warning signs:** Host can select but not start the mode, or circle sessions open the old sprint page. [VERIFIED: apps/web/src/lib/sessionRoutes.ts]

## Code Examples

Verified patterns from local sources and official docs:

### Runtime Registration

```typescript
// Source: apps/server/src/games/registry.ts
{
  key: 'race:circle-track',
  game: 'race',
  variant: 'circle-track',
  countdown: 3,
  createRuntime(lobby, sessionId, callbacks) {
    return createCircleTrackRuntime(lobby, sessionId, {
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

### Generic Session Input

```typescript
// Source: apps/web/src/lib/useGameSessionSocket.ts and Socket.IO emitting docs
const { session, finished, submitInput } = useGameSessionSocket(sessionId);
const controls = useGameControls({
  modeId: 'circle',
  enabled: session?.status === 'active',
  onInput: submitInput,
});
```

### Explicit Gate Validation Shape

```typescript
// Source: Phase 4 decisions; planner should implement as pure helper tests first
type GateResult =
  | { kind: 'none' }
  | { kind: 'next-gate'; checkpoint: number }
  | { kind: 'lap-complete'; lap: number }
  | { kind: 'wrong-gate'; expected: number; actual: number };

export function evaluateGateCrossing(
  previous: CirclePose,
  next: CirclePose,
  progress: CircleProgressState,
  gates: CircleGate[],
): GateResult {
  // Check segment/arc crossing against the expected gate first.
  // Wrong-gate detection is useful for HUD feedback but should warn before penalty.
  return { kind: 'none' };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy race-specific socket events like `client:player-input`, `server:race-snapshot`, and `server:race-finished` | Generic session event family `client:game-input`, `server:session-state`, `server:session-finished` | Current codebase map dated 2026-04-25 | Phase 4 must build on generic session hooks and avoid stale event names. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: .planning/codebase/CONCERNS.md] |
| Discrete `steer`, `accelerate`, `brake` input for `sprint-circuit` | Shared discriminated `RaceGameInput` with analog/button/action variants | Phase 1 work present in current source tree | Phase 4 can reuse analog input contracts and controls instead of inventing a new payload family. [VERIFIED: packages/shared/src/game.ts; VERIFIED: apps/web/src/components/game/useGameControls.ts] |
| Route pages inside normal app chrome for many app screens | Fullscreen gameplay route outside `AppLayout` for live race | Current router has `/race/live/:sessionId` outside `AppLayout` | Circle route should also be fullscreen and avoid `.panel`/`.card` layout. [VERIFIED: apps/web/src/app/router.tsx; VERIFIED: apps/web/src/pages/SprintCircuitPage.test.tsx] |
| Canvas-only or tiny pixel-font gameplay status | React-rendered HUD with `aria-live="polite"` and minimum readable labels | Phase 1 components present in current source tree | Circle HUD fields must be testable text and not only canvas drawings. [VERIFIED: apps/web/src/components/game/GameHud.tsx; VERIFIED: apps/web/src/components/game/GameHud.test.tsx; VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md] |

**Deprecated/outdated:**
- Building new gameplay against `useLiveRaceSocket` is discouraged because it casts generic session state to `RaceSnapshot` and carries old race assumptions; prefer `useGameSessionSocket` plus circle-specific snapshot narrowing. [VERIFIED: apps/web/src/lib/useLiveRaceSocket.ts; VERIFIED: apps/web/src/lib/useGameSessionSocket.ts]
- Reusing `sprint-circuit` polyline drawing conflicts with the Phase 4 circular/oval route contract. [VERIFIED: apps/web/src/game/sprintCircuitTrack.ts; VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A physics engine is unnecessary and pure helper math is preferable for the first circle track. | Standard Stack | If wrong, planner may under-estimate collision/vehicle dynamics complexity; mitigated because scope explicitly avoids simulation-grade physics. |
| A2 | A single `vectorToHeadingRadians()` helper with cardinal-direction tests is enough to prevent heading convention bugs. | Common Pitfalls | If wrong, extra runtime/canvas integration tests will be needed to validate screen-space movement. |
| A3 | Gate tunneling is a practical risk at higher speed if validation only checks final pose. | Common Pitfalls | If wrong, segment crossing tests may be extra work, but they still protect lap validation. |
| A4 | New players will perceive immediate off-track penalties as too punitive on phones. | Common Pitfalls | If wrong, tuning constants can be tightened after playtesting without changing architecture. |

## Open Questions (RESOLVED)

1. **RESOLVED: Should `circle-track` be exposed in the lobby before Phase 6?** [VERIFIED: .planning/ROADMAP.md]
   - What we know: Phase 4 must be startable/playable through the existing session flow, while Phase 6 owns final lobby catalog polish. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; VERIFIED: .planning/ROADMAP.md]
   - Resolution: Add minimal startability and route support now so Phase 4 can be played through the existing session flow. Defer full lobby catalog cards, polished selection copy, and broad catalog cleanup to Phase 6. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; VERIFIED: .planning/ROADMAP.md]

2. **RESOLVED: Should `ResultsPage` get generic summary rendering now?** [VERIFIED: apps/web/src/pages/ResultsPage.tsx]
   - What we know: Phase 4 success requires penalty/lap summary availability, and existing results page currently renders rankings only. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md; VERIFIED: apps/web/src/pages/ResultsPage.tsx]
   - Resolution: Add a small Circle Track summary renderer now for `results.summary.mode === 'Circle Track'`, showing `Time`, `Laps`, and `Penalties`. Avoid a broad result-page redesign and leave non-circle result polish to Phase 6. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: .planning/phases/04-circular-analog-track-race/04-UI-SPEC.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Server/shared tests, builds, package scripts | Yes | `v24.14.1` | Use project baseline Node 20+ if deployment differs. [VERIFIED: node --version; VERIFIED: .planning/codebase/STACK.md] |
| pnpm | Workspace scripts | Yes | `10.33.2` | None recommended; project is pnpm canonical. [VERIFIED: pnpm --version; VERIFIED: package.json] |
| npm registry access | Version verification only | Yes | npm queries succeeded | Use checked-in `pnpm-lock.yaml` if registry unavailable during execution. [VERIFIED: npm view commands; VERIFIED: pnpm-lock.yaml present] |
| Browser Pointer Events | AnalogPad runtime | Browser-dependent | MDN marks `setPointerCapture()` widely available since July 2020 | Current `AnalogPad` uses pointer events and reset fallbacks; no non-pointer fallback planned. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture; VERIFIED: apps/web/src/components/game/AnalogPad.tsx] |
| Docker | Not required by Phase 4 | Not checked | - | Render target uses pnpm build/start commands, not Docker. [VERIFIED: session AGENTS instructions] |

**Missing dependencies with no fallback:** None identified for planning and implementation. [VERIFIED: environment probes]

**Missing dependencies with fallback:** Browser/device manual testing is still needed for control feel, but architecture can proceed with existing tests and local browser verification. [VERIFIED: .planning/STATE.md; VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner for `apps/server` and `packages/shared`; Vitest `^3.2.4` with jsdom for `apps/web`. [VERIFIED: apps/server/package.json; VERIFIED: packages/shared/package.json; VERIFIED: apps/web/package.json; CITED: https://vitest.dev/config/environment.html] |
| Config file | `apps/web/vite.config.ts`; no Jest/Vitest config at root; server/shared use package scripts. [VERIFIED: apps/web/vite.config.ts; VERIFIED: find config command] |
| Quick run command | `pnpm --filter @blitz/server test` for runtime/rules, `pnpm --filter @blitz/web test -- CircleTrackPage` for page iteration if Vitest filter works in package context. [VERIFIED: apps/server/package.json; VERIFIED: apps/web/package.json] |
| Full suite command | `pnpm test` and `pnpm run build`. [VERIFIED: package.json; VERIFIED: session AGENTS instructions] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ANLG-01 | Analog vector emits continuous x/y/magnitude and resets correctly. | component/hook | `pnpm --filter @blitz/web test -- AnalogPad useGameControls` | Existing tests cover primitives; add page integration for circle. [VERIFIED: apps/web/src/components/game/AnalogPad.test.tsx; VERIFIED: apps/web/src/components/game/useGameControls.test.tsx] |
| ANLG-02 | Ordered gates advance checkpoint/lap; skipped gates do not complete lap; start/finish completes lap only after gates. | unit/runtime | `pnpm --filter @blitz/server test` | Missing; add `circleTrackRules.test.ts` and `circleTrack.test.ts`. [VERIFIED: apps/server/src/games/race/sprintCircuit.test.ts] |
| ANLG-04 | Off-track and wrong-way warn first, then apply slowdown/penalty after grace. | unit/runtime + page | `pnpm --filter @blitz/server test` and `pnpm --filter @blitz/web test -- CircleTrackPage` | Missing; add rule/runtime/page cases. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md] |
| ANLG-05 | HUD shows lap, gate, direction, speed, course/penalty state from server snapshot. | component/page | `pnpm --filter @blitz/web test -- CircleTrackPage GameHud` | Partial; `GameHud` exists but circle-specific page/HUD labels missing. [VERIFIED: apps/web/src/components/game/GameHud.test.tsx] |

### Sampling Rate

- **Per task commit:** Run the focused package test for touched package: shared contracts, server runtime, or web page/control tests. [VERIFIED: package scripts]
- **Per wave merge:** Run `pnpm --filter @blitz/shared test`, `pnpm --filter @blitz/server test`, and `pnpm --filter @blitz/web test`. [VERIFIED: package.json]
- **Phase gate:** Run `pnpm test` and `pnpm run build` before `/gsd-verify-work`. [VERIFIED: package.json; VERIFIED: session AGENTS instructions]

### Wave 0 Gaps

- [ ] `packages/shared/src/contracts.test.ts` / shared tests need assertions for `PARTY_GAME_VARIANTS.circleTrack`, startability, and circle snapshot/input shape if new exports are added. [VERIFIED: packages/shared/src/contracts.test.ts; VERIFIED: packages/shared/src/lobby.ts]
- [ ] `apps/server/src/games/race/circleTrackRules.test.ts` must be created for gate order, lap completion, skipped gate, off-track grace, wrong-way grace, and speed penalty. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md]
- [ ] `apps/server/src/games/race/circleTrack.test.ts` must be created for runtime start, analog input application, finish rankings, result summary, and state emission. [VERIFIED: apps/server/src/games/race/sprintCircuit.test.ts]
- [ ] `apps/web/src/pages/CircleTrackPage.test.tsx` must be created for fullscreen shell, no app chrome/card layout, analog controls, circle HUD copy, warnings, finish navigation, and generic session input. [VERIFIED: apps/web/src/pages/SprintCircuitPage.test.tsx]
- [ ] `apps/web/src/lib/sessionRoutes.test.ts` or router tests should cover `race/circle-track` session routing. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: apps/web/src/app/router.test.tsx]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No new auth in Phase 4 | Preserve existing socket-id membership model; do not broaden host/session permissions. [VERIFIED: .planning/codebase/ARCHITECTURE.md; VERIFIED: .planning/codebase/CONCERNS.md] |
| V3 Session Management | Yes, existing realtime session | Use `GameManager` and existing session events; do not create parallel session state. [VERIFIED: apps/server/src/games/manager.ts; VERIFIED: packages/shared/src/contracts.ts] |
| V4 Access Control | Yes, lobby/session player ownership | Runtime should ignore unknown player ids and non-active inputs like existing runtimes do. [VERIFIED: apps/server/src/games/manager.ts; VERIFIED: apps/server/src/games/race/sprintCircuit.ts] |
| V5 Input Validation | Yes | Use `isRaceGameInput`/`clampRaceAnalogVector`, mode checks, finite number guards, and server-side clamping; Socket.IO docs state argument validation is outside the library. [VERIFIED: packages/shared/src/game.ts; CITED: https://socket.io/docs/v4/listening-to-events/] |
| V6 Cryptography | No | Phase 4 does not introduce secrets, tokens, or cryptography. [VERIFIED: phase scope] |

### Known Threat Patterns for Blitz Realtime Gameplay

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed or extreme analog input values | Tampering | Clamp vector, ignore invalid `modeId`/`kind`, and compute authoritative state server-side. [VERIFIED: packages/shared/src/game.ts; VERIFIED: .planning/PROJECT.md] |
| High-frequency input spam | Denial of Service | Keep payload compact, avoid expensive per-input drawing/server work, and consider coalescing/throttling if tests/manual play show snapshot flood. [VERIFIED: .planning/codebase/CONCERNS.md] |
| Client fakes lap/checkpoint/finish | Tampering | Never accept lap/checkpoint/result fields from client input; runtime derives them from server state and gate helpers. [VERIFIED: apps/server/src/games/runtime.ts; VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md] |
| Stale socket id after mobile reconnect | Spoofing/Availability | Out of scope for Phase 4 unless it blocks playability; current known risk remains in project concerns. [VERIFIED: .planning/codebase/CONCERNS.md] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/04-circular-analog-track-race/04-CONTEXT.md` - locked Phase 4 decisions, deferred scope, and integration constraints. [VERIFIED: local file]
- `.planning/phases/04-circular-analog-track-race/04-UI-SPEC.md` - fullscreen, HUD, canvas, analog, copy, and results UI contract. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/PROJECT.md` - requirement mapping, phase boundary, active state, and project constraints. [VERIFIED: local files]
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/STACK.md` - architecture, risks, ownership boundaries, conventions, and stack. [VERIFIED: local files]
- `packages/shared/src/game.ts`, `packages/shared/src/contracts.ts`, `packages/shared/src/lobby.ts` - current shared contract surface. [VERIFIED: local files]
- `apps/server/src/games/runtime.ts`, `apps/server/src/games/registry.ts`, `apps/server/src/games/race/sprintCircuit.ts`, `apps/server/src/games/race/sprintCircuit.test.ts` - runtime interface, registry, reference race runtime, and current test style. [VERIFIED: local files]
- `apps/web/src/components/game/*`, `apps/web/src/lib/useGameSessionSocket.ts`, `apps/web/src/lib/sessionRoutes.ts`, `apps/web/src/app/router.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/pages/ResultsPage.tsx` - frontend controls, session hook, routing, reference fullscreen page, and result flow. [VERIFIED: local files]
- npm registry version checks for React, React Router DOM, Socket.IO, Socket.IO Client, Express, Vite, Vitest, TypeScript, React Testing Library, and Vite React plugin. [VERIFIED: npm registry]
- Socket.IO 4.x docs: emitting events, listening to events, rooms. [CITED: https://socket.io/docs/v4/emitting-events/; CITED: https://socket.io/docs/v4/listening-to-events/; CITED: https://socket.io/docs/v4/rooms/]
- MDN Pointer Events and `setPointerCapture()`. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events; CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture]
- Vitest environment config and React Testing Library introduction. [CITED: https://vitest.dev/config/environment.html; CITED: https://testing-library.com/docs/react-testing-library/intro/]
- React Router route object docs. [CITED: https://reactrouter.com/start/data/route-object]

### Secondary (MEDIUM confidence)

- None used for required claims. [VERIFIED: source list]

### Tertiary (LOW confidence)

- Assumptions A1-A4 in the Assumptions Log are based on engineering judgment and need validation through implementation tests or mobile playtesting. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - stack and package versions were verified locally and against npm; no new dependencies are recommended. [VERIFIED: package files; VERIFIED: npm registry]
- Architecture: HIGH - local source clearly shows shared contracts, server runtime registry, generic session hooks, and Phase 1 control primitives. [VERIFIED: codebase scan]
- Geometry/rule pattern: MEDIUM - explicit gates and pure helpers are locked by Phase 4 context, but exact gate math and tuning constants require implementation tests and mobile playtesting. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; ASSUMED]
- Pitfalls: MEDIUM - stale socket/canvas/HUD risks are verified; heading convention and tunneling risks are engineering assumptions to validate with tests. [VERIFIED: .planning/codebase/CONCERNS.md; ASSUMED]

**Research date:** 2026-04-25 [VERIFIED: system date]
**Valid until:** 2026-05-02 for npm/package currency; local architecture findings remain valid until source changes. [ASSUMED]
