# Phase 1: Fullscreen Game Shell And Input Foundation - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the reusable fullscreen mobile-first gameplay foundation for the rebuilt race catalog. It should create layout, controls, HUD patterns, and shared input/snapshot contract foundations that later phases can use for drag gear race, straight obstacle race, circular analog race, and figure-eight analog race.

This phase does not implement the full gameplay rules for any single race mode. It builds the shell and control vocabulary needed to make those modes playable.

</domain>

<decisions>
## Implementation Decisions

### Layout schermo telefono
- **D-01:** Use a true fullscreen game route layout for live race sessions, separate from the normal card/panel app page feel.
- **D-02:** Prioritize landscape phone play for racing because it gives room for track visibility and two-thumb controls; still support portrait with stacked/compact controls rather than breaking.
- **D-03:** Track/canvas is the main visual surface and should occupy the center/full available viewport. HUD and controls overlay around it without pushing the track below the fold.
- **D-04:** Hide or minimize normal app chrome during gameplay. The game screen should feel like entering a mode, not like a dashboard page.
- **D-05:** Respect mobile safe areas using CSS env values and avoid controls at the extreme OS gesture edges.

### Schema controlli touch
- **D-06:** Build a reusable control system with three primitives: analog pad, primary action button, and secondary action button.
- **D-07:** Analog pad is required now because circular and figure-eight phases depend on it. It should output continuous x/y direction and magnitude, not only left/right.
- **D-08:** Primary action button changes meaning by mode: accelerate for straight race, shift for drag race if acceleration is held/automatic, or throttle/action if planner chooses that split.
- **D-09:** Secondary action button should support brake/cancel/boost style actions depending on mode, but Phase 1 only needs the primitive and contract shape.
- **D-10:** Controls should use pointer events where possible, with touch fallback if needed, and set `touch-action: none` on gameplay controls.

### Ergonomia mani/pollici
- **D-11:** Design for two-thumb play as the default: left thumb controls direction/analog movement, right thumb controls action/shift/brake.
- **D-12:** Bottom-left is the default analog zone; bottom-right is the default action zone.
- **D-13:** Controls must be large enough for fast play on a phone and stable enough that labels/icons do not shift layout during input.
- **D-14:** One-handed play is not a Phase 1 target. Do not compromise two-thumb racing comfort to support it.
- **D-15:** Visual feedback on press/drag is required: active analog vector, pressed action state, and disabled/unavailable state.

### HUD minimo durante gara
- **D-16:** Keep HUD minimal during active play: mode objective, speed/progress, current penalty/status, and the one mode-critical metric.
- **D-17:** Mode-critical metric examples: RPM/gear/shift window for drag, obstacle hit/slowdown state for straight dodge, lap/checkpoint/direction for analog tracks.
- **D-18:** HUD should live mostly top/side, not over the bottom controls.
- **D-19:** HUD text must be readable on small screens; avoid tiny pixel-font body text for critical gameplay feedback.
- **D-20:** Canvas visuals should not be the only source of gameplay state. Key status needs React-rendered text for testing and accessibility.

### Desktop fallback
- **D-21:** Provide keyboard fallback for every control primitive.
- **D-22:** Recommended default mapping: WASD or arrow keys for analog/directional input, Space/Enter for primary action, Shift or Control for secondary action.
- **D-23:** Desktop fallback is for testing and casual desktop play; phone touch ergonomics remain the primary design target.
- **D-24:** Mouse drag should be allowed on the analog pad for local testing.

### Contratti input/snapshot
- **D-25:** Add shared contract foundations now, not only local UI state. Later runtime phases should not invent incompatible input payloads.
- **D-26:** Use discriminated input shapes by control mode or race mode so server and client can validate intent clearly.
- **D-27:** Include at least these input concepts: analog vector, button pressed/released state, action event, sequence/tick/timestamp.
- **D-28:** Include snapshot concepts that support the common shell: session id, mode id, status, countdown, players, progress, speed, HUD fields, and mode-specific detail payload.
- **D-29:** Contracts should be flexible enough for all four planned modes, but Phase 1 should avoid finalizing detailed physics fields that belong to later phases.

### the agent's Discretion
- Exact CSS class names and component boundaries.
- Whether to create a new generic hook or extend `useLiveRaceSocket`, as long as downstream race modes can use it cleanly.
- Exact visual styling of the HUD and controls, provided the result is fullscreen, readable, and mobile-first.
- Whether initial Phase 1 demo uses placeholder track visuals or adapts the existing `SprintCircuitPage` canvas.

</decisions>

<specifics>
## Specific Ideas

- User wants games that are "effettivamente giocabili" and not self-playing.
- Race variants must stop feeling like copies with the same map.
- Target future controls:
  - Drag race: straight map, accelerate, gear shift timing.
  - Straight obstacle race: straight map, avoid obstacles that slow the car.
  - Circular map: analog pad movement.
  - Figure-eight map: analog pad movement.
- Phase 1 should study control position and gameplay screen layout specifically for phone comfort.
- Recommendation: make the game screen feel more like a dedicated arcade cockpit than the current panel/card route.

</specifics>

<canonical_refs>
## Canonical References

### Project planning
- `.planning/PROJECT.md` — Product vision, active requirements, constraints, and key decisions.
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: CTRL-01 through CTRL-04 and ARCH-01.
- `.planning/ROADMAP.md` — Phase 1 boundary and success criteria.
- `.planning/research/SUMMARY.md` — Recommended build order and common pitfalls.

### Codebase map
- `.planning/codebase/ARCHITECTURE.md` — Existing client/server/shared architecture and runtime registry.
- `.planning/codebase/CONCERNS.md` — Risks around controls, canvas-only gameplay, large race runtime modules, and socket events.
- `.planning/codebase/STACK.md` — Current React/Vite, Express, Socket.IO, TypeScript stack.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/pages/SprintCircuitPage.tsx`: Existing live race route with canvas, HUD, socket state, and touch buttons. Useful as a reference, but the Phase 1 shell should move away from card/page layout into fullscreen gameplay.
- `apps/web/src/components/RetroRaceView.tsx`: Existing local canvas race view with touch/keyboard-like controls. Useful for control examples but not sufficient for realtime shared contracts.
- `apps/web/src/lib/useLiveRaceSocket.ts`: Existing race socket hook. Can be generalized or replaced by a mode-aware input hook.
- `packages/shared/src/game.ts`: Existing race snapshot/input types. Should be extended with discriminated input/snapshot foundations.
- `apps/server/src/games/registry.ts`: Existing runtime registry for selected game/variant. Later phases will plug rebuilt modes into this.

### Established Patterns
- Shared contracts live in `packages/shared` and are consumed by both web and server.
- Server state is authoritative and session state is broadcast through Socket.IO.
- React pages render route-level session screens and navigate to results on `sessionFinished`.
- Tests exist across shared contracts, server runtimes, web routes, and root smoke tests.

### Integration Points
- New fullscreen shell likely connects under `apps/web/src/pages/` or `apps/web/src/components/`.
- New control primitives likely live under `apps/web/src/components/` or a new gameplay-specific component folder.
- Shared input/snapshot types connect through `packages/shared/src/game.ts` and/or `contracts.ts`.
- Existing route resolution in `apps/web/src/lib/sessionRoutes.ts` may need to support mode-specific fullscreen pages later.

</code_context>

<deferred>
## Deferred Ideas

- One-handed accessibility mode — useful later, but not required for Phase 1.
- Sound, haptics, camera shake, and advanced visual juice — valuable polish, but gameplay controls and shell come first.
- Final per-mode physics details — belong to Phases 2-5.
- Leaderboards and persistent stats — out of scope for this milestone.

</deferred>

---

*Phase: 01-fullscreen-game-shell-and-input-foundation*
*Context gathered: 2026-04-25*
