---
phase: 02-drag-gear-race
plan: 02
subsystem: server-game-rules
tags: [typescript, node-test, drag-race, tdd, server-authoritative]

requires:
  - phase: 02-drag-gear-race
    provides: Intent-only drag throttle/shift contracts from Plan 01
provides:
  - Deterministic drag gear shift scoring helpers
  - Server-side throttle, RPM, speed, distance, finish, ranking, and summary rules
  - Guard coverage for malformed input, repeated sequences, non-racing state, and over-max gear shifts
affects: [drag-gear-runtime, drag-hud, drag-results, server-runtime-tests]

tech-stack:
  added: []
  patterns: [pure server rule helpers, node-test tdd, sequence-guarded input parsing]

key-files:
  created:
    - apps/server/src/games/race/dragGearRules.ts
    - apps/server/src/games/race/dragGearRules.test.ts
    - .planning/phases/02-drag-gear-race/02-02-SUMMARY.md
  modified: []

key-decisions:
  - "Shift scoring uses server RPM windows only; clientTimeMs is validated for packet shape but never used for scoring or finish time."
  - "Held throttle and gear-specific acceleration derive speed, RPM, distance, and finish time from server state."
  - "Sequence guards ignore repeated input and invalid shifts instead of mutating authoritative player state."

patterns-established:
  - "Drag rule helpers return copied player state and stay independent of Socket.IO/runtime timers."
  - "Drag shift summary aggregation is a pure helper over server-owned player state."

requirements-completed: [DRAG-01, DRAG-02, DRAG-03, ARCH-02]

duration: 4m 32s
completed: 2026-04-25
---

# Phase 02 Plan 02: Deterministic Drag Gear Scoring And Acceleration Rules Summary

**Pure server drag gear rules for throttle acceleration, RPM-based shift quality, finish ordering, and shift summaries.**

## Performance

- **Duration:** 4m 32s
- **Started:** 2026-04-25T21:39:50Z
- **Completed:** 2026-04-25T21:44:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added RED tests first for early/good/perfect/late shift windows, held-throttle acceleration, input spam guards, finish ordering, competent-run pacing, and summary counts.
- Implemented `dragGearRules.ts` with deterministic helpers for input parsing, shift scoring, player advancement, ranking, and summary aggregation.
- Verified a competent held-throttle run finishes within the required 12000-18000 ms range using `DEFAULT_DRAG_GEAR_TUNING`.

## Task Commits

1. **Task 1: Add deterministic drag gear rule tests** - `27f9583` (test)
2. **Task 2: Implement pure drag gear rule helpers** - `799df53` (feat)

**Plan metadata:** this summary docs commit

_Note: Task 1/2 followed the TDD RED/GREEN flow. The RED run failed as expected because `dragGearRules.ts` did not exist._

## Files Created/Modified

- `apps/server/src/games/race/dragGearRules.test.ts` - Deterministic Node tests for shift windows, acceleration, input guards, finish ordering, competent pacing, and summary counts.
- `apps/server/src/games/race/dragGearRules.ts` - Pure drag gear rule helpers with default tuning, server-side input validation, RPM scoring, advancement, rankings, and summary helpers.
- `.planning/phases/02-drag-gear-race/02-02-SUMMARY.md` - Recorded plan execution results.

## Decisions Made

- Used a pure helper state that includes runtime-only fields such as `lastInputSequence`, `shiftPowerMultiplier`, and `elapsedMs` so the runtime adapter can keep authoritative calculations outside Socket.IO handlers.
- Kept `clientTimeMs` as packet-shape data only; scoring and finish time are derived from server RPM, elapsed time, and distance.
- Tuned default gear acceleration and max speeds to satisfy the 12-18 second competent-run gate without adding randomness.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Avoided stale shared package declaration imports**
- **Found during:** Task 2 (Implement pure drag gear rule helpers)
- **Issue:** Server typecheck resolves `@blitz/shared` types through built `dist` declarations, which did not expose the new Plan 01 drag-specific types in this worktree. Importing `DragShiftQuality`, `DragShiftSummary`, and `DragShiftWindow` from `@blitz/shared` failed with TS2305.
- **Fix:** Exported local rule-layer versions of those types from `dragGearRules.ts` while keeping shared `RACE_STATUS`, `RaceStatus`, and `GameResultEntry` imports. This stayed inside the owned server helper file and preserved runtime behavior.
- **Files modified:** `apps/server/src/games/race/dragGearRules.ts`
- **Verification:** `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts` passed.
- **Committed in:** `799df53`

---

**Total deviations:** 1 auto-fixed (Rule 3).
**Impact on plan:** No behavior scope change. Future runtime wiring can align these local rule types with shared package declarations when the shared build surface is refreshed.

## Issues Encountered

- The RED run initially failed for the expected missing `dragGearRules.ts` module. After removing an unnecessary test import of `DragGearInput`, the RED failure was limited to the missing helper module.
- The existing server test script still executes all server tests before the appended file argument; the focused command passed with all 10 server tests green.

## Verification

- RED: `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts` - FAIL as expected before implementation with missing `./dragGearRules.js`.
- GREEN: `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts` - PASS.
- Final verification: `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts` - PASS, 10 tests passed.
- Acceptance grep checks confirmed required exports, `maxGear: 4`, `distanceTargetM: 402`, required test names, and no `clientTimeMs` usage inside `scoreShift`.

## TDD Gate Compliance

- RED commit present: `27f9583` (`test(02-02): add failing test for drag gear rules`)
- GREEN commit present after RED: `799df53` (`feat(02-02): implement drag gear rule helpers`)
- REFACTOR commit: not needed; no cleanup-only changes were made after the green implementation.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. Stub scan found only intentional nullable finish-time and object guards.

## Threat Flags

None. The new socket-payload-to-rule-helper validation surface matches the plan threat model and mitigates malformed/replayed input in `readDragGearInput` and `applyDragGearInput`.

## Next Phase Readiness

Plan 03 can import `dragGearRules.ts` from the `race:drag-sprint` runtime adapter and use the pure helpers for authoritative throttle, shift, finish, ranking, and result-summary behavior.

## Self-Check: PASSED

- Verified created files exist: `apps/server/src/games/race/dragGearRules.ts`, `apps/server/src/games/race/dragGearRules.test.ts`, and this summary.
- Verified task commits `27f9583` and `799df53` exist in git history.
- Verified final focused server test passed.

---
*Phase: 02-drag-gear-race*
*Completed: 2026-04-25*
