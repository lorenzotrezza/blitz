# Phase 5: Figure-Eight Analog Track Race - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 adds a distinct figure-eight analog track map using the analog control, fullscreen shell, checkpoint, lap, off-track, wrong-way, and HUD foundations established by earlier phases.

This phase delivers the figure-eight layout, crossing/intersection readability, crossing-safe checkpoint/lap validation, deterministic geometry tests, and route/runtime integration needed for ANLG-03.

This phase does not reopen the baseline analog control model from Phase 4, add final lobby catalog polish, add broad results redesign, introduce simulation-grade physics, or add powerups/car-specific handling. Those belong to other phases or later milestones.

</domain>

<decisions>
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

### the agent's Discretion
- Exact figure-eight geometry, checkpoint count, and start/finish placement, provided the crossing order is deterministic and readable.
- Exact bridge/underpass visual treatment, arrow styling, gate colors, and next-path highlight behavior.
- Exact warning grace windows, slowdown constants, and penalty thresholds, provided they preserve the warning-first, recoverable mistake model.
- Whether the implementation creates a new figure-eight runtime/helper module or extends reusable analog track helpers from Phase 4, provided large runtime files do not grow unnecessarily and deterministic tests cover the geometry.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/PROJECT.md` - Product vision, mobile-first playability goal, active figure-eight analog requirement, and server-authoritative constraint.
- `.planning/REQUIREMENTS.md` - Phase 5 requirement: ANLG-03, plus analog race requirements inherited from Phase 4.
- `.planning/ROADMAP.md` - Phase 5 boundary, success criteria, and implementation notes.
- `.planning/STATE.md` - Current milestone state and decisions to preserve.

### Prior phase decisions
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md` - Fullscreen gameplay shell, bottom-left analog zone, readable HUD, desktop fallback, and shared race contract direction.
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md` - Approved mobile gameplay UI contract, analog pad sizing, HUD rules, typography, safe areas, and shared input expectations.
- `.planning/phases/02-drag-gear-race/02-CONTEXT.md` - Drag-specific boundary and explicit separation from steering/analog mechanics.
- `.planning/phases/03-straight-obstacle-race/03-CONTEXT.md` - Straight dodge boundary and explicit separation from analog checkpoints/laps.
- `.planning/phases/04-circular-analog-track-race/04-CONTEXT.md` - Baseline analog control feel, checkpoint/lap rules, warning-first penalties, results expectations, and integration shape that Phase 5 extends.

### Codebase map
- `.planning/codebase/ARCHITECTURE.md` - Runtime registry, socket flow, shared contract boundary, and session/result lifecycle.
- `.planning/codebase/CONCERNS.md` - Large race runtime risk, stale race events, canvas-only state risk, and mobile control concerns.
- `.planning/codebase/STRUCTURE.md` - Where to add new realtime game contracts, runtimes, pages, hooks, and tests.
- `.planning/codebase/CONVENTIONS.md` - TypeScript, React, socket, runtime, and test conventions.
- `.planning/codebase/TESTING.md` - Current server/shared/web test patterns and focused test commands.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/components/game/FullscreenGameShell.tsx`: Reusable fullscreen gameplay wrapper already exists and should be used for the figure-eight screen.
- `apps/web/src/components/game/AnalogPad.tsx`: Pointer-based analog control emits normalized vectors and has touch-action safeguards.
- `apps/web/src/components/game/useGameControls.ts`: Emits `RaceGameInput` with mode id, sequence, client timestamp, analog vector, buttons, and keyboard fallback.
- `apps/web/src/components/game/GameHud.tsx`: Already recognizes `figure-eight` as a shell mode label and renders React-readable status text.
- `packages/shared/src/game.ts`: `RACE_SHELL_MODE_IDS` already includes `figure-eight`; analog input guards and clamping helpers exist.
- `apps/web/src/pages/SprintCircuitPage.tsx`: Current live race page uses the fullscreen shell and analog controls with mode id `circle`; useful as a migration/reference point.
- `apps/web/src/game/sprintCircuitTrack.ts`: Current drawing helper already contains a figure-eight-like centerline and checkpoint markers, but Phase 5 should make crossing behavior intentional and tested rather than inheriting ambiguous old sprint-circuit semantics.
- `apps/server/src/games/race/sprintCircuit.ts`: Existing runtime has lap/checkpoint concepts, finish ranking, and countdown/result flow, but still uses old progress/lane-style logic rather than explicit figure-eight gate validation.
- `apps/server/src/games/registry.ts`: Runtime registration currently exposes `race:sprint-circuit` and `race:drag-sprint`; Phase 5 planning must account for a figure-eight variant identity or migration path.
- `apps/web/src/lib/useLiveRaceSocket.ts`: Currently filters only `PARTY_GAME_VARIANTS.sprintCircuit`; Phase 5 likely needs mode/variant-aware filtering rather than hardcoding the old sprint-circuit variant.
- `packages/shared/src/lobby.ts`: `PARTY_GAME_VARIANTS` does not yet include a figure-eight variant; startability currently only accepts `sprint-circuit` and constrained `drag-sprint`.

### Established Patterns
- Shared contracts live in `packages/shared/src` and are consumed by both web and server.
- Server runtime state remains authoritative. Browser inputs are compact player intent.
- Realtime game sessions emit `GameSessionEnvelope` state and `SessionFinishedPayload` results.
- Runtime tests are co-located beside server runtime files and should cover deterministic rule helpers.
- Web page, hook, and component tests are co-located under `apps/web/src`.

### Integration Points
- Shared figure-eight mode/variant fields connect through `packages/shared/src/game.ts`, `packages/shared/src/lobby.ts`, and `packages/shared/src/contracts.ts`.
- Server figure-eight geometry/checkpoint helpers should live under `apps/server/src/games/race/` and be imported by a runtime instead of expanding large runtime files.
- Runtime registration remains in `apps/server/src/games/registry.ts`.
- Web routing connects through `apps/web/src/lib/sessionRoutes.ts` and `apps/web/src/app/router.tsx`.
- Results summary should flow through `GameResults.summary` and include at least laps/track/penalty count when available, with broader result polish still reserved for Phase 6.

</code_context>

<specifics>
## Specific Ideas

- User selected all gray areas and asked to proceed with recommended decisions ("tutte con consigli").
- Preferred first-pass feel: same analog pad as the circular track, but a visibly different figure-eight route where the center crossing is readable and fair.
- The crossing should feel intentional through visual hierarchy, route arrows, next-gate emphasis, and deterministic gate order.
- The figure-eight should be harder than the circle because of route awareness, not because the road is too narrow or penalties are harsh.

</specifics>

<deferred>
## Deferred Ideas

- Final lobby catalog copy, mode cards, route naming polish, and broad result polish belong to Phase 6.
- Simulation-grade physics, car-specific handling, powerups, haptics, sound, and advanced camera effects remain out of scope for this milestone's first figure-eight implementation.
- Player-to-player collision or traffic conflict at the center crossing is deferred; it would add chaos before the base route is proven readable.

</deferred>

---

*Phase: 05-figure-eight-analog-track-race*
*Context gathered: 2026-04-25*
