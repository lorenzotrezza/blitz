# Phase 3: Straight Obstacle Race - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 creates a separate straight-line obstacle race where obstacle avoidance and slowdown recovery are the core skill loop.

This phase delivers the dodge-specific runtime rules, shared input/snapshot fields, mobile gameplay controls, HUD feedback, deterministic rule tests, and result summary for DODGE-01 through DODGE-05.

This phase does not add gear shifting, RPM timing, drag shift summaries, analog track steering, checkpoints, laps, powerups, lobby catalog polish, or new non-race modes. Those belong to other phases.

</domain>

<decisions>
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

### the agent's Discretion
- Exact steering sensitivity and horizontal track width.
- Exact obstacle sizes, wave spacing, and first-pass difficulty curve.
- Exact visual treatment for warnings, collision flash, or slowdown state, provided feedback is immediate and readable.
- Whether the implementation creates a new `straight-obstacle` runtime/page or replaces an existing race variant route, as long as Phase 6 can expose the final catalog cleanly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/PROJECT.md` - Product vision, mobile-first playability goal, active straight obstacle race requirement, and server-authoritative constraint.
- `.planning/REQUIREMENTS.md` - Phase 3 requirements: DODGE-01 through DODGE-05.
- `.planning/ROADMAP.md` - Phase 3 boundary, success criteria, and implementation notes.
- `.planning/STATE.md` - Current milestone state and decisions to preserve.

### Prior phase decisions
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md` - Fullscreen gameplay shell, two-thumb controls, readable HUD, desktop fallback, and shared contract direction.
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md` - Approved mobile gameplay UI contract, control sizing, HUD rules, typography, color, and shared contract expectations.
- `.planning/phases/02-drag-gear-race/02-CONTEXT.md` - Drag-specific timing decisions and explicit boundary excluding steering, obstacles, and lane changes from Phase 2.

### Codebase map
- `.planning/codebase/ARCHITECTURE.md` - Runtime registry, socket flow, shared contract boundary, and session/result lifecycle.
- `.planning/codebase/CONCERNS.md` - Large race runtime risk, stale race events, canvas-only state risk, and mobile control concerns.
- `.planning/codebase/STRUCTURE.md` - Where to add new realtime game contracts, runtimes, pages, hooks, and tests.
- `.planning/codebase/CONVENTIONS.md` - TypeScript, React, socket, runtime, and test conventions.
- `.planning/codebase/STACK.md` - Current React/Vite, Express, Socket.IO, TypeScript, and pnpm workspace stack.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shared/src/game.ts`: Existing race types include old drag lane, obstacle, and pickup concepts. Phase 3 should add or refine dodge-specific fields instead of reusing drag powerups accidentally.
- `packages/shared/src/contracts.ts`: `client:game-input`, `server:session-state`, and `server:session-finished` are the active session event family. Phase 3 should use these rather than stale race-specific events.
- `apps/server/src/games/race/sprintCircuit.ts`: Current race runtime has continuous-ish lane offset movement and soft collision patterns that can inform helpers, but Phase 3 needs straight obstacle rules rather than circuit lap logic.
- `apps/server/src/games/race/dragSprint.ts`: Current drag runtime contains obstacles and pickups from the old mode. This is useful as a migration warning, not as the desired mechanic model.
- `apps/server/src/games/registry.ts`: Runtime registration currently supports `race:sprint-circuit` and `race:drag-sprint`; Phase 3 planning must decide the integration target while preserving existing session startup flow.
- `apps/web/src/lib/useGameSessionSocket.ts`: Generic session hook can submit typed game inputs and receive session envelopes.
- `apps/web/src/lib/useLiveRaceSocket.ts`: Existing race-specific hook emits steer/accelerate/brake every 50ms. Phase 3 may adapt or replace this with dodge-specific continuous steering and obstacle snapshot semantics.
- `apps/web/src/pages/SprintCircuitPage.tsx`: Existing live race page shows the old panel/canvas/control pattern. Phase 3 should use the Phase 1 fullscreen shell once available.
- `apps/web/src/pages/ResultsPage.tsx`: Generic results page can display rankings and summary values, but may need mode-specific obstacle hit count rendering.

### Established Patterns
- Shared contracts live in `packages/shared/src` and are consumed by both web and server.
- Server runtime state remains authoritative. Client input is intent, not final outcome.
- Realtime game sessions emit `GameSessionEnvelope` state and `SessionFinishedPayload` results.
- Runtime tests are co-located beside server runtime files and should cover deterministic rule helpers.
- Web page and hook tests are co-located under `apps/web/src`.

### Integration Points
- Shared dodge input/snapshot/result fields connect through `packages/shared/src/game.ts` and `packages/shared/src/contracts.ts`.
- Server dodge rules should live in a smaller helper/reducer module imported by the runtime rather than expanding already-large runtime files.
- Runtime registration remains in `apps/server/src/games/registry.ts`.
- Web route integration should use the Phase 1 fullscreen game shell/control primitives if Phase 1 execution has produced them; otherwise planning should include adapting the route after Phase 1 lands.
- Results summary should flow through `GameResults.summary` and include obstacle hit count.

</code_context>

<specifics>
## Specific Ideas

- User selected all gray areas and approved the recommended defaults.
- Preferred player feel: steer smoothly left/right, dodge readable obstacle waves, and feel a clear slowdown when colliding.
- The straight obstacle race must feel different from drag even though both use a straight road.
- A good first tune is continuous horizontal control, deterministic waves, visible warning distance, immediate speed cut, and short slowdown recovery.
- Results should make the run understandable: finish time plus obstacle hit count.

</specifics>

<deferred>
## Deferred Ideas

- Gear shifting, RPM cueing, and shift performance summary belong to Phase 2.
- Analog pad steering, checkpoints, laps, off-track penalties, and wrong-way logic belong to Phases 4 and 5.
- Lobby catalog copy, mode cards, and broad result polish belong to Phase 6.
- Sound, haptics, camera shake, and advanced visual juice remain polish after the core mechanics work.
- Powerups and hazards beyond the initial obstacle race remain out of scope for this milestone's first dodge implementation.

</deferred>

---

*Phase: 03-straight-obstacle-race*
*Context gathered: 2026-04-25*
