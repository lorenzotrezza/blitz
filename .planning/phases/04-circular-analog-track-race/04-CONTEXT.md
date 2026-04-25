# Phase 4: Circular Analog Track Race - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 ships the first analog-pad race mode: a circular track where players steer with continuous analog input, complete ordered checkpoints and laps, and receive clear feedback for off-track or wrong-way behavior.

This phase delivers circular analog runtime rules, shared input/snapshot fields, mobile gameplay controls, HUD feedback, deterministic checkpoint/penalty tests, route/runtime integration, and a basic results summary for ANLG-01, ANLG-02, ANLG-04, and ANLG-05.

This phase does not add the figure-eight layout or crossing/intersection logic. That belongs to Phase 5. It also does not add lobby catalog polish for all rebuilt modes, which belongs to Phase 6.

</domain>

<decisions>
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

### the agent's Discretion
- Exact analog sensitivity, drag, speed cap, turn damping, and grace-window constants.
- Exact number and placement of circular checkpoint gates, provided validation is deterministic and readable.
- Exact visual treatment for arrows, gates, off-track warning, and wrong-way warning.
- Whether the first implementation creates new helper modules under `apps/server/src/games/race/` or refactors reusable pieces out of `sprintCircuit.ts`, as long as new rules are tested and large runtime files do not grow unnecessarily.
- Exact route/page naming, provided the mode can be started and played through the existing session flow.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/PROJECT.md` - Product vision, active circular analog requirement, mobile-first playability goal, and server-authoritative constraint.
- `.planning/REQUIREMENTS.md` - Phase 4 requirements: ANLG-01, ANLG-02, ANLG-04, and ANLG-05.
- `.planning/ROADMAP.md` - Phase 4 boundary, success criteria, and implementation notes.
- `.planning/STATE.md` - Current milestone state and decisions to preserve.

### Prior phase decisions
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md` - Fullscreen gameplay shell, bottom-left analog zone, readable HUD, desktop fallback, and shared contract direction.
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md` - Approved mobile gameplay UI contract, analog pad sizing, HUD rules, typography, safe areas, and shared input expectations.
- `.planning/phases/02-drag-gear-race/02-CONTEXT.md` - Drag-specific boundary and the explicit exclusion of analog steering from Phase 2.
- `.planning/phases/03-straight-obstacle-race/03-CONTEXT.md` - Dodge-specific control and obstacle decisions plus the explicit deferral of analog checkpoints/laps to Phase 4.

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
- `packages/shared/src/game.ts`: Existing race snapshots already include lap, checkpoint, progress, penalties, speed, and player pose fields. Phase 4 should add analog/circle-specific fields rather than reusing old discrete `steer` only.
- `packages/shared/src/contracts.ts`: `client:game-input`, `server:session-state`, and `server:session-finished` are the active session event family. Use these for analog input and snapshots.
- `apps/server/src/games/race/sprintCircuit.ts`: Existing runtime has lap/checkpoint concepts, finish ranking, soft collision, and countdown/result flow. It is a useful migration reference, but its polyline track and discrete steering are not the desired circular analog model.
- `apps/server/src/games/race/sprintCircuit.test.ts`: Shows the current location and style for deterministic race runtime tests.
- `apps/server/src/games/registry.ts`: Runtime registration point for new race variants.
- `apps/web/src/lib/useGameSessionSocket.ts`: Generic session hook can submit typed game inputs and receive session envelopes.
- `apps/web/src/lib/useLiveRaceSocket.ts`: Existing race hook emits old discrete steering every 50ms. It is useful as a caution/reference, but phase 4 should emit analog vectors instead.
- `apps/web/src/pages/SprintCircuitPage.tsx`: Existing live race page draws a canvas and React HUD, but still uses panel/card layout and button controls. Phase 4 should move toward the fullscreen shell contract.
- `apps/web/src/game/sprintCircuitTrack.ts`: Existing drawing helper demonstrates canvas track rendering and checkpoint markers; phase 4 should create a simpler circular/oval drawing helper.
- `apps/web/src/pages/ResultsPage.tsx`: Generic results page can render rankings and can carry mode-specific summary values.

### Established Patterns
- Shared contracts live in `packages/shared/src` and are consumed by both web and server.
- Server runtime state is authoritative; browser inputs are intents.
- Realtime game sessions emit `GameSessionEnvelope` state and `SessionFinishedPayload` results.
- Runtime tests are co-located beside server runtime files and should cover deterministic rule helpers.
- Web page and hook tests are co-located under `apps/web/src`.

### Integration Points
- Shared analog/circle input and snapshot fields connect through `packages/shared/src/game.ts` and `packages/shared/src/contracts.ts`.
- Server circular track rules should live in focused helper modules imported by a runtime under `apps/server/src/games/race/`.
- Runtime registration remains in `apps/server/src/games/registry.ts`, with shared variant/startability updates in `packages/shared/src/lobby.ts` if a new variant is introduced.
- Web route integration should use the Phase 1 fullscreen game shell/control primitives if available; otherwise the plan must include implementing the minimum compatible shell surface from the approved Phase 1 docs.
- Results summary should flow through `GameResults.summary` and include lap count and penalty count at minimum.

</code_context>

<specifics>
## Specific Ideas

- Defaulted non-interactive discussion areas to recommended choices because this session cannot use the interactive question UI.
- Preferred player feel: push the analog pad, guide the car around a clear circular track, hit checkpoints in order, and recover from mistakes without instant failure.
- Circle track is the baseline analog mode. It should be readable and forgiving before Phase 5 adds figure-eight crossing complexity.
- The circular mode should feel mechanically distinct from drag timing and straight obstacle dodging.
- First-pass tuning should make control quality visible: smoother analog input produces fewer penalties and a faster finish.

</specifics>

<deferred>
## Deferred Ideas

- Figure-eight map, crossing/intersection behavior, and crossing-specific checkpoint ambiguity belong to Phase 5.
- Final lobby catalog polish, mode cards, and broad route/result polish belong to Phase 6.
- Simulation-grade tire physics, car handling differences, powerups, haptics, and advanced camera effects remain out of scope for this milestone's first analog circle.
- Player-to-player collision in analog track races is deferred unless it falls out naturally from existing helpers without risking analog control feel.

</deferred>

---

*Phase: 04-circular-analog-track-race*
*Context gathered: 2026-04-25*
