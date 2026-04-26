---
phase: 03-straight-obstacle-race
plan: 01
subsystem: shared-contracts
tags: [typescript, shared, contracts, tdd, straight-obstacle-race]

requires:
  - phase: 01-fullscreen-game-shell-and-input-foundation
    provides: RaceGameInput, RaceShellSnapshot, fullscreen shell, reusable controls, and game controls hook
  - phase: 02-drag-gear-race
    provides: DragGearInput, DragGearSnapshot, DragShiftQuality, and DragShiftSummary source outputs
provides:
  - Phase 1 and Phase 2 source prerequisite gate for straight-obstacle work
  - Intent-only StraightObstacleInput steering payload contract
  - Straight obstacle snapshot, player, warning, obstacle, and result detail contracts
  - Lobby startability for race:straight-obstacle
affects: [straight-obstacle-race, server-runtime, web-gameplay, results, lobby-startability]

tech-stack:
  added: []
  patterns: [intent-only socket input, server-owned snapshot telemetry, result details metadata]

key-files:
  created:
    - .planning/phases/03-straight-obstacle-race/03-01-SUMMARY.md
  modified:
    - packages/shared/src/game.ts
    - packages/shared/src/contracts.ts
    - packages/shared/src/lobby.ts
    - packages/shared/src/contracts.test.ts

key-decisions:
  - "Straight obstacle client input contains steering intent only: mode, kind, steerX, sequence, and client timestamp."
  - "Straight obstacle distance, speed, warning, obstacle hits, slowdown, finish time, and result details remain server-owned snapshot/result fields."
  - "The new race variant is exposed as PARTY_GAME_VARIANTS.straightObstacle without removing trafficSurvival or adding catalog UI copy."

patterns-established:
  - "StraightObstacleInput is a compact mode/kind-discriminated steering packet for later server validation."
  - "StraightObstacleSnapshot separates player telemetry from active obstacle telemetry and warning state."
  - "GameResultEntry.details carries per-player mode summaries without parsing result labels."

requirements-completed: [DODGE-01, DODGE-02, DODGE-03, DODGE-04, DODGE-05]

duration: 3m 11s
completed: 2026-04-26
---

# Phase 03 Plan 01: Phase Prerequisites And Shared Straight Obstacle Contracts Summary

**Intent-only straight-obstacle steering contracts with server-owned obstacle warnings, slowdown, hit count, finish time, and lobby startability.**

## Performance

- **Duration:** 3m 11s
- **Started:** 2026-04-26T10:59:27Z
- **Completed:** 2026-04-26T11:02:38Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Verified Phase 1 and Phase 2 source outputs before editing Phase 3 shared contracts.
- Added RED contract tests for straight-obstacle input, snapshot, result details, and lobby startability.
- Implemented shared straight-obstacle types in `@blitz/shared`, wired `GameInputPayload`, added `GameResultEntry.details`, and made `race:straight-obstacle` startable.

## Task Commits

1. **Task 1: Gate Phase 3 on Phase 1 and Phase 2 source outputs** - `f991e35` (chore)
2. **Task 2: Add shared straight-obstacle contract tests** - `9f4e9c4` (test)
3. **Task 3: Implement shared straight-obstacle contracts and startability** - `0d22044` (feat)

**Plan metadata:** this summary docs commit

_Note: Task 2/3 followed the TDD RED/GREEN flow. The RED run failed because straight-obstacle exports, result details, and lobby startability were intentionally absent._

## Files Created/Modified

- `packages/shared/src/game.ts` - Added straight-obstacle input, warning, player state, obstacle, snapshot, and result detail contracts.
- `packages/shared/src/contracts.ts` - Added `StraightObstacleInput` to `GameInputPayload` and added typed per-result `details`.
- `packages/shared/src/lobby.ts` - Added `straightObstacle: 'straight-obstacle'` and startability for that race variant.
- `packages/shared/src/contracts.test.ts` - Added straight-obstacle shared contract and startability tests.
- `.planning/phases/03-straight-obstacle-race/03-01-SUMMARY.md` - Recorded plan execution results.

## Decisions Made

- Used the explicit `straight-obstacle` variant instead of repurposing `traffic-survival`.
- Kept input intent-only per T-03-02: no client-authored speed, distance, hit count, slowdown, finish time, rank, or results.
- Stored finish time and obstacle hits in `GameResultEntry.details` so later result UI can render mode summaries without label parsing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made straight-obstacle result details assignable to generic result metadata**
- **Found during:** Task 3 (Implement shared straight-obstacle contracts and startability)
- **Issue:** `StraightObstacleResultDetails` satisfied the required fields but was not assignable to `GameResultEntry.details` because the generic metadata field is a `Record<string, string | number | boolean | null>`.
- **Fix:** Defined `StraightObstacleResultDetails` as the required finish/hit fields intersected with the same metadata record value type.
- **Files modified:** `packages/shared/src/game.ts`
- **Verification:** `pnpm --filter @blitz/shared test`
- **Committed in:** `0d22044`

**Total deviations:** 1 auto-fixed (1 blocking type issue).
**Impact on plan:** The fix preserved the planned contract shape and made the result-details test compile without expanding scope.

## Issues Encountered

- `rg` is not installed in this environment, so source checks used `find` and `grep`.
- Another planning docs commit for Phase 6 appeared between task commits. It was unrelated to this plan and was not reverted.

## Verification

- Phase prerequisite file/export checks - PASS.
- RED verification before implementation: `pnpm --filter @blitz/shared test` - returned nonzero as expected with missing straight-obstacle exports, `GameResultEntry.details`, and `PARTY_GAME_VARIANTS.straightObstacle`.
- GREEN/final verification: `pnpm --filter @blitz/shared test` - PASS.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None - the new shared input/result surfaces were explicitly covered by the plan threat model.

## Next Phase Readiness

Plan 03-02 can implement deterministic steering, obstacle waves, collisions, slowdown, and ranking rules against `StraightObstacleInput`, `StraightObstacleSnapshot`, and `StraightObstacleResultDetails`.

## Self-Check: PASSED

- Verified summary and all modified/created files exist.
- Verified task commits `f991e35`, `9f4e9c4`, and `0d22044` exist in git history.

---
*Phase: 03-straight-obstacle-race*
*Completed: 2026-04-26*
