---
phase: 02-drag-gear-race
plan: 03
subsystem: server-runtime
tags: [typescript, node-test, drag-race, tdd, server-authoritative]

requires:
  - phase: 02-drag-gear-race
    provides: Shared drag gear contracts and deterministic pure drag gear rules from Plans 01 and 02
provides:
  - `race:drag-sprint` runtime adapter for the authoritative drag gear race
  - Runtime tests for throttle hold, elapsed-time shift scoring, rankings, and drag summary payloads
  - Registry continuity verification for the existing `race:drag-sprint` key
affects: [drag-gear-runtime, drag-hud, drag-results, server-session-flow]

tech-stack:
  added: []
  patterns: [runtime adapter around pure rules, elapsed-time advancement on input, tdd red-green commits]

key-files:
  created:
    - .planning/phases/02-drag-gear-race/02-03-SUMMARY.md
  modified:
    - apps/server/src/games/race/dragSprint.ts
    - apps/server/src/games/race/dragSprint.test.ts

key-decisions:
  - "The existing `race:drag-sprint` registry key now runs a straight drag gear race instead of lane, obstacle, survival, or multi-round behavior."
  - "Held throttle progresses from server elapsed time on later valid drag input; clients do not need to stream repeated throttle packets."
  - "Shift timing is scored after advancing server-owned RPM to the current runtime time."

patterns-established:
  - "Runtime adapters call pure rule helpers and keep transport/session lifecycle concerns in the runtime file."
  - "Drag finish summaries use stable keys for finish time and shift quality counts."

requirements-completed: [DRAG-01, DRAG-02, DRAG-03, DRAG-05, ARCH-02]

duration: 6m 12s
completed: 2026-04-25
---

# Phase 02 Plan 03: Server Runtime Adapter For `race:drag-sprint` Summary

**Existing drag-sprint sessions now run the server-authoritative hold-throttle and gear-shift race.**

## Performance

- **Duration:** 6m 12s
- **Started:** 2026-04-25T21:47:39Z
- **Completed:** 2026-04-25T21:53:51Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced the old drag sprint runtime tests with gear-race lifecycle coverage before implementation.
- Rewrote `createDragSprintRuntime` as an adapter around `dragGearRules.ts`, preserving the existing registry key and session lifecycle.
- Added runtime finish payload coverage for rankings and summary keys: finish time plus perfect/good/early/late/total shift counts.

## Task Commits

1. **Task 1: Rewrite drag sprint runtime tests for gear racing** - `c23b87c` (test)
2. **Task 2: Replace drag sprint runtime with gear adapter** - `f6158bd` (feat)

**Plan metadata:** this summary docs commit

_Note: Task 1/2 followed the TDD RED/GREEN flow. The RED run failed against the old lane-era runtime, including `drag-strip` and missing gear fields._

## Files Created/Modified

- `apps/server/src/games/race/dragSprint.test.ts` - Gear-race runtime tests for start state, throttle, elapsed hold, elapsed shift scoring, ignored old inputs, finish rankings, and summary payloads.
- `apps/server/src/games/race/dragSprint.ts` - Runtime adapter for straight drag gear racing using pure helper rules and existing session callbacks.
- `apps/server/src/games/registry.ts` - Verified unchanged; `race:drag-sprint` still points to `createDragSprintRuntime`.
- `.planning/phases/02-drag-gear-race/02-03-SUMMARY.md` - Recorded plan execution results.

## Decisions Made

- Kept `race:drag-sprint` as the compatibility key while changing its behavior to `trackId: 'straight-drag-gear'`.
- Removed lane/obstacle/power-up/multi-round behavior from the runtime rather than keeping compatibility fields in snapshots.
- Used local runtime snapshot interfaces because this server package still resolves shared drag snapshot declarations through stale built package output.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Avoided stale shared package declaration imports**
- **Found during:** Task 1 and Task 2
- **Issue:** `@blitz/shared` server imports still resolved through built declarations that did not expose `DragGearSnapshot`.
- **Fix:** Used local runtime/test snapshot interfaces matching the shared source shape while continuing to use shared session, lobby, and status types.
- **Files modified:** `apps/server/src/games/race/dragSprint.ts`, `apps/server/src/games/race/dragSprint.test.ts`
- **Verification:** `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts src/games/race/dragSprint.test.ts` passed.
- **Committed in:** `c23b87c`, `f6158bd`

**2. [Rule 1 - Bug] Advanced elapsed runtime time in rule-sized chunks**
- **Found during:** Task 2
- **Issue:** The pure `advanceDragGearPlayer` helper intentionally clamps one advancement step to 1000 ms, so a runtime input after a multi-second throttle hold initially advanced only the first second.
- **Fix:** `advanceDragPlayersToNow` now consumes elapsed server time in 1000 ms chunks before scoring drag shifts or checking finish state.
- **Files modified:** `apps/server/src/games/race/dragSprint.ts`
- **Verification:** Runtime tests for held throttle, elapsed shift scoring, and finish summary passed.
- **Committed in:** `f6158bd`

---

**Total deviations:** 2 auto-fixed (Rule 3: 1, Rule 1: 1).
**Impact on plan:** No scope change. Both fixes were required for correctness in the existing workspace.

## Issues Encountered

- The focused package test script runs all server test files before the appended file arguments; the full server package test set passed.
- Parallel planning commits landed between this plan's task commits in git history. No unrelated files were modified or reverted.

## Verification

- RED: `pnpm --filter @blitz/server test -- src/games/race/dragSprint.test.ts` - FAIL as expected against the old runtime.
- GREEN/final: `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts src/games/race/dragSprint.test.ts` - PASS, 10 server test files passed.
- Acceptance greps confirmed required runtime strings, required test names, and absence of `pickups` and `survival` in `dragSprint.ts`.

## TDD Gate Compliance

- RED commit present: `c23b87c` (`test(02-03): add failing drag sprint runtime gear tests`)
- GREEN commit present after RED: `f6158bd` (`feat(02-03): implement drag gear sprint runtime`)
- REFACTOR commit: not needed; no cleanup-only changes were made after the green implementation.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. Stub scan found only intentional nullable runtime fields and empty option/test fixtures.

## Threat Flags

None. The changed socket runtime surface matches the plan threat model: client input is parsed as throttle/shift intent only, and speed/RPM/distance/results are server-derived.

## Next Phase Readiness

Plan 04 can build the drag HUD and controls against snapshots with `trackId`, `distanceTargetM`, `shiftWindow`, `gear`, `rpm`, `speedKmh`, `distanceM`, `lastShiftQuality`, and `shiftSummary`.

## Self-Check: PASSED

- Verified summary and all modified files exist.
- Verified task commits `c23b87c` and `f6158bd` exist in git history.
- Verified final focused server test passed.

---
*Phase: 02-drag-gear-race*
*Completed: 2026-04-25*
