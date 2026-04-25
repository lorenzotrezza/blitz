# Phase 03: Straight Obstacle Race - Research

**Researched:** 2026-04-25 [VERIFIED: current prompt]  
**Domain:** Server-authoritative straight obstacle race rules, shared Socket.IO contracts, mobile fullscreen React gameplay UI [VERIFIED: `.planning/ROADMAP.md`; `.planning/phases/03-straight-obstacle-race/03-CONTEXT.md`; `.planning/phases/03-straight-obstacle-race/03-UI-SPEC.md`]  
**Confidence:** HIGH for local architecture and integration points; MEDIUM for first-pass steering/obstacle tuning because phone feel must be play-tested after implementation [VERIFIED: local source audit; `.planning/phases/03-straight-obstacle-race/03-CONTEXT.md`]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Dodge Control Feel
- **D-01:** Use smooth horizontal steering for the straight obstacle race, not strict lane-snap movement.
- **D-02:** The track may still show clear visual lanes, but the car should slide continuously left and right so the player feels direct control on a phone.
- **D-03:** Input should map cleanly to the Phase 1 two-thumb shell: left/right steering intent on touch, with keyboard fallback for desktop.
- **D-04:** Collision math should evaluate the player's horizontal position against obstacle bounds, not only a discrete lane number.

### Obstacle Pattern Design
- **D-05:** Use seeded, readable obstacle waves rather than pure random spawns.
- **D-06:** Patterns should be deterministic enough for tests and fair multiplayer outcomes, while still escalating pressure over the run.
- **D-07:** Obstacles need enough preview distance/reaction time to be learnable on phone screens.
- **D-08:** The first implementation should focus on obstacle avoidance only. Do not carry over the old drag race pickup/powerup model into this mode.

### Hit Penalty And Recovery
- **D-09:** Hitting an obstacle applies an immediate visible speed drop and increments the obstacle hit count.
- **D-10:** A hit should create a short slowdown/recovery state, roughly 1-1.5 seconds for the first tune.
- **D-11:** One hit should hurt but remain recoverable; repeated hits should clearly affect final time and ranking.
- **D-12:** Slowdown state must be visible in both road feedback and React-rendered HUD text.

### Track And HUD Readability
- **D-13:** Use a warning-first phone layout: incoming obstacles should be readable from the road before they reach the car.
- **D-14:** HUD must show distance, speed, obstacle warnings, hit count, and current slowdown/penalty state.
- **D-15:** Keep critical HUD text large and sparse enough for mobile play; the player should read danger from the road, not from paragraphs.
- **D-16:** Key status should be React-rendered text, not only canvas graphics, so tests and accessibility checks can inspect it.

### Claude's Discretion
- Exact steering sensitivity and horizontal track width.
- Exact obstacle sizes, wave spacing, and first-pass difficulty curve.
- Exact visual treatment for warnings, collision flash, or slowdown state, provided feedback is immediate and readable.
- Whether the implementation creates a new `straight-obstacle` runtime/page or replaces an existing race variant route, as long as Phase 6 can expose the final catalog cleanly.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Gear shifting, RPM cueing, and shift performance summary belong to Phase 2.
- Analog pad steering, checkpoints, laps, off-track penalties, and wrong-way logic belong to Phases 4 and 5.
- Lobby catalog copy, mode cards, and broad result polish belong to Phase 6.
- Sound, haptics, camera shake, and advanced visual juice remain polish after the core mechanics work.
- Powerups and hazards beyond the initial obstacle race remain out of scope for this milestone's first dodge implementation.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DODGE-01 | Player can race on a straight map with active lane or horizontal positioning controls. | Add shared `StraightObstacleInput` with normalized `steerX`, implement continuous server-side horizontal movement, and render a `DodgeSteeringPad` using Phase 1 shell controls. [VERIFIED: `.planning/REQUIREMENTS.md`; `03-CONTEXT.md`; `03-UI-SPEC.md`; `packages/shared/src/game.ts`] |
| DODGE-02 | The runtime spawns readable obstacle patterns on the straight map. | Generate a deterministic obstacle plan from seeded wave templates in pure rule helpers; expose active and warning obstacles in snapshots for rendering and tests. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`; `AGENTS.md`] |
| DODGE-03 | Hitting an obstacle visibly slows the player and affects final result. | Server collision helper should increment hit count, drop speed immediately, enter 1-1.5s recovery, and rank by finish time affected by penalties. [VERIFIED: `03-CONTEXT.md`; `.planning/ROADMAP.md`] |
| DODGE-04 | Player can see obstacle warnings, current speed, distance, and slowdown/penalty state. | Add snapshot fields for distance, speed, warning state, hit count, and recovery; render them as React text outside canvas. [VERIFIED: `03-UI-SPEC.md`; `.planning/codebase/CONCERNS.md`] |
| DODGE-05 | Results show finish time and obstacle hit count. | Extend result entries or mode details so each player has finish time plus obstacle hits, then render a dodge-specific results summary. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/web/src/pages/ResultsPage.tsx`; `03-UI-SPEC.md`] |
</phase_requirements>

## Summary

Phase 3 should add a distinct `straight-obstacle` race variant instead of reusing drag gear or sprint circuit behavior. [VERIFIED: `03-CONTEXT.md`; `.planning/ROADMAP.md`] The current code has only `sprint-circuit` and `drag-sprint` registered runtimes, while `traffic-survival` exists as an unused shared variant value and is not startable or registered. [VERIFIED: `packages/shared/src/lobby.ts`; `apps/server/src/games/registry.ts`; `packages/shared/src/contracts.test.ts`] The most explicit path is to add `PARTY_GAME_VARIANTS.straightObstacle = 'straight-obstacle'`, register `race:straight-obstacle`, and route it to a new fullscreen page. [ASSUMED: project maintainers prefer a clear new variant name over reusing `traffic-survival`; risk is extra catalog cleanup in Phase 6]

The runtime should not advance only when the client sends steering input. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; `apps/web/src/lib/useLiveRaceSocket.ts`] Straight obstacle racing needs server-side time progression so a neutral driver still moves forward, obstacles pass at predictable distances, slowdown recovery expires, and multiplayer outcomes stay fair. [VERIFIED: `AGENTS.md`; `03-CONTEXT.md`] Use a server tick loop that stores each player's latest clamped steering intent and calls deterministic pure helpers such as `advanceStraightObstacleRace`, `generateObstaclePlan`, `detectObstacleHit`, and `buildStraightObstacleResults`. [VERIFIED: `AGENTS.md`; `.planning/codebase/CONCERNS.md`] [ASSUMED: a 50ms server tick is acceptable for the first tune; verify during implementation]

**Primary recommendation:** Add shared straight-obstacle input/snapshot/result contracts first, then implement pure rule helpers plus a small `createStraightObstacleRuntime` adapter, then build the fullscreen `StraightObstacleRacePage` with `DodgeRoadView`, `DodgeHud`, `DodgeSteeringPad`, and `DodgeResultsSummary`. [VERIFIED: `03-UI-SPEC.md`; `.planning/codebase/STRUCTURE.md`; `apps/server/src/games/runtime.ts`]

## Project Constraints (from AGENTS.md)

- Keep the current pnpm workspace architecture. [VERIFIED: `AGENTS.md`; `pnpm-workspace.yaml`; `package.json`]
- Treat `apps/**/src` and `packages/shared/src` as source of truth. [VERIFIED: `AGENTS.md`; `.planning/codebase/CONCERNS.md`]
- Keep server gameplay state authoritative. [VERIFIED: `AGENTS.md`; `.planning/codebase/ARCHITECTURE.md`; `apps/server/src/games/runtime.ts`]
- Put shared socket/input/snapshot contracts in `packages/shared`. [VERIFIED: `AGENTS.md`; `packages/shared/src/index.ts`]
- Prefer deterministic rule helpers with tests over adding more logic to large runtime files. [VERIFIED: `AGENTS.md`; `.planning/codebase/CONCERNS.md`]
- Gameplay screens must be mobile-first and fullscreen. [VERIFIED: `AGENTS.md`; `03-UI-SPEC.md`]
- Use `pnpm run build`, `pnpm test`, and focused package tests before claiming completion. [VERIFIED: `AGENTS.md`; `package.json`]
- Render Free remains the intended deployment target with build command `corepack enable && pnpm install --frozen-lockfile && pnpm run build`, start command `pnpm start`, and health check `/health`. [VERIFIED: `AGENTS.md`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Dodge input contract | Shared package | Browser / Client and API / Backend | Shared contracts are consumed by web and server; Phase 3 needs typed `steerX`, sequence, and timestamp intent. [VERIFIED: `packages/shared/src/contracts.ts`; `.planning/codebase/ARCHITECTURE.md`] |
| Physical steering pad and keyboard fallback | Browser / Client | Shared package | Pointer and keyboard events originate in React controls, then emit shared intent payloads. [VERIFIED: `03-UI-SPEC.md`] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture] |
| Horizontal movement, obstacle waves, collisions, slowdown, finish | API / Backend | Shared package | Server runtimes own authoritative gameplay state and should expose snapshots/results through shared types. [VERIFIED: `AGENTS.md`; `apps/server/src/games/runtime.ts`] |
| Obstacle rendering and road feedback | Browser / Client | API / Backend for values | Canvas/DOM rendering is presentation; obstacle positions, warnings, hits, and slowdown state come from server snapshots. [VERIFIED: `03-UI-SPEC.md`; `apps/web/src/pages/SprintCircuitPage.tsx`] |
| HUD and live status text | Browser / Client | API / Backend for values | HUD must be React-rendered text for tests and accessibility; values are authoritative in snapshots. [VERIFIED: `03-UI-SPEC.md`; `.planning/codebase/CONCERNS.md`] |
| Result hit counts and finish time | API / Backend | Browser / Client display | Runtimes emit `SessionFinishedPayload`; ResultsPage currently renders shared rankings and needs dodge-specific details. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; `apps/web/src/pages/ResultsPage.tsx`] |
| Lobby startability and registry | Shared package and API / Backend | Browser / Client lobby controls | Shared startability currently blocks unsupported race variants, and registry must resolve selected variant to runtime. [VERIFIED: `packages/shared/src/lobby.ts`; `apps/server/src/games/registry.ts`; `apps/web/src/pages/LobbyPage.tsx`] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@blitz/shared` | workspace package | Shared straight-obstacle input, snapshot, result, lobby variant, and socket payload types. | Existing contract boundary imported by both web and server. [VERIFIED: `packages/shared/src/index.ts`; `.planning/codebase/ARCHITECTURE.md`] |
| React / React DOM | package spec `^19.2.0`; registry current `19.2.5`, modified 2026-04-24 | Fullscreen page, HUD, controls, empty/error/result states. | Existing web app uses React; no new UI runtime is needed. [VERIFIED: `apps/web/package.json`; npm registry via `npm view react`] |
| React Router DOM | package spec `^7.9.4`; registry current `7.14.2`, modified 2026-04-22 | Add route mapping and session navigation for the straight-obstacle page. | Existing app uses route objects and memory-router tests. [VERIFIED: `apps/web/package.json`; `apps/web/src/app/router.tsx`; npm registry via `npm view react-router-dom`] [CITED: https://api.reactrouter.com/v7/functions/react-router.useNavigate.html] |
| Socket.IO / Socket.IO Client | package spec `^4.8.3`; registry current `4.8.3`, modified 2025-12-23 | Transport `client:game-input`, `server:session-state`, and `server:session-finished`. | Existing socket stack already has typed event maps; official docs support typed client/server events but warn that types do not replace validation. [VERIFIED: `apps/server/package.json`; `apps/web/package.json`; npm registry via `npm view socket.io`; npm registry via `npm view socket.io-client`] [CITED: https://socket.io/docs/v4/typescript/] |
| Node test runner | Node `v24.14.1` available | Server/runtime deterministic tests. | Existing server/shared packages use `node --import tsx --test`. [VERIFIED: `node --version`; `apps/server/package.json`; `packages/shared/package.json`] |

### Supporting

| Library / API | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| TypeScript | package spec `^5.6.3`; registry current `6.0.3`, modified 2026-04-16 | Shared discriminated unions, strict compile checks, helper tests. | Use existing configured dependency; do not upgrade in this gameplay phase. [VERIFIED: `apps/web/package.json`; `apps/server/package.json`; `packages/shared/package.json`; npm registry via `npm view typescript`] |
| Vite | package spec `^5.4.11`; registry current `8.0.10`, modified 2026-04-23 | Web build and Vitest environment. | Keep existing Vite line because build-tool upgrades are out of scope. [VERIFIED: `apps/web/package.json`; npm registry via `npm view vite`] |
| Vitest | package spec `^3.2.4`; registry current `4.1.5`, modified 2026-04-23 | Web page/control/HUD/result tests. | Existing web package uses `vitest run`. [VERIFIED: `apps/web/package.json`; npm registry via `npm view vitest`] |
| Testing Library React | package spec `^16.3.0`; registry current `16.3.2`, modified 2026-01-19 | DOM assertions for React-rendered HUD/control/result text. | Existing page tests already use Testing Library. [VERIFIED: `apps/web/package.json`; `apps/web/src/pages/SprintCircuitPage.test.tsx`; npm registry via `npm view @testing-library/react`] |
| Browser Pointer Events | Web platform API | Continuous steering pad, mouse-drag testing, pointer cancel/reset behavior. | Use pointer capture for drag stability and `pointercancel` handling for mobile interruptions. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture; https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event] |
| CSS `touch-action` | Web platform CSS | Prevent browser panning/zooming from stealing control gestures. | Apply `touch-action: none` to steering controls and gameplay surfaces that receive pointer drags. [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `straight-obstacle` variant/runtime | Reuse existing `traffic-survival` shared variant | `traffic-survival` is currently unused and not startable, but `straight-obstacle` matches the phase name and UI/spec language more directly. [VERIFIED: `packages/shared/src/lobby.ts`; `03-UI-SPEC.md`] [ASSUMED: new variant naming is acceptable] |
| Server tick using latest steering intent | Advance only inside `applyInput()` like current race runtimes | Input-driven advancement can stall neutral players and makes recovery timing dependent on client emission; a server tick better fits authoritative obstacle/recovery state. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; `AGENTS.md`] |
| Deterministic wave templates | Pure random obstacle spawns | Locked decisions require seeded, readable, testable patterns rather than pure random spawns. [VERIFIED: `03-CONTEXT.md`] |
| Shared generic `GameResultEntry.details` | Encode hit count only in ranking label text | Details are easier to render and test than parsing labels, while labels can still show a compact combined string. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/web/src/pages/ResultsPage.tsx`] [ASSUMED: extending `GameResultEntry` is acceptable in this milestone] |
| Phase 1 shell primitives | Another `.panel`/`.card` live page | Phase 3 UI contract explicitly forbids normal app-chrome race pages for active gameplay. [VERIFIED: `03-UI-SPEC.md`; `apps/web/src/pages/SprintCircuitPage.tsx`] |

**Installation:**
```bash
# No new runtime dependency is required for Phase 3.
# Use existing workspace dependencies and add code/tests only.
pnpm --filter @blitz/shared test
pnpm --filter @blitz/server test
pnpm --filter @blitz/web test -- StraightObstacleRacePage.test.tsx ResultsPage.test.tsx
```
[VERIFIED: `package.json`; `apps/server/package.json`; `apps/web/package.json`; `packages/shared/package.json`]

**Version verification:** `npm view` checks were run for `react`, `react-router-dom`, `socket.io`, `socket.io-client`, `vite`, `vitest`, `typescript`, `@testing-library/react`, `express`, and `jsdom` on 2026-04-25. [VERIFIED: npm registry via `npm view`]

## Architecture Patterns

### System Architecture Diagram

```text
Touch drag / keyboard left-right
  -> DodgeSteeringPad / keyboard listener
  -> useStraightObstacleControls
       - clamp steerX -1..1
       - increment sequence
       - reset on release/cancel/blur/visibility/unmount
  -> StraightObstacleInput
  -> Socket.IO client: client:game-input
  -> server socket gateway
  -> GameManager.applyInput(playerId, input)
  -> createStraightObstacleRuntime stores latest player intent
  -> server tick loop
       - advanceStraightObstacleRace()
       - apply horizontal movement
       - generate/select seeded obstacle waves
       - detect obstacle overlap
       - apply slowdown/recovery
       - detect finish and rankings
  -> GameSessionEnvelope<StraightObstacleSnapshot>
  -> Socket.IO server: server:session-state
  -> StraightObstacleRacePage
       - DodgeRoadView
       - DodgeHud React text
       - DodgeSteeringPad
  -> SessionFinishedPayload
  -> ResultsPage / DodgeResultsSummary
```
[VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`; `apps/server/src/games/manager.ts`; `apps/server/src/games/runtime.ts`; `03-UI-SPEC.md`]

### Recommended Project Structure

```text
packages/shared/src/
├── game.ts                         # StraightObstacleInput/Snapshot/Result detail types
├── lobby.ts                        # straight-obstacle variant and startability
├── contracts.ts                    # GameInputPayload includes dodge input union
└── contracts.test.ts               # export and shape coverage

apps/server/src/games/race/
├── straightObstacleRules.ts        # pure movement, waves, collision, slowdown, results
├── straightObstacleRules.test.ts   # deterministic helper tests
├── straightObstacle.ts             # runtime adapter with server tick lifecycle
└── straightObstacle.test.ts        # session lifecycle/runtime tests

apps/web/src/pages/
├── StraightObstacleRacePage.tsx
└── StraightObstacleRacePage.test.tsx

apps/web/src/components/game/
├── DodgeRoadView.tsx
├── DodgeHud.tsx
├── DodgeSteeringPad.tsx
└── DodgeResultsSummary.tsx
```
[VERIFIED: `.planning/codebase/STRUCTURE.md`; `03-UI-SPEC.md`; local source layout]

### Pattern 1: Shared Dodge Contract First

**What:** Define straight-obstacle input, player state, obstacle, warning, snapshot, and result-detail types in `packages/shared/src/game.ts`, then export them through `packages/shared/src/index.ts`. [VERIFIED: `AGENTS.md`; `packages/shared/src/game.ts`; `packages/shared/src/index.ts`]  
**When to use:** Do this before server or web work so both tiers compile against the same payload fields. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`]  
**Example:**
```typescript
// Source: local @blitz/shared as-const/type pattern in packages/shared/src/game.ts
export const STRAIGHT_OBSTACLE_STATUS = {
  clear: 'clear',
  warning: 'warning',
  slowdown: 'slowdown',
} as const;

export type StraightObstacleInput = {
  mode: 'straight-obstacle';
  kind: 'steer';
  steerX: number;
  sequence: number;
  clientTimeMs: number;
};
```
[VERIFIED: `packages/shared/src/game.ts` enum-like pattern] [ASSUMED: exact type names]

### Pattern 2: Server Tick Plus Latest Intent

**What:** `applyInput()` should validate and store each player's latest steering intent; a runtime-owned tick should advance distance, speed, obstacle proximity, collision, recovery, and finish state. [VERIFIED: `apps/server/src/games/runtime.ts`; `AGENTS.md`]  
**When to use:** Use for this mode because obstacle movement, slowdown recovery, and finish timing are time-based even when steering is neutral. [VERIFIED: `03-CONTEXT.md`]  
**Example:**
```typescript
// Source: existing runtime callback pattern in apps/server/src/games/race/sprintCircuit.ts
function handleTick(nowMs: number) {
  state = advanceStraightObstacleRace(state, latestInputByPlayerId, {
    nowMs,
    deltaMs: tickMs,
  });
  options.onState?.(state.envelope);
}
```
[VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`] [ASSUMED: exact helper signature]

### Pattern 3: Deterministic Wave Templates

**What:** Store obstacle waves as templates with world-distance offsets, horizontal center/width, and warning metadata, then select/rotate templates from a seed. [VERIFIED: `03-CONTEXT.md`]  
**When to use:** Use instead of pure random spawns so tests can assert exact waves and phone play has learnable reaction windows. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`]  
**Example:**
```typescript
// Source: recommended pure helper pattern from AGENTS.md and current runtime tests
export function generateObstaclePlan(seed: string, distanceTarget: number): StraightObstacle[] {
  return buildReadableWaves(seed).filter((obstacle) => obstacle.distance <= distanceTarget);
}
```
[VERIFIED: `AGENTS.md`; `apps/server/src/games/race/dragSprint.test.ts`] [ASSUMED: exact generator implementation]

### Pattern 4: Continuous Bounds Collision

**What:** Model player and obstacle bounds in normalized road coordinates, not discrete lanes. [VERIFIED: `03-CONTEXT.md`] Collision occurs when the player's front/back distance range overlaps the obstacle distance range and horizontal spans overlap. [ASSUMED: exact car/obstacle sizes need tuning]  
**When to use:** Use for every hit calculation and align rendered obstacle art to the same bounds. [VERIFIED: `03-UI-SPEC.md`]  
**Example:**
```typescript
// Source: Phase 3 continuous collision decision
export function spansOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  return aMin <= bMax && bMin <= aMax;
}
```
[VERIFIED: `03-CONTEXT.md`] [ASSUMED: helper name]

### Pattern 5: Mode-Specific Results Details

**What:** Add per-ranking `details` or equivalent typed metadata so each result row can expose `finishTimeMs` and `obstacleHits` without parsing label text. [VERIFIED: `DODGE-05`; `apps/web/src/pages/ResultsPage.tsx`] [ASSUMED: extending `GameResultEntry` is acceptable]  
**When to use:** Use when rendering `DodgeResultsSummary` and when tests assert obstacle hit counts. [VERIFIED: `03-UI-SPEC.md`]  
**Example:**
```typescript
// Source: existing GameResultEntry shape in packages/shared/src/contracts.ts
{
  playerId: player.playerId,
  rank: index + 1,
  label: `${formatFinishTime(finishTimeMs)} · ${player.obstacleHits} hits`,
  value: finishTimeMs,
  details: {
    finishTimeMs,
    obstacleHits: player.obstacleHits,
  },
}
```
[VERIFIED: `packages/shared/src/contracts.ts`] [ASSUMED: `details` field name]

### Anti-Patterns to Avoid

- **Reusing drag obstacles/pickups:** Phase 3 explicitly excludes drag pickup/powerup mechanics. [VERIFIED: `03-CONTEXT.md`; `apps/server/src/games/race/dragSprint.ts`]
- **Strict lane-only collision:** Locked decisions require continuous horizontal collision math. [VERIFIED: `03-CONTEXT.md`]
- **Canvas-only HUD state:** Required HUD values must be React-rendered text for tests and accessibility. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`; `.planning/codebase/CONCERNS.md`]
- **Client-authoritative hit detection:** Server gameplay state remains authoritative. [VERIFIED: `AGENTS.md`; `apps/server/src/games/runtime.ts`]
- **Adding logic to existing large race files:** Current race runtimes are already large; new rules should be smaller helper modules. [VERIFIED: `.planning/codebase/CONCERNS.md`; `apps/server/src/games/race/dragSprint.ts`; `apps/server/src/games/race/sprintCircuit.ts`]
- **Building against stale race-specific events:** Active flow uses `client:game-input`, `server:session-state`, and `server:session-finished`. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/server/src/socket/register.ts`; `.planning/codebase/CONCERNS.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Realtime transport | Custom WebSocket/event bus | Existing Socket.IO generic session event family | Socket.IO is already typed and wired through lobby/session lifecycle. [VERIFIED: `apps/server/src/socket/register.ts`; `apps/web/src/lib/useGameSessionSocket.ts`] [CITED: https://socket.io/docs/v4/emitting-events/] |
| Cross-tier contracts | Local-only web/server duplicate types | `packages/shared/src/game.ts` and `contracts.ts` | Shared contracts are the project boundary. [VERIFIED: `AGENTS.md`; `packages/shared/src/index.ts`] |
| Pointer gesture lifecycle | Separate ad hoc mouse/touch paths | Pointer Events with pointer capture, cancel handling, and `touch-action: none` | Official browser APIs cover mouse/touch/pen and mobile cancellation cases. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture; https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event; https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action] |
| Collision, slowdown, ranking logic embedded in runtime | More mutable code inside `dragSprint.ts` or `sprintCircuit.ts` | Pure `straightObstacleRules.ts` helpers with Node tests | Existing large runtime files are a documented risk. [VERIFIED: `.planning/codebase/CONCERNS.md`] |
| Results hit count parsing | Parse strings in `ResultsPage` | Typed result details or mode-specific result metadata | Parsing labels is brittle and hard to test. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/web/src/pages/ResultsPage.tsx`] [ASSUMED] |

**Key insight:** The hard part is not drawing cones; it is keeping server state, phone controls, collision math, HUD feedback, and result summaries aligned through one typed contract. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`; `AGENTS.md`]

## Common Pitfalls

### Pitfall 1: Neutral Input Stalls The Race
**What goes wrong:** If the runtime advances only on input events, a player who releases steering can stop progressing or stop recovering from slowdown. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; `apps/web/src/lib/useLiveRaceSocket.ts`]  
**Why it happens:** Existing race runtimes update inside `applyInput()` rather than a fixed race tick. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`]  
**How to avoid:** Store latest steering intent and advance the race from a server tick loop with injectable clock/timer hooks for tests. [VERIFIED: `apps/server/src/games/runtime.ts`] [ASSUMED: 50ms tick]  
**Warning signs:** Finish time changes based on client input frequency, slowdown never expires when input stops, or neutral players do not move. [ASSUMED]

### Pitfall 2: Obstacles Are Visible But Not Fair
**What goes wrong:** Obstacles spawn too close, overlap all safe paths, or use art that does not match hit boxes. [VERIFIED: `03-UI-SPEC.md`]  
**Why it happens:** Random spawns or disconnected render/collision bounds make patterns unreadable. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`]  
**How to avoid:** Use deterministic wave templates, assert preview distance, and share obstacle bounds between snapshot rendering and collision helper. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`]  
**Warning signs:** Tests cannot predict obstacle layout, first obstacle is unavoidable, or players report invisible hits. [ASSUMED]

### Pitfall 3: Drag Mechanics Leak Into Dodge
**What goes wrong:** Gear, RPM, shift summaries, pickups, or powerups appear in dodge mode. [VERIFIED: `02-CONTEXT.md`; `03-CONTEXT.md`; `03-UI-SPEC.md`]  
**Why it happens:** The old `dragSprint.ts` already contains lanes, obstacles, and pickups. [VERIFIED: `apps/server/src/games/race/dragSprint.ts`]  
**How to avoid:** Create a separate runtime and contracts for straight obstacle mode; do not import old drag pickup/powerup types into the new snapshot. [VERIFIED: `03-CONTEXT.md`]  
**Warning signs:** HUD or results mention RPM, shift quality, nitro, shield, pickups, or drag modes. [VERIFIED: `03-UI-SPEC.md`]

### Pitfall 4: Results Cannot Show Per-Player Hits
**What goes wrong:** Rankings display finish time but lose obstacle hit counts. [VERIFIED: `apps/web/src/pages/ResultsPage.tsx`; `packages/shared/src/contracts.ts`]  
**Why it happens:** Current `GameResultEntry` only has `label` and `value`; `GameResults.summary` is flat scalar metadata. [VERIFIED: `packages/shared/src/contracts.ts`]  
**How to avoid:** Add typed per-entry details or a mode-specific result detail structure and render it in a dodge summary component. [ASSUMED: exact result schema needs planner decision]  
**Warning signs:** Tests can only assert a combined label string, not `Obstacle hits` as a separate value. [ASSUMED]

### Pitfall 5: Fullscreen Contract Is Planned But Not Implemented
**What goes wrong:** Phase 3 builds another normal app-chrome `.panel` page because Phase 1 source primitives are not present yet. [VERIFIED: `grep` source audit found no `FullscreenGameShell`, `AnalogPad`, or `GameHud`; `.planning/STATE.md`]  
**Why it happens:** STATE says Phase 1 is planned, not executed. [VERIFIED: `.planning/STATE.md`]  
**How to avoid:** Make Phase 3 plans depend on Phase 1 execution outputs, or include a Wave 0 dependency check that blocks/adapts if shell primitives are absent. [VERIFIED: `03-UI-SPEC.md`; `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md`]  
**Warning signs:** New dodge route imports no Phase 1 shell/control primitives and renders inside `.panel live-panel`. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.tsx`; `03-UI-SPEC.md`]

## Code Examples

### Shared Input Contract
```typescript
// Source: local @blitz/shared patterns in packages/shared/src/game.ts
export type StraightObstacleInput = {
  mode: 'straight-obstacle';
  kind: 'steer';
  steerX: number;
  sequence: number;
  clientTimeMs: number;
};
```
[VERIFIED: `packages/shared/src/game.ts` pattern] [ASSUMED: exact names]

### Server Input Reader
```typescript
// Source: existing runtime input reader pattern in sprintCircuit.ts
function readStraightObstacleInput(input: GameInputPayload): StraightObstacleInput | null {
  if (input.mode !== 'straight-obstacle' || input.kind !== 'steer') return null;
  if (typeof input.steerX !== 'number' || !Number.isFinite(input.steerX)) return null;

  return {
    mode: 'straight-obstacle',
    kind: 'steer',
    steerX: clamp(input.steerX, -1, 1),
    sequence: readSequence(input.sequence),
    clientTimeMs: readClientTimeMs(input.clientTimeMs),
  };
}
```
[VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; Socket.IO docs validation warning] [CITED: https://socket.io/docs/v4/typescript/] [ASSUMED: exact helper names]

### Pure Collision Helper
```typescript
// Source: Phase 3 continuous bounds decision
export function hitsObstacle(player: PlayerBounds, obstacle: ObstacleBounds): boolean {
  return (
    spansOverlap(player.xMin, player.xMax, obstacle.xMin, obstacle.xMax) &&
    spansOverlap(player.distanceMin, player.distanceMax, obstacle.distanceMin, obstacle.distanceMax)
  );
}
```
[VERIFIED: `03-CONTEXT.md`] [ASSUMED: exact bounds model]

### Pointer Control Reset
```tsx
// Source: MDN pointer capture plus Phase 3 UI reset contract
function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
  event.currentTarget.setPointerCapture(event.pointerId);
  updateSteerFromPointer(event);
}

function resetSteer() {
  onSteerChange(0);
}
```
[CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture] [VERIFIED: `03-UI-SPEC.md`] [ASSUMED: exact component API]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic `GameInputPayload = Record<string, unknown>` only | Discriminated per-mode input unions | Required by Phase 1/3 planning, 2026-04-25 | Planner should type dodge input rather than pass arbitrary records. [VERIFIED: `packages/shared/src/contracts.ts`; `1-CONTEXT.md`; `03-CONTEXT.md`] |
| Panel/card live race route | Fullscreen mobile gameplay shell | Required by Phase 1/3 UI specs, 2026-04-25 | Dodge page must not mimic `SprintCircuitPage` layout. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.tsx`; `03-UI-SPEC.md`] |
| Lane-snap or old drag obstacle model | Continuous horizontal dodge with readable seeded waves | Locked by Phase 3 context, 2026-04-25 | Collision helper must use horizontal spans, not only lane numbers. [VERIFIED: `03-CONTEXT.md`] |
| Canvas-only status | React-rendered HUD plus road visuals | Required by codebase concerns and UI spec, 2026-04-25 | Tests should assert `Obstacle ahead`, `Hits`, `Speed`, and `Slowdown` text. [VERIFIED: `.planning/codebase/CONCERNS.md`; `03-UI-SPEC.md`] |

**Deprecated/outdated:**
- `client:player-input`, `server:race-snapshot`, and `server:race-finished` are stale for new Phase 3 work because active socket flow uses generic session events. [VERIFIED: `packages/shared/src/contracts.ts`; `apps/server/src/socket/register.ts`; `.planning/codebase/CONCERNS.md`]
- Old drag pickups/powerups are out of scope for dodge. [VERIFIED: `03-CONTEXT.md`; `apps/server/src/games/race/dragSprint.ts`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Add a new `straight-obstacle` variant instead of reusing `traffic-survival`. | Summary / Standard Stack | Planner may need to reuse existing variant for backward compatibility. |
| A2 | A 50ms server tick is acceptable for the first obstacle tune. | Summary / Architecture Patterns / Pitfalls | Too frequent may emit excessive snapshots; too slow may feel choppy. |
| A3 | Exact helper/type names can be chosen during planning. | Architecture Patterns / Code Examples | Low risk; names affect plan file paths and task boundaries. |
| A4 | `GameResultEntry.details` or equivalent per-entry metadata is acceptable. | Architecture Patterns / Pitfalls | If contract shape must remain unchanged, hit counts need another representation. |
| A5 | Initial car/obstacle bounds and tuning constants need implementation play-test. | Common Pitfalls / Code Examples | Wrong tuning can make the race too easy, unfair, or unreadable on phones. |

## Open Questions (RESOLVED)

1. **RESOLVED: Phase 3 introduces `straight-obstacle` and leaves `traffic-survival` untouched.**  
   - What we know: `traffic-survival` exists in shared variants but is not registered/startable. [VERIFIED: `packages/shared/src/lobby.ts`; `apps/server/src/games/registry.ts`]  
   - Resolution: Use `PARTY_GAME_VARIANTS.straightObstacle = 'straight-obstacle'`, register `race:straight-obstacle`, and keep `traffic-survival` unchanged for later catalog cleanup. [VERIFIED: `.planning/phases/03-straight-obstacle-race/03-01-PLAN.md`; `.planning/phases/03-straight-obstacle-race/03-03-PLAN.md`]

2. **RESOLVED: Extend result entries with optional typed details.**  
   - What we know: Current result entries have `label` and `value`; summary is flat scalar metadata. [VERIFIED: `packages/shared/src/contracts.ts`]  
   - Resolution: Add optional `details?: Record<string, string | number | boolean | null>` to `GameResultEntry` and use `details.finishTimeMs` plus `details.obstacleHits` for straight-obstacle results. Do not parse hit counts from ranking labels. [VERIFIED: `.planning/phases/03-straight-obstacle-race/03-01-PLAN.md`; `.planning/phases/03-straight-obstacle-race/03-06-PLAN.md`]

3. **RESOLVED: Phase 3 plans gate on Phase 1 and Phase 2 source outputs.**  
   - What we know: STATE says Phase 1 is planned and source audit found no shell primitives. [VERIFIED: `.planning/STATE.md`; source grep]  
   - Resolution: `03-01-PLAN.md` includes a prerequisite gate, and web plans read expected Phase 1 shell/control files. If those files are absent during execution, the executor must stop and report prerequisite phase not executed instead of inventing a duplicate shell. [VERIFIED: `.planning/phases/03-straight-obstacle-race/03-01-PLAN.md`; `.planning/phases/03-straight-obstacle-race/03-05-PLAN.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | server tests, shared tests, build scripts | Yes | `v24.14.1` | Use project scripts; Node 20+ practical baseline remains documented. [VERIFIED: `node --version`; `.planning/codebase/STACK.md`] |
| pnpm | workspace scripts | Yes | `10.33.2` | None needed. [VERIFIED: `pnpm --version`; root `package.json`] |
| corepack | deployment/build command | Yes | `0.34.7` | Use installed pnpm directly for local tests. [VERIFIED: `corepack --version`; `AGENTS.md`] |
| npm | registry version verification | Yes | `11.11.0` | None needed. [VERIFIED: `npm --version`] |
| Vitest/jsdom | web tests | Yes via package scripts | Vitest spec `^3.2.4`, jsdom registry current `29.0.2` | Existing `apps/web` test script. [VERIFIED: `apps/web/package.json`; `apps/web/vite.config.ts`; npm registry via `npm view jsdom`] |
| Socket.IO server/client | realtime gameplay | Yes via dependencies | `^4.8.3`, registry current `4.8.3` | No fallback; required by app architecture. [VERIFIED: `apps/server/package.json`; `apps/web/package.json`; npm registry] |

**Missing dependencies with no fallback:** None found for planning Phase 3. [VERIFIED: environment probes]  
**Missing dependencies with fallback:** `rg` is unavailable; use `grep`/`find` during planning/execution. [VERIFIED: failed `rg --files` probe]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Shared/server: Node test runner through `node --import tsx --test`; web: Vitest with jsdom. [VERIFIED: `packages/shared/package.json`; `apps/server/package.json`; `apps/web/package.json`; `apps/web/vite.config.ts`] |
| Config file | Web config: `apps/web/vite.config.ts`; server/shared use package scripts and TS configs. [VERIFIED: file audit] |
| Quick run command | `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts src/games/race/straightObstacle.test.ts` [ASSUMED: files to create] |
| Full suite command | `pnpm test` [VERIFIED: root `package.json`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DODGE-01 | Continuous horizontal steering changes player `x` while clamped to road bounds. | unit + runtime | `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts` | No - Wave 0 |
| DODGE-02 | Seeded obstacle plan is deterministic, readable, and leaves escape space. | unit | `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts` | No - Wave 0 |
| DODGE-03 | Obstacle collision increments hits, drops speed, enters recovery, and changes finish time. | unit + runtime | `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts src/games/race/straightObstacle.test.ts` | No - Wave 0 |
| DODGE-04 | HUD renders distance, speed, warning, hits, and slowdown state as React text. | web component/page | `pnpm --filter @blitz/web test -- StraightObstacleRacePage.test.tsx` | No - Wave 0 |
| DODGE-05 | Results show finish time and obstacle hit count. | shared + web | `pnpm --filter @blitz/shared test && pnpm --filter @blitz/web test -- ResultsPage.test.tsx` | Partial - `ResultsPage.test.tsx` exists, dodge coverage missing |

### Sampling Rate

- **Per task commit:** Run the focused command for changed package(s). [VERIFIED: `AGENTS.md`]  
- **Per wave merge:** Run `pnpm --filter @blitz/shared test`, `pnpm --filter @blitz/server test`, and `pnpm --filter @blitz/web test`. [VERIFIED: package scripts]  
- **Phase gate:** Run `pnpm run build` and `pnpm test`. [VERIFIED: `AGENTS.md`; root `package.json`]

### Wave 0 Gaps

- [ ] `packages/shared/src/contracts.test.ts` - add straight-obstacle input/snapshot/result shape coverage for DODGE-01 through DODGE-05. [VERIFIED: existing file]
- [ ] `apps/server/src/games/race/straightObstacleRules.test.ts` - create pure rule tests for steering, waves, collisions, slowdown, recovery, finish, and rankings. [VERIFIED: planned structure]
- [ ] `apps/server/src/games/race/straightObstacle.test.ts` - create runtime lifecycle/tick/registry integration tests. [VERIFIED: existing runtime test pattern]
- [ ] `apps/web/src/pages/StraightObstacleRacePage.test.tsx` - create route/HUD/control/finish-navigation tests. [VERIFIED: existing page test pattern]
- [ ] `apps/web/src/pages/ResultsPage.test.tsx` - extend with dodge result summary assertions. [VERIFIED: existing file]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No new auth in this phase | Existing socket identity remains `socket.id`; do not broaden host/session permissions. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; `apps/server/src/socket/register.ts`] |
| V3 Session Management | Yes, existing realtime session lifecycle | Use existing `GameManager` session/player indexes; do not add browser-authoritative session state. [VERIFIED: `apps/server/src/games/manager.ts`] |
| V4 Access Control | Yes, lobby/session start remains host-gated | Preserve existing lobby host checks; dodge inputs apply only through `GameManager.applyInput(socket.id, payload)`. [VERIFIED: `apps/server/src/socket/register.ts`; `apps/server/src/games/manager.ts`] |
| V5 Input Validation | Yes | Clamp and validate `steerX`, sequence, mode/kind, and payload shape server-side; TypeScript socket hints do not replace runtime validation. [CITED: https://socket.io/docs/v4/typescript/] [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts` input readers] |
| V6 Cryptography | No new cryptography | Do not add custom crypto or persistence. [VERIFIED: phase scope in `03-CONTEXT.md`] |

### Known Threat Patterns for Blitz Socket Gameplay

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client sends out-of-range `steerX` or malformed payload | Tampering | Server-side input reader rejects wrong mode/kind and clamps numeric intent. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; Socket.IO docs] |
| Client floods `client:game-input` | Denial of Service | Runtime should keep only latest steering intent per player per sequence and ignore stale/non-finite payloads; broader rate limiting remains a project concern. [VERIFIED: `.planning/codebase/CONCERNS.md`] [ASSUMED: per-sequence stale handling] |
| Client claims hit count, speed, distance, or finish | Tampering | Shared input must contain intent only; server computes hits, speed, distance, recovery, and results. [VERIFIED: `AGENTS.md`; `03-CONTEXT.md`] |
| Canvas-only warning hides critical state from tests/assistive tech | Information Disclosure/Usability risk | Render warning and slowdown as React text with live-region transitions. [VERIFIED: `03-UI-SPEC.md`; `.planning/codebase/CONCERNS.md`] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project engineering rules, source-of-truth paths, server-authoritative state, verification commands. [VERIFIED: local file]
- `.planning/phases/03-straight-obstacle-race/03-CONTEXT.md` - locked Phase 3 decisions and deferred scope. [VERIFIED: local file]
- `.planning/phases/03-straight-obstacle-race/03-UI-SPEC.md` - approved UI/control/HUD/results contract. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` - DODGE-01 through DODGE-05 and success criteria. [VERIFIED: local files]
- `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `STACK.md` - local architecture, risks, layout, conventions, and stack. [VERIFIED: local files]
- `packages/shared/src/game.ts`, `contracts.ts`, `lobby.ts`, `apps/server/src/games/runtime.ts`, `manager.ts`, `registry.ts`, `apps/server/src/socket/register.ts`, `apps/web/src/lib/useGameSessionSocket.ts`, `apps/web/src/app/router.tsx`, `apps/web/src/pages/ResultsPage.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx` - implementation integration points. [VERIFIED: local files]
- npm registry via `npm view` - current versions and modified timestamps for core packages. [VERIFIED: npm registry]

### Primary External Docs (HIGH confidence)

- https://socket.io/docs/v4/typescript/ - typed server/client events and validation caveat. [CITED: official docs, last updated 2026-02-24]
- https://socket.io/docs/v4/emitting-events/ - emit/listen behavior and serializable event payloads. [CITED: official docs, last updated 2026-02-24]
- https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture - pointer capture behavior. [CITED: MDN]
- https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event - pointer cancellation behavior. [CITED: MDN]
- https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action - `touch-action` behavior for touch gestures. [CITED: MDN]
- https://api.reactrouter.com/v7/functions/react-router.useNavigate.html - navigation API used by current session/results flow. [CITED: official API docs]

### Secondary (MEDIUM confidence)

- None used. [VERIFIED: source list]

### Tertiary (LOW confidence)

- Assumptions listed in the Assumptions Log only. [VERIFIED: Assumptions Log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package files, npm registry, and official docs. [VERIFIED: package files; npm registry; official docs]
- Architecture: HIGH - verified from local architecture docs and source files. [VERIFIED: local docs and source audit]
- Gameplay tuning: MEDIUM - structural approach is verified, but exact speed, obstacle spacing, and recovery constants require phone play-test. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] [ASSUMED: exact constants]
- Result schema extension: MEDIUM - current contracts show a gap, but the exact extension shape is a planning decision. [VERIFIED: `packages/shared/src/contracts.ts`] [ASSUMED: `details` field]

**Research date:** 2026-04-25 [VERIFIED: current prompt]  
**Valid until:** 2026-05-25 for local architecture; 2026-05-02 for package version freshness. [ASSUMED: dependency freshness horizon]
