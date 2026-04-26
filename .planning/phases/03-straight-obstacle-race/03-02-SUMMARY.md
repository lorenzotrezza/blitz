---
phase: 03-straight-obstacle-race
plan: 02
subsystem: server-game-rules
tags: [typescript, node-test, deterministic-rules, straight-obstacle-race, tdd]

requires:
  - phase: 03-straight-obstacle-race
    provides: Intent-only StraightObstacleInput, StraightObstacleSnapshot, StraightObstacleResultDetails, and startable race:straight-obstacle variant from Plan 01
provides:
  - Pure deterministic straight-obstacle steering, obstacle wave, collision, slowdown, recovery, finish, and ranking helpers
  - Focused Node tests for DODGE steering, readable waves, obstacle hits, recovery, and result details
affects: [straight-obstacle-race, server-runtime, results, mobile-gameplay]

tech-stack:
  added: []
  patterns: [pure game rule helpers, deterministic seeded obstacle templates, server-owned result details]

key-files:
  created:
    - apps/server/src/games/race/straightObstacleRules.ts
    - apps/server/src/games/race/straightObstacleRules.test.ts
    - .planning/phases/03-straight-obstacle-race/03-02-SUMMARY.md
  modified:
    - apps/server/src/games/race/straightObstacleRules.test.ts

key-decisions:
  - "Straight obstacle rules stay pure and side-effect free: no timers, Socket.IO, DOM, or mutable globals."
  - "Obstacle waves use seeded deterministic templates with continuous normalized x collision bounds."
  - "Obstacle hits are counted once per player/obstacle and produce server-owned slowdown and result details."

patterns-established:
  - "Use createInitialStraightObstacleState() plus advanceStraightObstacleRace() as the runtime adapter boundary."
  - "Rank straight-obstacle results by finish time first, then distance for unfinished players."
  - "Expose warning text states directly from rule state for later React HUD rendering."

requirements-completed: [DODGE-01, DODGE-02, DODGE-03, DODGE-05]

duration: 5m 59s
completed: 2026-04-26
---

# Phase 03 Plan 02: Deterministic Straight Obstacle Rules Summary

**Pure straight-obstacle race rules with smooth steering, seeded readable obstacle waves, collision slowdown/recovery, and obstacle-hit result details.**

## Performance

- **Duration:** 5m 59s
- **Started:** 2026-04-26T11:07:27Z
- **Completed:** 2026-04-26T11:13:26Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added RED tests for steering clamp behavior, seeded wave determinism/readability, movement bounds, collision slowdown, recovery, and rankings.
- Implemented `STRAIGHT_OBSTACLE_TUNING` and pure helpers for state creation, obstacle generation, race advancement, hit detection, and results.
- Verified focused rule coverage plus root build/test gates after implementation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add straight-obstacle rule tests** - `6724de3` (test)
2. **Task 2: Implement deterministic straight-obstacle rule helpers** - `2000c6a` (feat)

**Plan metadata:** this summary docs commit

_Note: Task 1/2 followed the TDD RED/GREEN flow. The RED run failed because `./straightObstacleRules.js` did not exist yet._

## Files Created/Modified

- `apps/server/src/games/race/straightObstacleRules.ts` - Pure deterministic helper module for tuning, steering clamp, obstacle waves, collision, slowdown/recovery, finish, and rankings.
- `apps/server/src/games/race/straightObstacleRules.test.ts` - Node tests covering the straight-obstacle rule behavior and result metadata.
- `.planning/phases/03-straight-obstacle-race/03-02-SUMMARY.md` - Recorded plan execution results.

## Decisions Made

- Used normalized road x coordinates with player center clamped to `[-0.82, 0.82]`.
- Used deterministic wave templates starting at `180m` with at least `95m` spacing in this first tune, leaving escape room in early waves.
- Stored hit state on obstacle `hitPlayerIds` so repeated overlap with the same obstacle/player does not double-count.
- Formatted result labels as finish time or distance plus hit count, with typed `details: { finishTimeMs, obstacleHits }`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rebuilt shared package types before the RED server test**
- **Found during:** Task 1 (Add straight-obstacle rule tests)
- **Issue:** The server workspace resolves `@blitz/shared` through `packages/shared/dist`, and the new Plan 03-01 shared types were present in source but not in the generated type output.
- **Fix:** Ran `pnpm --filter @blitz/shared build` so the server TypeScript check could see `StraightObstacleObstacle`.
- **Files modified:** none tracked
- **Verification:** RED run then failed only on missing `./straightObstacleRules.js`.
- **Committed in:** not committed; generated build output is ignored.

**2. [Rule 1 - Test acceptance] Made obstacle-hit details assertion literal**
- **Found during:** Task 2 (Implement deterministic straight-obstacle rule helpers)
- **Issue:** The test asserted `details?.obstacleHits`, but the plan acceptance check required the source text `details.obstacleHits`.
- **Fix:** Assigned `details` after an `assert.ok(details)` guard and asserted `details.obstacleHits`.
- **Files modified:** `apps/server/src/games/race/straightObstacleRules.test.ts`
- **Verification:** `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts`
- **Committed in:** `2000c6a`

**Total deviations:** 2 auto-fixed (1 blocking environment issue, 1 test acceptance issue).
**Impact on plan:** No scope expansion; both fixes supported the planned TDD and acceptance gates.

## Issues Encountered

- The server test script runs every server test file before applying the extra CLI path argument, so focused verification still executed the whole server test suite.
- An unrelated Phase 6 planning docs commit appeared between the Task 1 and Task 2 commits. It was not reverted or modified.

## Verification

- RED focused verification: `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts` - failed as expected on missing `./straightObstacleRules.js`.
- GREEN focused verification: `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts` - PASS, 11 server test files passed.
- Project build: `pnpm run build` - PASS.
- Project tests: `pnpm test` - PASS (`@blitz/shared` 20 tests, `@blitz/server` 53 tests, `@blitz/web` 55 tests, root Node tests 7 tests).

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None - the new rule helpers match the plan threat model for clamped steering input and server-owned result/ranking derivation.

## Next Phase Readiness

Plan 03-03 can adapt `createInitialStraightObstacleState()`, `advanceStraightObstacleRace()`, and `buildStraightObstacleResults()` into an authoritative `race:straight-obstacle` runtime with a server tick and latest steering intent storage.

## Self-Check: PASSED

- Verified `apps/server/src/games/race/straightObstacleRules.ts`, `apps/server/src/games/race/straightObstacleRules.test.ts`, and this summary file exist.
- Verified task commits `6724de3` and `2000c6a` exist in git history.

---
*Phase: 03-straight-obstacle-race*
*Completed: 2026-04-26*
