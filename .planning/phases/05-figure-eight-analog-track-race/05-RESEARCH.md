# Phase 05: Figure-Eight Analog Track Race - Research

**Researched:** 2026-04-25T21:46:10Z [VERIFIED: `date -u +%Y-%m-%dT%H:%M:%SZ`]
**Domain:** Server-authoritative analog track racing, figure-eight geometry, explicit checkpoint/lap validation through a crossing, and mobile fullscreen gameplay UI [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `.planning/REQUIREMENTS.md`]
**Confidence:** HIGH for local architecture and required integration points; MEDIUM for exact figure-eight geometry/tuning because Phase 4 circle helpers are planned but not present in current source yet [VERIFIED: `find apps/server/src/games/race apps/web/src/game apps/web/src/pages packages/shared/src`; VERIFIED: `.planning/phases/04-circular-analog-track-race/04-01-PLAN.md` through `04-05-PLAN.md`]

<user_constraints>
## User Constraints (from CONTEXT.md)

Source: copied from `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]

### Locked Decisions
## Implementation Decisions

### Crossing Readability
- **D-01:** Use an intentional crossing treatment so the intersection reads as designed, not broken. Recommended first-pass treatment: one path visually passes over the other with bridge/underpass styling, plus directional arrows through the active route.
- **D-02:** Highlight the next intended path through the crossing, especially as the player approaches the center. The track itself should tell the player which lobe comes next before relying on HUD text.
- **D-03:** Add crossing-specific feedback only when useful, such as "crossing" or "next gate" cue text, but keep HUD sparse enough for phone play.
- **D-04:** Do not use player-to-player collision or traffic behavior at the crossing in this phase. The crossing challenge is route readability and checkpoint order, not collision chaos.

### Checkpoint Order Through The Eight
- **D-05:** Use explicit ordered checkpoint gates across both lobes and the center crossing. Do not validate figure-eight progress from nearest-point projection alone.
- **D-06:** Include center-crossing gates and lobe-specific gates so tests can prove the player completed the intended left/right lobe sequence instead of cutting across the middle.
- **D-07:** A lap completes only after the player traverses the full ordered figure-eight sequence and crosses the start/finish gate in the correct order.
- **D-08:** Checkpoint state should expose the next gate, lap, direction cue, and whether the player is on the expected lobe/path for React HUD and tests.

### Penalty Behavior At The Crossing
- **D-09:** Carry forward Phase 4's warning-first penalty model: warn quickly for wrong lobe, wrong-way, or center-cut behavior, then apply slowdown/penalty if it persists.
- **D-10:** Treat brief mistakes at the crossing as recoverable. Do not instantly fail, teleport, or hard reset the player for one ambiguous movement.
- **D-11:** Cutting across the middle to skip a lobe should not advance progress. If repeated or sustained, it should increment penalty state and apply the same visible speed cap/slowdown family as Phase 4.
- **D-12:** Penalty feedback must be visible in both track feedback and React-rendered HUD text.

### Difficulty And Track Feel
- **D-13:** Make the figure-eight clearly more complex than the circle, but still forgiving enough for the first phone-playable version.
- **D-14:** Use broad road width and readable turn radii for the first implementation. Difficulty should come from crossing awareness and ordered path following, not tiny margins.
- **D-15:** Tune the first pass so a clean one-player run makes the figure-eight route obvious, and a two-player run rewards smoother analog control with fewer penalties and faster finish time.
- **D-16:** Existing circular analog tests must keep passing. Shared helpers should be extended carefully so figure-eight support does not regress Phase 4 behavior.

### Claude's Discretion
### the agent's Discretion
- Exact figure-eight geometry, checkpoint count, and start/finish placement, provided the crossing order is deterministic and readable.
- Exact bridge/underpass visual treatment, arrow styling, gate colors, and next-path highlight behavior.
- Exact warning grace windows, slowdown constants, and penalty thresholds, provided they preserve the warning-first, recoverable mistake model.
- Whether the implementation creates a new figure-eight runtime/helper module or extends reusable analog track helpers from Phase 4, provided large runtime files do not grow unnecessarily and deterministic tests cover the geometry.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Final lobby catalog copy, mode cards, route naming polish, and broad result polish belong to Phase 6.
- Simulation-grade physics, car-specific handling, powerups, haptics, sound, and advanced camera effects remain out of scope for this milestone's first figure-eight implementation.
- Player-to-player collision or traffic conflict at the center crossing is deferred; it would add chaos before the base route is proven readable.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANLG-03 | Player can race on a figure-eight track with checkpoint/lap validation and readable crossing/intersection behavior. [VERIFIED: `.planning/REQUIREMENTS.md`] | Implement a dedicated figure-eight variant/runtime/page with explicit ordered gates, center-crossing gates, lobe-specific gates, warning-first crossing penalties, and React HUD fields for next gate/lap/direction/course state. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `packages/shared/src/game.ts`; VERIFIED: `apps/web/src/components/game/GameHud.tsx`] |
</phase_requirements>

## Summary

Phase 5 should add a dedicated figure-eight analog track rather than inheriting the old `sprint-circuit` polyline semantics, because the locked decision requires explicit ordered gates through both lobes and the center crossing. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; VERIFIED: `apps/web/src/game/sprintCircuitTrack.ts`]

The strongest plan is to build or extend the Phase 4 analog rule layer with a track-agnostic gate validator, then add figure-eight-specific track definition, runtime registration, route/page rendering, and tests. [VERIFIED: `.planning/phases/04-circular-analog-track-race/04-02-PLAN.md`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `.planning/codebase/STRUCTURE.md`]

Current source does not yet include the planned Phase 4 `circleTrackRules.ts`, `circleTrack.ts`, `CircleTrackPage.tsx`, or `circle-track` variant files, so the Phase 5 plan must start with a prerequisite gate that verifies Phase 4 landed before depending on those helpers. [VERIFIED: `find apps/server/src/games/race apps/web/src/game apps/web/src/pages packages/shared/src`; VERIFIED: `.planning/STATE.md`; VERIFIED: `.planning/phases/04-circular-analog-track-race/04-01-PLAN.md`]

**Primary recommendation:** Plan Phase 5 as `figure-eight-track` with shared variant/snapshot fields, pure `figureEightTrackRules.ts` geometry tests, `createFigureEightTrackRuntime()`, `FigureEightTrackPage`, route/result wiring, and a regression gate that runs the existing circular analog tests unchanged. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `.planning/codebase/TESTING.md`]

## Project Constraints (from AGENTS.md)

- Keep the pnpm workspace architecture. [VERIFIED: `AGENTS.md`; VERIFIED: `pnpm-workspace.yaml`]
- Treat `apps/**/src` and `packages/shared/src` as source of truth; do not edit generated `dist` output. [VERIFIED: `AGENTS.md`; VERIFIED: `.planning/codebase/CONCERNS.md`]
- Server gameplay state is authoritative. [VERIFIED: `AGENTS.md`; VERIFIED: `.planning/PROJECT.md`]
- Put shared socket/input/snapshot contracts in `packages/shared`. [VERIFIED: `AGENTS.md`; VERIFIED: `packages/shared/src/contracts.ts`; VERIFIED: `packages/shared/src/game.ts`]
- Prefer deterministic rule helpers with tests over adding more logic to large runtime files. [VERIFIED: `AGENTS.md`; VERIFIED: `.planning/codebase/CONCERNS.md`]
- Gameplay screens must be mobile-first and fullscreen. [VERIFIED: `AGENTS.md`; VERIFIED: `apps/web/src/components/game/FullscreenGameShell.tsx`; VERIFIED: `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md`]
- Required completion checks are `pnpm run build`, `pnpm test`, and focused tests for changed packages while iterating. [VERIFIED: `AGENTS.md`; VERIFIED: `package.json`; VERIFIED: `.planning/codebase/TESTING.md`]
- No root `CLAUDE.md` exists, so no CLAUDE-specific directives were found. [VERIFIED: `test -f CLAUDE.md && sed ... || true` returned no content]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Analog input capture and keyboard fallback | Browser / Client | Shared Contracts | `AnalogPad` and `useGameControls` already own pointer/keyboard lifecycle and emit typed `RaceGameInput`; shared contracts define the intent payload. [VERIFIED: `apps/web/src/components/game/AnalogPad.tsx`; VERIFIED: `apps/web/src/components/game/useGameControls.ts`; VERIFIED: `packages/shared/src/game.ts`] |
| Figure-eight gate/lap/crossing validation | API / Backend | Shared Contracts | Server runtimes own authoritative player pose, checkpoint, lap, penalty, and result state; shared types should expose output fields but not accept client authority. [VERIFIED: `apps/server/src/games/runtime.ts`; VERIFIED: `.planning/PROJECT.md`; VERIFIED: `packages/shared/src/contracts.ts`] |
| Figure-eight visual readability | Browser / Client | API / Backend | Canvas should draw bridge/underpass styling, arrows, gates, car poses, and warnings from server snapshots; React HUD should render next gate/direction/course text. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `apps/web/src/pages/SprintCircuitPage.tsx`; VERIFIED: `apps/web/src/components/game/GameHud.tsx`] |
| Variant startability and registry resolution | Shared Contracts | API / Backend, Browser / Client | `PARTY_GAME_VARIANTS`, `isLobbySelectionStartable`, `createGameRuntimeRegistry`, and route resolution must agree on the new figure-eight identity. [VERIFIED: `packages/shared/src/lobby.ts`; VERIFIED: `apps/server/src/games/registry.ts`; VERIFIED: `apps/web/src/lib/sessionRoutes.ts`] |
| Session transport | API / Backend | Browser / Client | Existing flow uses `client:game-input`, `server:session-state`, and `server:session-finished`; Phase 5 should not use stale race-specific events. [VERIFIED: `packages/shared/src/contracts.ts`; VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`; VERIFIED: `.planning/codebase/CONCERNS.md`] |
| Results explanation | API / Backend | Browser / Client | Runtime should emit rankings and summary data; `ResultsPage` can display mode-specific summary once it is wired. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; VERIFIED: `apps/web/src/pages/ResultsPage.tsx`; VERIFIED: `.planning/phases/04-circular-analog-track-race/04-05-PLAN.md`] |

## Standard Stack

### Core

| Library | Project Version | Current Registry Version | Purpose | Why Standard |
|---------|-----------------|--------------------------|---------|--------------|
| TypeScript | `^5.6.3` [VERIFIED: `apps/web/package.json`; VERIFIED: `apps/server/package.json`; VERIFIED: `packages/shared/package.json`] | `6.0.3`, modified `2026-04-16T23:38:28.092Z` [VERIFIED: npm registry] | Shared contracts, strict server/runtime types, and package builds. [VERIFIED: `tsconfig.base.json`; VERIFIED: `.planning/codebase/CONVENTIONS.md`] | Existing workspace language and lint/build gate; do not upgrade in Phase 5. [VERIFIED: `package.json`] |
| React | `^19.2.0` [VERIFIED: `apps/web/package.json`] | `19.2.5`, modified `2026-04-24T16:35:06.177Z` [VERIFIED: npm registry] | Fullscreen page, HUD, controls, and results rendering. [VERIFIED: `apps/web/src/app/router.tsx`; VERIFIED: `apps/web/src/components/game`] | Existing web framework; Phase 5 should reuse route/component patterns. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`] |
| React Router DOM | `^7.9.4` [VERIFIED: `apps/web/package.json`] | `7.14.2`, modified `2026-04-22T17:44:43.292Z` [VERIFIED: npm registry] | Add a top-level fullscreen route for figure-eight sessions. [VERIFIED: `apps/web/src/app/router.tsx`] | Existing router uses route objects and `RouterProvider`. [VERIFIED: `apps/web/src/app/router.tsx`] |
| Socket.IO / Socket.IO Client | `^4.8.3` [VERIFIED: `apps/server/package.json`; VERIFIED: `apps/web/package.json`] | `4.8.3`, modified `2025-12-23T16:42:13.331Z` server and `2025-12-23T16:39:16.787Z` client [VERIFIED: npm registry] | Realtime input and session snapshot transport. [VERIFIED: `packages/shared/src/contracts.ts`; VERIFIED: `apps/server/src/socket/register.ts`] | Existing lobby/session infrastructure already uses Socket.IO event contracts. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; CITED: https://socket.io/docs/v4/emitting-events/] |
| Express | `^5.2.1` [VERIFIED: `apps/server/package.json`] | Not rechecked for Phase 5 because no new HTTP endpoint is required. [VERIFIED: `apps/server/src/http/health.ts`] | Server process and `/health`. [VERIFIED: `apps/server/src/app.ts`; VERIFIED: `apps/server/src/http/health.ts`] | Keep unchanged; Phase 5 is Socket.IO/gameplay work. [VERIFIED: `.planning/ROADMAP.md`] |

### Supporting

| Library / Tool | Project Version | Current Registry / Local Version | Purpose | When to Use |
|----------------|-----------------|----------------------------------|---------|-------------|
| Vitest | `^3.2.4` [VERIFIED: `apps/web/package.json`] | `4.1.5`, modified `2026-04-23T10:30:15.171Z` [VERIFIED: npm registry] | Web page/canvas/helper tests. [VERIFIED: `apps/web/vite.config.ts`; VERIFIED: `.planning/codebase/TESTING.md`] | Use for `FigureEightTrackPage`, route, HUD, and canvas helper tests; do not upgrade. [VERIFIED: `apps/web/package.json`] |
| React Testing Library | `^16.3.0` [VERIFIED: `apps/web/package.json`] | `16.3.2`, modified `2026-01-19T10:59:08.691Z` [VERIFIED: npm registry] | User-visible DOM assertions for fullscreen route/HUD/controls. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.test.tsx`; VERIFIED: `.planning/codebase/TESTING.md`] | Use role/text queries for the gameplay route and HUD. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.test.tsx`] |
| Node built-in test runner | Node `v24.14.1` locally [VERIFIED: `node --version`] | Built into Node. [VERIFIED: `node --version`] | Server/shared deterministic rule and runtime tests. [VERIFIED: `apps/server/package.json`; VERIFIED: `packages/shared/package.json`] | Use for `figureEightTrackRules.test.ts`, runtime tests, and shared contract tests. [VERIFIED: `.planning/codebase/TESTING.md`] |
| pnpm | `10.33.2` workspace manager [VERIFIED: `package.json`; VERIFIED: `pnpm --version`] | `10.33.2` local. [VERIFIED: `pnpm --version`] | Workspace scripts and package filters. [VERIFIED: `package.json`] | Use existing root/package commands. [VERIFIED: `AGENTS.md`; VERIFIED: `.planning/codebase/TESTING.md`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated `figure-eight-track` variant | Overload `sprint-circuit` | Overloading preserves ambiguous old polyline semantics and conflicts with the locked requirement for readable crossing behavior. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |
| Pure gate/crossing helpers | A physics engine | A physics engine is unnecessary for explicit checkpoint/lap order and would add tuning/dependency surface to a no-new-dependency phase. [ASSUMED] |
| Generic session hook | `useLiveRaceSocket` | `useLiveRaceSocket` currently filters only `PARTY_GAME_VARIANTS.sprintCircuit`, so Phase 5 should use or adapt `useGameSessionSocket`/a variant-aware hook. [VERIFIED: `apps/web/src/lib/useLiveRaceSocket.ts`; VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`] |

**Installation:**
```bash
# No new runtime dependencies recommended for Phase 5. [VERIFIED: package.json; VERIFIED: npm registry checks]
pnpm install --frozen-lockfile
```

**Version verification:** Registry versions above were checked with `npm view <package> version time.modified` on 2026-04-25. [VERIFIED: npm registry]

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
client:game-input { kind: "analog", modeId: "figure-eight", vector }
        |
        v
Socket gateway -> GameManager.applyInput()
        |
        v
createFigureEightTrackRuntime()
  - validate RaceGameInput
  - apply analog movement using Phase 4 rule model
  - evaluate swept path through expected gate
  - require center + lobe gates in strict order
  - warn then penalize wrong lobe, wrong-way, center-cut
        |
        +--> all players finished?
        |        |
        |        v
        |   server:session-finished + results summary
        |
        v
server:session-state { FigureEightTrackSnapshot }
        |
        v
FigureEightTrackPage
  - canvas draws bridge/underpass, arrows, active path, gates, cars
  - React HUD renders lap, next gate, direction, crossing/course state
  - ResultsPage renders figure-eight summary if Phase 6 has not already generalized it
```

This flow keeps final position, checkpoint, lap, penalties, and finish order server-authoritative. [VERIFIED: `.planning/PROJECT.md`; VERIFIED: `apps/server/src/games/runtime.ts`; VERIFIED: `packages/shared/src/contracts.ts`]

### Recommended Project Structure

```text
packages/shared/src/
├── game.ts                    # Add FigureEightTrackSnapshot/player/course fields if Phase 4 did not create generic analog track types.
├── lobby.ts                   # Add PARTY_GAME_VARIANTS.figureEightTrack and startability.
└── contracts.test.ts          # Add shared variant/input/snapshot assertions.

apps/server/src/games/race/
├── analogTrackGates.ts         # Optional shared swept-gate/order helpers if Phase 4 helpers are reusable.
├── analogTrackGates.test.ts
├── figureEightTrackRules.ts    # Figure-eight geometry, gates, lobe/crossing classification, penalties.
├── figureEightTrackRules.test.ts
├── figureEightTrack.ts         # GameRuntimeInstance wrapper and result emission.
└── figureEightTrack.test.ts

apps/web/src/game/
├── figureEightTrackCanvas.ts   # Browser-only drawing for track, crossing, active path, gates, arrows, cars.
└── figureEightTrackCanvas.test.ts

apps/web/src/pages/
├── FigureEightTrackPage.tsx
└── FigureEightTrackPage.test.tsx
```

This structure follows the repository's shared/server/web ownership boundaries and avoids growing `sprintCircuit.ts`. [VERIFIED: `.planning/codebase/STRUCTURE.md`; VERIFIED: `.planning/codebase/CONCERNS.md`; VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`]

### Pattern 1: Explicit Ordered Gate Sequence Through The Crossing

**What:** Model progress as `nextGateIndex` in a fixed `FigureEightGate[]` sequence, not as nearest projected point on a crossing path. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**When to use:** Every checkpoint, lap, wrong-lobe, and center-cut decision in the figure-eight runtime. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**Recommended gate model:** Use start/finish, lobe-entry gates, center-crossing gates for both traversal directions, far-lobe gates, and return gates so tests can distinguish the two visually overlapping center passes. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; ASSUMED]

```typescript
// Source: Phase 5 locked decisions + local Phase 4 rule-helper pattern. [VERIFIED: 05-CONTEXT.md; VERIFIED: 04-02-PLAN.md]
export interface FigureEightGate {
  id: string;
  label: string;
  kind: 'start' | 'lobe' | 'crossing';
  expectedPath: 'left-lobe' | 'right-lobe' | 'center-over' | 'center-under';
  from: { x: number; y: number };
  to: { x: number; y: number };
  cue: string;
}

export interface FigureEightProgress {
  lap: number;
  nextGateIndex: number;
  expectedPath: FigureEightGate['expectedPath'];
  directionCue: string;
}
```

### Pattern 2: Swept Gate Crossing, Not Endpoint Containment

**What:** Detect whether the segment from the previous pose to the next pose crosses the expected gate line with the expected travel direction. [VERIFIED: `.planning/phases/04-circular-analog-track-race/04-02-PLAN.md`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**When to use:** Gate advancement, start/finish lap completion, and center-crossing checks. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]

```typescript
// Source: recommended helper shape from Phase 4 planned circle rules. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-02-PLAN.md]
export function evaluateExpectedGateCrossing(
  previousPose: TrackPose,
  nextPose: TrackPose,
  gate: FigureEightGate,
): 'crossed-forward' | 'crossed-backward' | 'missed' {
  const crossed = segmentsIntersect(previousPose, nextPose, gate.from, gate.to);
  if (!crossed) {
    return 'missed';
  }

  return dot(normalize(delta(previousPose, nextPose)), gateForwardVector(gate)) > 0
    ? 'crossed-forward'
    : 'crossed-backward';
}
```

### Pattern 3: Crossing-Specific Course State

**What:** Expose a server-derived `courseState`, `expectedPath`, `nextGateLabel`, `directionCue`, and `penaltyReason` in the snapshot. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `apps/web/src/components/game/GameHud.tsx`]
**When to use:** React HUD text, canvas active-path highlight, warning color, and tests. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]

```typescript
// Source: shared snapshot/HUD pattern in packages/shared/src/game.ts and GameHud. [VERIFIED: packages/shared/src/game.ts; VERIFIED: apps/web/src/components/game/GameHud.tsx]
export type FigureEightCourseState =
  | 'on-course'
  | 'crossing'
  | 'wrong-lobe-warning'
  | 'wrong-lobe-penalty'
  | 'center-cut-warning'
  | 'center-cut-penalty'
  | 'wrong-way-warning'
  | 'wrong-way-penalty';
```

### Anti-Patterns to Avoid

- **Nearest-point progress at the center crossing:** The crossing creates two valid nearby path segments, so nearest projection can advance the wrong lobe or let center cuts count as progress. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
- **Single generic center checkpoint:** A single center marker cannot distinguish "enter crossing from right lobe" from "return crossing from left lobe"; use directional center gates. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; ASSUMED]
- **Canvas-only crossing instruction:** The HUD needs React text for direction/next checkpoint and penalty state. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `apps/web/src/components/game/GameHud.tsx`; VERIFIED: `.planning/codebase/CONCERNS.md`]
- **Using `useLiveRaceSocket` unchanged:** It ignores non-`sprint-circuit` race variants. [VERIFIED: `apps/web/src/lib/useLiveRaceSocket.ts`]
- **Editing generated `dist` output:** Source of truth is `apps/**/src` and `packages/shared/src`. [VERIFIED: `AGENTS.md`; VERIFIED: `.planning/codebase/CONCERNS.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pointer/touch analog control | New mouse/touch handlers | `AnalogPad` plus `useGameControls` | Existing controls already emit clamped vectors, keyboard fallback, sequence ids, timestamps, and reset lifecycle. [VERIFIED: `apps/web/src/components/game/AnalogPad.tsx`; VERIFIED: `apps/web/src/components/game/useGameControls.ts`] |
| Realtime event family | New figure-eight socket events | Existing `client:game-input`, `server:session-state`, `server:session-finished` | The generic session event family is the active server path; race-specific events are marked stale/parallel. [VERIFIED: `packages/shared/src/contracts.ts`; VERIFIED: `.planning/codebase/CONCERNS.md`] |
| Fullscreen shell and HUD grid | New page chrome | `FullscreenGameShell`, `GameViewport`, `GameHud`, `GameStates` | Phase 1 components already satisfy the mobile fullscreen/HUD foundation. [VERIFIED: `apps/web/src/components/game/FullscreenGameShell.tsx`; VERIFIED: `apps/web/src/components/game/GameHud.tsx`; VERIFIED: `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-03-SUMMARY.md`] |
| Generic result navigation/storage | Separate results flow | Existing session-finished storage and `ResultsPage` route | `SprintCircuitPage` stores `blitz-results:{sessionId}` and navigates to `/results/:sessionId`; ResultsPage already reads stored payloads. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.tsx`; VERIFIED: `apps/web/src/pages/ResultsPage.tsx`] |
| Circle regression coverage | New unrelated test harness | Existing shared/server/web test scripts | Current package scripts cover shared contracts, Node server tests, and Vitest web tests. [VERIFIED: `.planning/codebase/TESTING.md`; VERIFIED: `package.json`] |

**Key insight:** Hand-roll only the figure-eight-specific geometry and ordered gate rules; reuse controls, socket transport, fullscreen shell, runtime lifecycle, and test infrastructure. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `.planning/codebase/STRUCTURE.md`]

## Current Code Inventory

| Area | Files Found | Planning Implication |
|------|-------------|----------------------|
| Shared analog contracts | `RACE_SHELL_MODE_IDS.figureEight`, `RaceGameInput`, `RaceAnalogVector`, `clampRaceAnalogVector`, and `isRaceGameInput` exist. [VERIFIED: `packages/shared/src/game.ts`] | Phase 5 can reuse input shape and should add figure-eight snapshot/variant fields rather than new input transport. [VERIFIED: `packages/shared/src/game.ts`] |
| Figure-eight lobby variant | `PARTY_GAME_VARIANTS` does not include a figure-eight variant. [VERIFIED: `packages/shared/src/lobby.ts`] | Add `figureEightTrack: 'figure-eight-track'` or equivalent plus startability and tests. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |
| Runtime registry | Registry exposes `race:sprint-circuit` and `race:drag-sprint`, not figure-eight. [VERIFIED: `apps/server/src/games/registry.ts`] | Add `race:figure-eight-track` runtime entry after shared variant exists. [VERIFIED: `apps/server/src/games/registry.ts`] |
| Existing race runtime | `sprintCircuit.ts` has countdown, player state, lap/checkpoint-ish fields, ranking, and result emission but uses progress/lane/discrete input. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`] | Use lifecycle/result pattern only; do not reuse its progress model for the crossing. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |
| Existing figure-eight-like drawing | `sprintCircuitTrack.ts` contains a complex centerline/checkpoints that visually resembles a figure-eight. [VERIFIED: `apps/web/src/game/sprintCircuitTrack.ts`] | Treat as a rough visual reference only; add intentional bridge/underpass and tested gates. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |
| Phase 4 circle helpers | Planned `circleTrackRules.ts`, `circleTrack.ts`, and `CircleTrackPage.tsx` are not present in current source. [VERIFIED: `find apps/server/src/games/race apps/web/src/game apps/web/src/pages packages/shared/src`] | Phase 5 plan should include a prerequisite "verify Phase 4 landed" task or explicitly block until Phase 4 is complete. [VERIFIED: `.planning/STATE.md`] |

## Recommended Plan Slices

1. **Prerequisite and contract slice:** Verify Phase 4 circle files/summaries exist, then add `figure-eight-track` shared variant, startability, and snapshot/course/player types. [VERIFIED: `.planning/phases/04-circular-analog-track-race/04-01-PLAN.md`; VERIFIED: `packages/shared/src/lobby.ts`; VERIFIED: `packages/shared/src/game.ts`]
2. **Pure rule-helper slice:** Add figure-eight track definition and deterministic tests for ordered lobe gates, directional center gates, skipped-lobe rejection, start/finish lap completion, wrong-way/cut warning, and circle regression. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `.planning/codebase/TESTING.md`]
3. **Server runtime slice:** Wrap rules in `createFigureEightTrackRuntime()`, register `race:figure-eight-track`, accept only valid `kind: 'analog'` input with `modeId: 'figure-eight'`, and emit rankings/summary. [VERIFIED: `apps/server/src/games/runtime.ts`; VERIFIED: `apps/server/src/games/registry.ts`; VERIFIED: `packages/shared/src/game.ts`]
4. **Web gameplay slice:** Build `figureEightTrackCanvas.ts` and `FigureEightTrackPage.tsx` using the fullscreen shell, analog pad, server snapshot HUD, active path highlight, and crossing treatment. [VERIFIED: `apps/web/src/components/game`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
5. **Routing/results/regression slice:** Route figure-eight sessions to the fullscreen page, render mode summary if needed, run existing circle tests plus figure-eight focused tests, then run root build/test gates. [VERIFIED: `apps/web/src/lib/sessionRoutes.ts`; VERIFIED: `apps/web/src/app/router.tsx`; VERIFIED: `package.json`] 

## Common Pitfalls

### Pitfall 1: Center Crossing Advances The Wrong Segment
**What goes wrong:** The player approaches the center and the runtime advances whichever path segment is nearest, even if the intended ordered gate is for the other lobe. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**Why it happens:** A figure-eight has overlapping or near-overlapping geometry at the crossing, so nearest-point projection is ambiguous. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**How to avoid:** Require explicit directional center gates in the fixed gate sequence and reject non-expected center crossings as no progress. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**Warning signs:** A center cut increments checkpoint, or a player can complete a lap while driving only one lobe. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]

### Pitfall 2: Gate Tunneling At Higher Speed
**What goes wrong:** A player visibly crosses a gate between ticks, but neither endpoint lands inside the gate region and checkpoint state does not advance. [ASSUMED]
**Why it happens:** Endpoint-only containment misses swept movement. [ASSUMED]
**How to avoid:** Test and implement segment-vs-gate crossing using previous pose and next pose. [VERIFIED: `.planning/phases/04-circular-analog-track-race/04-02-PLAN.md`]
**Warning signs:** Checkpoints fail only at higher speeds or after tuning max speed upward. [ASSUMED]

### Pitfall 3: Bridge/Underpass Looks Like A Rendering Bug
**What goes wrong:** The crossing reads like two accidentally overlapping roads rather than an intentional route. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**Why it happens:** Equal stroke weight, no shadow/bridge edge, and no active route arrows make the path hierarchy unclear. [ASSUMED]
**How to avoid:** Use visual hierarchy: one path passes over the other, center shadow/underpass styling, active next-path highlight, and arrow cues before the crossing. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**Warning signs:** Testers slow down at the center because they cannot tell which lobe comes next. [ASSUMED]

### Pitfall 4: Figure-Eight Changes Regress Circle Behavior
**What goes wrong:** Shared gate helpers are generalized for figure-eight and break circle checkpoint/lap tests. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**Why it happens:** Shared helper signatures change without preserving circle-specific defaults and tests. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
**How to avoid:** Add figure-eight helpers beside circle helpers first; extract common code only when tests for both tracks pass. [VERIFIED: `.planning/codebase/CONCERNS.md`; VERIFIED: `.planning/phases/04-circular-analog-track-race/04-02-PLAN.md`]
**Warning signs:** `circleTrackRules.test.ts` or `CircleTrackPage.test.tsx` failures appear after a figure-eight helper edit. [VERIFIED: `.planning/phases/04-circular-analog-track-race/04-VALIDATION.md`]

## Code Examples

### Shared Variant And Startability

```typescript
// Source: packages/shared/src/lobby.ts pattern. [VERIFIED: packages/shared/src/lobby.ts]
export const PARTY_GAME_VARIANTS = {
  sprintCircuit: 'sprint-circuit',
  trafficSurvival: 'traffic-survival',
  dragSprint: 'drag-sprint',
  figureEightTrack: 'figure-eight-track',
} as const;

if (variant === PARTY_GAME_VARIANTS.figureEightTrack) {
  return true;
}
```

### Runtime Input Guard

```typescript
// Source: planned Circle Track runtime pattern + shared guard. [VERIFIED: .planning/phases/04-circular-analog-track-race/04-03-PLAN.md; VERIFIED: packages/shared/src/game.ts]
if (
  !isRaceGameInput(input) ||
  input.kind !== RACE_GAME_INPUT_KIND.analog ||
  input.modeId !== RACE_SHELL_MODE_IDS.figureEight
) {
  return state;
}
```

### HUD Adapter

```typescript
// Source: GameHud accepts RaceShellSnapshot. [VERIFIED: apps/web/src/components/game/GameHud.tsx; VERIFIED: packages/shared/src/game.ts]
const shellSnapshot: RaceShellSnapshot = {
  sessionId: snapshot.sessionId,
  lobbyCode: snapshot.lobbyCode,
  modeId: RACE_SHELL_MODE_IDS.figureEight,
  status: snapshot.status,
  countdown: snapshot.countdown,
  tick: snapshot.tick,
  players: snapshot.playersState.map((player) => ({
    playerId: player.playerId,
    nickname: player.nickname,
    progress: player.progress,
    speed: player.speed,
    penalty: player.penaltyReason,
  })),
  hud: {
    objective: 'Complete the figure eight',
    progressLabel: `Lap ${lead.lap}/${snapshot.lapsTotal}`,
    speedLabel: `${Math.round(lead.speedKmh)} km/h`,
    penaltyLabel: lead.courseStateLabel,
    inputLabel,
    modeMetricLabel: 'Next',
    modeMetricValue: lead.nextGateLabel,
  },
  mode: snapshot,
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy `PlayerInput` with `steer`, `accelerate`, and `brake` fields. [VERIFIED: `packages/shared/src/game.ts`; VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`] | `RaceGameInput` analog/button/action intent with `modeId`, `sequence`, and `clientTimeMs`. [VERIFIED: `packages/shared/src/game.ts`; VERIFIED: `apps/web/src/components/game/useGameControls.ts`] | Phase 1 shell/input foundation. [VERIFIED: `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-01-SUMMARY.md`; VERIFIED: `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-02-SUMMARY.md`] | Figure-eight runtime must consume analog input rather than legacy steer fields. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |
| `useLiveRaceSocket` filters only `sprint-circuit`. [VERIFIED: `apps/web/src/lib/useLiveRaceSocket.ts`] | Generic `useGameSessionSocket` accepts any session id and emits `client:game-input`. [VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`] | Phase 1 route integration introduced generic session-oriented controls. [VERIFIED: `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-04-SUMMARY.md`] | Figure-eight page should use generic or variant-aware session hook. [VERIFIED: `apps/web/src/lib/useGameSessionSocket.ts`] |
| Old `sprintCircuitTrack.ts` draws an unlabeled complex track with checkpoint dots. [VERIFIED: `apps/web/src/game/sprintCircuitTrack.ts`] | Phase 5 requires intentional crossing treatment and active route cues. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] | Phase 5 discussion decisions. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] | Canvas helper needs bridge/underpass and next-path highlight tests. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |

**Deprecated/outdated:**
- `server:race-snapshot`, `server:race-started`, `server:race-finished`, `client:start-race`, and `client:player-input` remain in shared contracts but are marked as stale/parallel relative to the generic session path. [VERIFIED: `packages/shared/src/contracts.ts`; VERIFIED: `.planning/codebase/CONCERNS.md`]
- `sprintCircuit.ts` progress/lane model is not adequate for figure-eight crossing validation because Phase 5 requires explicit ordered center/lobe gates. [VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A physics engine is unnecessary for Phase 5. | Standard Stack / Alternatives | If wrong, rule helpers may under-model desired vehicle behavior, but the phase explicitly defers simulation-grade physics. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |
| A2 | A single center checkpoint cannot distinguish both intended center passes. | Architecture Patterns / Anti-Patterns | If wrong, fewer gates could work, but tests would still need to prove no lobe-skipping ambiguity. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |
| A3 | Equal visual hierarchy at the crossing will confuse players. | Common Pitfalls | If wrong, simpler rendering may be acceptable, but user decisions require intentional crossing treatment. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] |

## Open Questions (RESOLVED)

1. **RESOLVED: Phase 5 blocks until Phase 4 source exists.** [VERIFIED: `.planning/STATE.md`; VERIFIED: `find apps/server/src/games/race ...`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-01-PLAN.md`]
   - What we know: Phase 4 plans define `circleTrackRules.ts`, `circleTrack.ts`, and `CircleTrackPage.tsx`, but those files are absent in the current source tree. [VERIFIED: `.planning/phases/04-circular-analog-track-race/04-02-PLAN.md`; VERIFIED: `find apps/server/src/games/race apps/web/src/game apps/web/src/pages packages/shared/src`]
   - Resolution: Plan `05-01` includes the prerequisite gate. Execution must read Phase 4 summaries/source and either reuse landed helpers or stop with a clear checkpoint instead of inventing conflicting Phase 4 equivalents. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-01-PLAN.md`]
2. **RESOLVED: Initial geometry is planner/executor discretion within fixed first-pass constraints.** [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-02-PLAN.md`]
   - What we know: Gates must include lobe-specific gates and center-crossing gates. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
   - Resolution: Plan `05-02` locks the initial implementation direction to a broad 560x380 figure-eight layout, road width 96, and an ordered gate sequence with lobe-specific and directional center gates. Exact coordinates remain executor discretion as long as tests prove full sequence traversal, skipped-lobe rejection, center-cut rejection, lap completion, and circle regression. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-02-PLAN.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Server/shared tests, build scripts, package scripts | yes [VERIFIED: `node --version`] | `v24.14.1` [VERIFIED: `node --version`] | None needed. [VERIFIED: `package.json`] |
| pnpm | Workspace install/test/build | yes [VERIFIED: `pnpm --version`] | `10.33.2` [VERIFIED: `pnpm --version`] | None recommended; project is pnpm-first. [VERIFIED: `package.json`; VERIFIED: `AGENTS.md`] |
| npm registry access | Version verification only | yes [VERIFIED: npm registry] | npm CLI `11.11.0` [VERIFIED: `npm --version`] | Use project package versions if registry is unavailable during execution. [VERIFIED: `apps/web/package.json`; VERIFIED: `apps/server/package.json`] |

**Missing dependencies with no fallback:** None found for research/planning. [VERIFIED: `node --version`; VERIFIED: `pnpm --version`; VERIFIED: npm registry]

**Missing dependencies with fallback:** No external gameplay service is required; current app uses in-memory server state. [VERIFIED: `.planning/PROJECT.md`; VERIFIED: `.planning/codebase/ARCHITECTURE.md`]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Shared/server use Node built-in test runner with `tsx`; web uses Vitest and Testing Library. [VERIFIED: `.planning/codebase/TESTING.md`; VERIFIED: `apps/server/package.json`; VERIFIED: `apps/web/package.json`; VERIFIED: `packages/shared/package.json`] |
| Config file | Web config is `apps/web/vite.config.ts`; server/shared use package scripts. [VERIFIED: `apps/web/vite.config.ts`; VERIFIED: `apps/server/package.json`; VERIFIED: `packages/shared/package.json`] |
| Quick run command | `pnpm --filter @blitz/server test` for rule/runtime work and `pnpm --filter @blitz/web test -- FigureEightTrackPage figureEightTrackCanvas` for web iteration. [VERIFIED: `.planning/codebase/TESTING.md`; VERIFIED: `apps/server/package.json`; VERIFIED: `apps/web/package.json`] |
| Full suite command | `pnpm test` and `pnpm run build`. [VERIFIED: `AGENTS.md`; VERIFIED: `package.json`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ANLG-03 | Shared contract exposes figure-eight variant/startability and HUD-ready snapshot fields. [VERIFIED: `.planning/REQUIREMENTS.md`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] | shared contract | `pnpm --filter @blitz/shared test` [VERIFIED: `packages/shared/package.json`] | No; extend `packages/shared/src/contracts.test.ts`. [VERIFIED: `packages/shared/src/contracts.test.ts`] |
| ANLG-03 | Ordered gates traverse both lobes and directional center crossing; skipped lobe/center cut does not advance. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] | server unit | `pnpm --filter @blitz/server test` [VERIFIED: `apps/server/package.json`] | No; add `apps/server/src/games/race/figureEightTrackRules.test.ts`. [VERIFIED: `find apps/server/src/games/race`] |
| ANLG-03 | Runtime accepts valid figure-eight analog input, ignores malformed/non-figure input, emits finish rankings and summary. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `packages/shared/src/game.ts`] | server runtime | `pnpm --filter @blitz/server test` [VERIFIED: `apps/server/package.json`] | No; add `apps/server/src/games/race/figureEightTrack.test.ts`. [VERIFIED: `find apps/server/src/games/race`] |
| ANLG-03 | Fullscreen page renders figure-eight crossing, active route cue, next gate/direction HUD, warnings, analog control, and finish navigation. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] | web component/canvas | `pnpm --filter @blitz/web test -- FigureEightTrackPage figureEightTrackCanvas` [VERIFIED: `apps/web/package.json`] | No; add `apps/web/src/pages/FigureEightTrackPage.test.tsx` and `apps/web/src/game/figureEightTrackCanvas.test.ts`. [VERIFIED: `find apps/web/src/pages apps/web/src/game`] |
| ANLG-03 | Existing circular analog tests still pass. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`] | regression | `pnpm --filter @blitz/server test && pnpm --filter @blitz/web test` [VERIFIED: `apps/server/package.json`; VERIFIED: `apps/web/package.json`] | Pending Phase 4; verify `circleTrack*` tests exist before relying on them. [VERIFIED: `find apps/server/src/games/race apps/web/src/pages`] |

### Sampling Rate

- **Per task commit:** Run the focused package command for touched files. [VERIFIED: `.planning/codebase/TESTING.md`]
- **Per wave merge:** Run shared/server/web package tests touched by the wave. [VERIFIED: `.planning/codebase/TESTING.md`]
- **Phase gate:** Run `pnpm test` and `pnpm run build` before verification. [VERIFIED: `AGENTS.md`; VERIFIED: `package.json`]

### Wave 0 Gaps

- [ ] `packages/shared/src/contracts.test.ts` needs assertions for `PARTY_GAME_VARIANTS.figureEightTrack`, startability, `modeId: 'figure-eight'`, and snapshot fields. [VERIFIED: `packages/shared/src/contracts.test.ts`; VERIFIED: `packages/shared/src/lobby.ts`]
- [ ] `apps/server/src/games/race/figureEightTrackRules.test.ts` needs gate-order, crossing, skipped-lobe, lap, warning, and penalty tests. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
- [ ] `apps/server/src/games/race/figureEightTrack.test.ts` needs runtime start/input/finish/invalid payload tests. [VERIFIED: `apps/server/src/games/race/sprintCircuit.test.ts`; VERIFIED: `.planning/codebase/TESTING.md`]
- [ ] `apps/web/src/pages/FigureEightTrackPage.test.tsx` needs fullscreen shell, no app chrome, analog control, HUD, crossing warning, and finish navigation tests. [VERIFIED: `apps/web/src/pages/SprintCircuitPage.test.tsx`]
- [ ] `apps/web/src/game/figureEightTrackCanvas.test.ts` needs drawing helper tests for crossing treatment, next gate highlight, arrows, warning colors, and labels. [VERIFIED: `apps/web/src/game/sprintCircuitTrack.ts`; VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`]
- [ ] `apps/web/src/lib/sessionRoutes.test.ts` may need to be created if Phase 4 has not already added it. [VERIFIED: `find apps/web/src/lib`; VERIFIED: `.planning/phases/04-circular-analog-track-race/04-05-PLAN.md`]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no for Phase 5 scope | Project has no external authentication; do not change auth in this gameplay phase. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; VERIFIED: `.planning/codebase/CONCERNS.md`] |
| V3 Session Management | yes, existing socket/lobby sessions | Preserve existing session/lobby flow and do not create a separate runtime session mechanism. [VERIFIED: `apps/server/src/games/manager.ts`; VERIFIED: `apps/server/src/socket/register.ts`] |
| V4 Access Control | yes | Runtime should apply input only for the socket/player mapped by `GameManager`, and should ignore unknown player input. [VERIFIED: `apps/server/src/games/manager.ts`; VERIFIED: `apps/server/src/games/race/sprintCircuit.ts`] |
| V5 Input Validation | yes | Require `isRaceGameInput`, analog kind, figure-eight mode id, finite clamped vector values, and no client-sent lap/checkpoint/finish authority. [VERIFIED: `packages/shared/src/game.ts`; VERIFIED: `.planning/phases/04-circular-analog-track-race/04-03-PLAN.md`] |
| V6 Cryptography | no for Phase 5 scope | No cryptographic feature is introduced by figure-eight gameplay. [VERIFIED: `.planning/ROADMAP.md`] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client tampers with lap/checkpoint/finish state in `client:game-input`. [VERIFIED: `packages/shared/src/contracts.ts`] | Tampering | Accept only compact analog intent and derive authoritative state server-side. [VERIFIED: `packages/shared/src/game.ts`; VERIFIED: `.planning/PROJECT.md`] |
| High-frequency input spams full room snapshots. [VERIFIED: `.planning/codebase/CONCERNS.md`] | Denial of Service | Keep rule work constant-time, payload compact, and avoid per-frame canvas-driven network emission. [VERIFIED: `.planning/codebase/CONCERNS.md`; VERIFIED: `apps/web/src/components/game/useGameControls.ts`] |
| Wrong variant receives figure-eight input. [VERIFIED: `apps/web/src/lib/useLiveRaceSocket.ts`; VERIFIED: `packages/shared/src/game.ts`] | Tampering | Runtime must require `modeId === RACE_SHELL_MODE_IDS.figureEight` and registered variant must match `figure-eight-track`. [VERIFIED: `.planning/phases/04-circular-analog-track-race/04-03-PLAN.md`; VERIFIED: `packages/shared/src/game.ts`] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md` - locked Phase 5 decisions, code context, deferred scope, and crossing/checkpoint requirements. [VERIFIED]
- `.planning/REQUIREMENTS.md` - ANLG-03 requirement and traceability. [VERIFIED]
- `.planning/ROADMAP.md` - Phase 5 boundary and success criteria. [VERIFIED]
- `.planning/STATE.md` - current project phase and preserved decisions. [VERIFIED]
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/TESTING.md` - local architecture, risk, structure, conventions, and tests. [VERIFIED]
- `packages/shared/src/game.ts`, `packages/shared/src/lobby.ts`, `packages/shared/src/contracts.ts` - current shared contracts and gaps. [VERIFIED]
- `apps/server/src/games/race/sprintCircuit.ts`, `apps/server/src/games/registry.ts`, `apps/server/src/games/runtime.ts` - runtime lifecycle and current registry. [VERIFIED]
- `apps/web/src/components/game/*`, `apps/web/src/lib/useGameSessionSocket.ts`, `apps/web/src/lib/useLiveRaceSocket.ts`, `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/game/sprintCircuitTrack.ts` - web shell, controls, hooks, page, and drawing reference. [VERIFIED]
- `npm view <package> version time.modified` - registry versions for TypeScript, React, React Router DOM, Socket.IO, Vite, Vitest, and React Testing Library. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- Socket.IO v4 documentation for emitting events. [CITED: https://socket.io/docs/v4/emitting-events/]

### Tertiary (LOW confidence)

- Assumptions about exact gate count, visual confusion thresholds, and physics-engine non-need are marked in the Assumptions Log. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package files and npm registry metadata were checked. [VERIFIED: `apps/*/package.json`; VERIFIED: npm registry]
- Architecture: HIGH - local architecture docs and source files identify the shared/server/web boundaries. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; VERIFIED: `apps/server/src/games/runtime.ts`; VERIFIED: `apps/web/src/app/router.tsx`]
- Gate/crossing rules: MEDIUM - explicit-gate requirement is locked, but exact geometry is intentionally discretionary and Phase 4 rule helpers are not yet in source. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; VERIFIED: `find apps/server/src/games/race ...`]
- Pitfalls: MEDIUM - crossing ambiguity is verified from phase decisions; gate tunneling and visual-confusion specifics are engineering assumptions requiring tests/playtesting. [VERIFIED: `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md`; ASSUMED]

**Research date:** 2026-04-25 [VERIFIED: `date -u +%Y-%m-%dT%H:%M:%SZ`]
**Valid until:** 2026-05-25 for local architecture; recheck npm registry metadata before dependency changes. [ASSUMED]
