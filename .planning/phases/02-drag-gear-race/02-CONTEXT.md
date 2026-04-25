# Phase 2: Drag Gear Race - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 replaces the current `drag-sprint` behavior with a straight-line gear timing race where acceleration and shift timing decide the result.

This phase delivers the drag-specific runtime rules, shared input/snapshot fields, mobile gameplay controls, HUD, deterministic rule tests, and result summary for DRAG-01 through DRAG-05 and ARCH-02.

This phase does not add steering, lane changes, obstacles, powerups, analog controls, new lobby catalog polish, or new non-race modes. Those belong to later phases.

</domain>

<decisions>
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/PROJECT.md` - Product vision, mobile-first playability goal, active drag race requirement, and server-authoritative constraint.
- `.planning/REQUIREMENTS.md` - Phase 2 requirements: DRAG-01 through DRAG-05 and ARCH-02.
- `.planning/ROADMAP.md` - Phase 2 boundary, success criteria, and implementation notes.
- `.planning/STATE.md` - Current milestone state and decisions to preserve.

### Prior phase decisions
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md` - Fullscreen gameplay shell, two-thumb controls, readable HUD, desktop fallback, and shared contract direction.
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md` - Approved mobile gameplay UI contract, control sizing, HUD rules, typography, color, and shared contract expectations.

### Codebase map
- `.planning/codebase/ARCHITECTURE.md` - Runtime registry, socket flow, shared contract boundary, and session/result lifecycle.
- `.planning/codebase/CONCERNS.md` - Large race runtime risk, stale race events, canvas-only state risk, and mobile control concerns.
- `.planning/codebase/STRUCTURE.md` - Where to add new realtime game contracts, runtimes, pages, hooks, and tests.
- `.planning/codebase/CONVENTIONS.md` - TypeScript, React, socket, runtime, and test conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shared/src/game.ts`: Existing race and drag snapshot types live here, but they need new drag gear fields for gear, RPM, shift window, shift quality, and shift summary.
- `packages/shared/src/contracts.ts`: `client:game-input`, `server:session-state`, and `server:session-finished` are the active session event family. Phase 2 should use those rather than stale race-specific events.
- `apps/server/src/games/race/dragSprint.ts`: Current drag runtime has lanes, obstacles, pickups, and race modes. It is the likely replacement target, but its current mechanics conflict with the desired straight gear-timing game.
- `apps/server/src/games/race/dragSprint.test.ts`: Existing runtime tests provide a location and harness style for deterministic drag rule tests.
- `apps/server/src/games/registry.ts`: Registers `race:drag-sprint`; Phase 2 should keep this registry path working while changing the behavior.
- `apps/web/src/lib/useGameSessionSocket.ts`: Generic session hook can submit typed game inputs and receive session envelopes.
- `apps/web/src/lib/useLiveRaceSocket.ts`: Existing race-specific hook emits steer/accelerate/brake every 50ms; Phase 2 likely needs drag-specific input semantics instead.
- `apps/web/src/pages/SprintCircuitPage.tsx`: Existing live race page shows the old panel/canvas/control pattern; Phase 2 should use the Phase 1 fullscreen shell once available.
- `apps/web/src/pages/ResultsPage.tsx`: Generic results page can display rankings and summary values, but may need mode-specific drag summary rendering.

### Established Patterns
- Shared contracts live in `packages/shared/src` and are consumed by both web and server.
- Server runtime state remains authoritative. Client input is intent, not final outcome.
- Realtime game sessions emit `GameSessionEnvelope` state and `SessionFinishedPayload` results.
- Runtime tests are co-located beside server runtime files and should cover deterministic rule helpers.
- Web page and hook tests are co-located under `apps/web/src`.

### Integration Points
- Shared drag input/snapshot/result fields connect through `packages/shared/src/game.ts` and `packages/shared/src/contracts.ts`.
- Server drag rules connect through `apps/server/src/games/race/dragSprint.ts` or smaller helpers imported by it.
- Runtime registration remains in `apps/server/src/games/registry.ts`.
- Web route integration should use the Phase 1 fullscreen game shell/control primitives if Phase 1 execution has produced them; otherwise planning should include adapting the route after Phase 1 lands.
- Results summary should flow through `GameResults.summary` and be rendered by `apps/web/src/pages/ResultsPage.tsx` or a mode-specific result helper.

</code_context>

<specifics>
## Specific Ideas

- The user selected all discussion areas with recommended defaults.
- Preferred player feel: hold accelerate, watch the RPM/shift cue, hit shift at the right moment, and see immediate quality feedback.
- The race should feel manually playable on a phone without steering or analog movement.
- A good first tune is 4 gears and a short 12-18 second arcade race.
- Results should make the run understandable: finish time plus shift quality counts.

</specifics>

<deferred>
## Deferred Ideas

- Steering, obstacles, lane changes, slowdown recovery, and obstacle hit counts belong to Phase 3.
- Analog steering, checkpoints, laps, off-track penalties, and wrong-way logic belong to Phases 4 and 5.
- Lobby catalog copy, mode cards, and broad result polish belong to Phase 6.
- Sound, haptics, camera shake, and advanced visual juice remain polish after the core mechanics work.

</deferred>

---

*Phase: 02-drag-gear-race*
*Context gathered: 2026-04-25*
