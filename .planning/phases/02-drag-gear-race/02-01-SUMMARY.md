---
phase: 02-drag-gear-race
plan: 01
subsystem: shared-contracts
tags: [typescript, shared, contracts, tdd, drag-race]

requires:
  - phase: 01-fullscreen-game-shell-and-input-foundation
    provides: RaceGameInput, RaceShellSnapshot, fullscreen shell, action controls, and game controls hook
provides:
  - Phase 1 source prerequisite gate for drag race work
  - Intent-only DragGearInput throttle and shift payload contracts
  - Drag gear snapshot, player telemetry, shift window, quality, and summary contracts
affects: [drag-gear-race, server-runtime, web-gameplay, results]

tech-stack:
  added: []
  patterns: [as-const literal unions, intent-only socket input, shared snapshot telemetry contracts]

key-files:
  created:
    - .planning/phases/02-drag-gear-race/02-01-SUMMARY.md
  modified:
    - packages/shared/src/game.ts
    - packages/shared/src/contracts.ts
    - packages/shared/src/contracts.test.ts

key-decisions:
  - "Drag client input contains throttle and shift intent only; speed, RPM, distance, finish time, ranking, and shift summaries remain server-derived."
  - "Shift quality labels are the fixed shared vocabulary: early, good, perfect, and late."
  - "Phase 2 execution is gated on Phase 1 shell/control source outputs before drag contracts are edited."

patterns-established:
  - "DragGearInput uses discriminated intent packets for throttle state and one-shot shift actions."
  - "DragGearSnapshot exposes server-owned telemetry and player result fields for later runtime and UI plans."

requirements-completed: [DRAG-01, DRAG-02, DRAG-03, DRAG-04, DRAG-05, ARCH-02]

duration: 2m 55s
completed: 2026-04-25
---

# Phase 02 Plan 01: Phase 1 Gate And Shared Drag Gear Contracts Summary

**Intent-only drag throttle/shift contracts with server-owned RPM, speed, distance, shift quality, and summary telemetry.**

## Performance

- **Duration:** 2m 55s
- **Started:** 2026-04-25T21:34:21Z
- **Completed:** 2026-04-25T21:37:16Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Verified Phase 1 source outputs before Phase 2 edits: fullscreen shell, action button, game controls hook, `RaceGameInput`, and `RaceShellSnapshot`.
- Added contract tests first for drag throttle and shift input, snapshot telemetry, and shift summary shapes.
- Implemented shared drag gear contracts and wired `DragGearInput` into `GameInputPayload` while preserving legacy generic payload compatibility.

## Task Commits

1. **Task 1: Gate Phase 2 on Phase 1 source outputs** - `3ea3372` (chore)
2. **Task 2: Add drag gear contract tests** - `b678b42` (test)
3. **Task 3: Implement shared drag gear contracts** - `686b397` (feat)

**Plan metadata:** this summary docs commit

_Note: Task 2/3 followed the TDD RED/GREEN flow. The RED run failed because drag gear exports were intentionally absent._

## Files Created/Modified

- `packages/shared/src/game.ts` - Added drag shift quality, summary, shift window, throttle/shift input, player telemetry, and snapshot types.
- `packages/shared/src/contracts.ts` - Added `DragGearInput` to the generic session input payload union.
- `packages/shared/src/contracts.test.ts` - Added contract tests for intent-only drag input, snapshot telemetry, and shift summary.
- `.planning/phases/02-drag-gear-race/02-01-SUMMARY.md` - Recorded plan execution results.

## Decisions Made

- Kept drag input intentionally small: `drag-throttle` and `drag-shift` packets carry only sequence, client timestamp, and throttle pressed state.
- Kept authoritative gameplay fields out of client input and in snapshot/player/result-adjacent contracts.
- Preserved existing `RaceGameInput`, `PlayerInput`, and generic object compatibility in `GameInputPayload`.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope changes.

## Issues Encountered

- `rg` was unavailable during the stub scan, so `grep -RInE` was used as the fallback. It found only an existing null guard in `game.ts`, not a stub.
- The worktree had a pre-existing unstaged `.planning/STATE.md` modification. It was not staged or changed by this plan.

## Verification

- `pnpm --filter @blitz/shared test` - PASS after implementation.
- RED verification before implementation - FAIL as expected with missing drag gear exports.
- Phase 1 prerequisite checks - PASS.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None.

## Next Phase Readiness

Plan 02 can implement deterministic drag gear scoring and acceleration rules against the shared `DragGearInput`, `DragGearSnapshot`, `DragShiftWindow`, and `DragShiftSummary` contracts.

## Self-Check: PASSED

- Verified summary and all modified/created files exist.
- Verified task commits `3ea3372`, `b678b42`, and `686b397` exist in git history.

---
*Phase: 02-drag-gear-race*
*Completed: 2026-04-25*
