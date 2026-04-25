# Roadmap: Blitz Playable Minigames

**Created:** 2026-04-25
**Granularity:** Standard
**Core Value:** Every minigame must feel manually playable on a phone.

## Summary

| # | Phase | Goal | Requirements | UI hint |
|---|-------|------|--------------|---------|
| 1 | Fullscreen Game Shell And Input Foundation | Establish mobile-first gameplay layout and reusable input contracts. | CTRL-01, CTRL-02, CTRL-03, CTRL-04, ARCH-01 | yes |
| 2 | Drag Gear Race | Ship a straight drag race where acceleration and shift timing decide the result. | DRAG-01, DRAG-02, DRAG-03, DRAG-04, DRAG-05, ARCH-02 | yes |
| 3 | Straight Obstacle Race | Ship a straight race where the player avoids obstacles that slow the car. | DODGE-01, DODGE-02, DODGE-03, DODGE-04, DODGE-05 | yes |
| 4 | Circular Analog Track Race | Ship analog-pad control on a circular checkpoint/lap track. | ANLG-01, ANLG-02, ANLG-04, ANLG-05 | yes |
| 5 | Figure-Eight Analog Track Race | Ship a second analog map with a figure-eight layout and readable crossing behavior. | ANLG-03 | yes |
| 6 | Lobby, Results, And Regression Polish | Expose all modes clearly and verify the whole party flow still works. | FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05, ARCH-03, ARCH-04 | yes |

## Phase 1: Fullscreen Game Shell And Input Foundation

**Goal:** Create the reusable fullscreen mobile game surface, controls, and shared contracts that every rebuilt race mode will use.

**Requirements:** CTRL-01, CTRL-02, CTRL-03, CTRL-04, ARCH-01

**Success Criteria:**
1. A session route can render a fullscreen game layout with canvas/track area, HUD, and fixed bottom controls without page scrolling on mobile viewport.
2. Touch controls use pointer/touch-safe behavior and stay usable with thumbs.
3. Desktop fallback inputs exist for the same gameplay commands.
4. Shared contracts include discriminated input/snapshot shapes for the rebuilt race modes.
5. Tests cover shell rendering, control presence, and contract exports.

**Implementation Notes:**
- Build the shell before individual game polish.
- Prefer reusable controls: analog pad, action button, shift button, lane/steer control.
- Keep React HUD separate from canvas so status is testable.

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Shared race input and shell snapshot contracts
- [x] 01-02-PLAN.md — Reusable analog/action controls and keyboard fallback
- [ ] 01-03-PLAN.md — Fullscreen shell, viewport, HUD, states, and gameplay CSS
- [ ] 01-04-PLAN.md — Live race route integration and phase gate verification

## Phase 2: Drag Gear Race

**Goal:** Replace drag race with a skill-based gear timing game on a straight map.

**Requirements:** DRAG-01, DRAG-02, DRAG-03, DRAG-04, DRAG-05, ARCH-02

**Success Criteria:**
1. Player can accelerate and shift gears during a straight race.
2. Early/perfect/late shifts produce measurably different acceleration curves and finish times.
3. HUD shows RPM, gear, speed, distance, and last shift quality.
4. Results include finish time and shift summary.
5. Runtime rule tests cover shift timing, acceleration, finish, and ranking.

**Implementation Notes:**
- Drag race should not require steering.
- The ideal shift window must be visible enough to learn quickly.
- A single-player or two-player manual test should clearly show better timing wins.

**Plans:** 6 plans

Plans:
- [ ] 02-01-PLAN.md — Phase 1 prerequisite gate and shared drag gear contracts
- [ ] 02-02-PLAN.md — Deterministic drag gear scoring and acceleration rules
- [ ] 02-03-PLAN.md — Server runtime adapter for `race:drag-sprint`
- [ ] 02-04-PLAN.md — Drag HUD, RPM meter, straight track, and action controls
- [ ] 02-05-PLAN.md — Fullscreen drag route and throttle/shift input lifecycle
- [ ] 02-06-PLAN.md — Drag results summary and final verification gate

## Phase 3: Straight Obstacle Race

**Goal:** Create a separate straight race where obstacle avoidance and slowdown recovery are the core skill loop.

**Requirements:** DODGE-01, DODGE-02, DODGE-03, DODGE-04, DODGE-05

**Success Criteria:**
1. Player controls lane or horizontal position on a straight track.
2. Obstacles spawn in readable patterns with reaction time.
3. Collisions apply visible slowdown/penalty and affect final time.
4. HUD shows distance, speed, warnings, and hit/slowdown state.
5. Results include finish time and obstacle hit count.

**Implementation Notes:**
- This mode should feel different from drag race even though the map is also straight.
- Obstacle hit feedback must be immediate: sound/flash/shake can come later, but speed/HUD feedback is required.

**Plans:** 6 plans

Plans:
- [ ] 03-01-PLAN.md — Phase prerequisites, shared straight-obstacle contracts, and startability
- [ ] 03-02-PLAN.md — Deterministic steering, obstacle waves, collisions, slowdown, and rankings
- [ ] 03-03-PLAN.md — Authoritative straight-obstacle runtime and registry integration
- [ ] 03-04-PLAN.md — Dodge road, HUD, steering controls, keyboard fallback, and CSS
- [ ] 03-05-PLAN.md — Fullscreen straight-obstacle route and session routing
- [ ] 03-06-PLAN.md — Dodge results summary and final verification gate

## Phase 4: Circular Analog Track Race

**Goal:** Ship the first analog-pad track mode using a circular map with laps and checkpoints.

**Requirements:** ANLG-01, ANLG-02, ANLG-04, ANLG-05

**Success Criteria:**
1. Player controls car direction/speed with analog-style input.
2. Circular track renders clear boundaries, route direction, checkpoint gates, and lap progress.
3. Runtime validates checkpoint order and lap completion.
4. Off-track or wrong-way behavior has clear feedback and penalties.
5. HUD shows lap, checkpoint, speed, and penalty state.

**Implementation Notes:**
- Tune analog controls on mobile before increasing difficulty.
- Circle is the baseline analog mode; keep it readable and forgiving.

## Phase 5: Figure-Eight Analog Track Race

**Goal:** Add a distinct figure-eight map using the same analog control system and fair crossing/intersection feedback.

**Requirements:** ANLG-03

**Success Criteria:**
1. Figure-eight track renders as a visibly different map from the circle.
2. Checkpoint/lap logic handles the crossing without ambiguous progress.
3. Player receives clear direction/next-checkpoint feedback.
4. The crossing/intersection feels intentional rather than broken.
5. Existing circular analog tests still pass.

**Implementation Notes:**
- Reuse analog control and track rule helpers from Phase 4.
- Add geometry tests for figure-eight checkpoints and crossing order.

## Phase 6: Lobby, Results, And Regression Polish

**Goal:** Make the rebuilt race catalog clear in the party flow and verify all modes integrate with lobby, sessions, and results.

**Requirements:** FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05, ARCH-03, ARCH-04

**Success Criteria:**
1. Lobby exposes all four rebuilt race variants with clear objective/control copy.
2. Starting each variant routes to the correct fullscreen game screen.
3. Results page renders mode-specific summaries.
4. Existing Semaforo, Rigori, lobby, invite, ready, post-game, and Render build flows still work.
5. Root `pnpm test` and `pnpm run build` pass.

**Implementation Notes:**
- This is where old duplicate race labels/routes should be removed or renamed.
- Verify mobile viewport manually before considering the milestone done.

## Coverage

- v1 requirements: 28 total
- Requirements mapped: 28
- Unmapped: 0

---
*Roadmap created: 2026-04-25*
