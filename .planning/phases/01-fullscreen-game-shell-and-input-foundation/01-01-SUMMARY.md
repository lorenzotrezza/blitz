---
phase: 01-fullscreen-game-shell-and-input-foundation
plan: 01
subsystem: shared-contracts
tags: [typescript, contracts, race-input, socket-io, tdd]
requires: []
provides:
  - Discriminated race input contracts for analog, button, and action events
  - Common race shell snapshot contract for fullscreen HUD/rendering consumers
  - Runtime guard and analog vector clamp helper for race input validation
affects:
  - 01-fullscreen-game-shell-and-input-foundation
  - 02-drag-gear-race
  - 03-straight-obstacle-race
  - 04-circular-analog-track-race
  - 05-figure-eight-analog-track-race
tech-stack:
  added: []
  patterns:
    - Shared discriminated unions exported through packages/shared/src/index.ts
    - Runtime type guard plus deterministic clamp helper for untrusted race input
key-files:
  created:
    - .planning/phases/01-fullscreen-game-shell-and-input-foundation/01-01-SUMMARY.md
  modified:
    - packages/shared/src/game.ts
    - packages/shared/src/contracts.ts
    - packages/shared/src/contracts.test.ts
key-decisions:
  - "Race input remains player intent only; no result, rank, or authoritative position fields were added."
  - "Existing generic GameInputPayload compatibility was preserved with PlayerInput and Record payload support."
patterns-established:
  - "RaceGameInput uses kind, sequence, clientTimeMs, and modeId across all race control payloads."
  - "RaceShellSnapshot keeps common HUD/player fields separate from mode-specific detail payloads."
requirements-completed: [ARCH-01]
duration: 5m 23s
completed: 2026-04-25
---

# Phase 01 Plan 01: Shared Race Input And Shell Snapshot Contracts Summary

**Discriminated race input contracts and common fullscreen race shell snapshots in `@blitz/shared`**

## Performance

- **Duration:** 5m 23s
- **Started:** 2026-04-25T19:18:17Z
- **Completed:** 2026-04-25T19:23:40Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added typed race input contracts for analog vectors, button state changes, and action events.
- Added a common `RaceShellSnapshot` shape for fullscreen HUD/rendering consumers.
- Added `clampRaceAnalogVector` and `isRaceGameInput` so future server runtimes can reject malformed race intent before applying it.
- Preserved legacy `PlayerInput` and generic payload compatibility for existing lights, penalty, and race runtimes.

## Task Commits

1. **Task 1: Add Wave 0 shared contract tests** - `5600773` (test)
2. **Task 2: Implement shared race input and shell snapshot contracts** - `f2e6551` (feat)

## Files Created/Modified

- `packages/shared/src/game.ts` - Added race shell constants, discriminated input unions, snapshot interfaces, clamp helper, and runtime guard.
- `packages/shared/src/contracts.ts` - Widened `GameInputPayload` to include `RaceGameInput`, `PlayerInput`, and existing generic records.
- `packages/shared/src/contracts.test.ts` - Added ARCH-01 contract smoke tests and guard/helper coverage.

## Verification

- RED gate: `pnpm --filter @blitz/shared test` failed after Task 1 because `RaceGameInput`, `RaceGameInputKind`, `RaceShellModeId`, `RaceShellSnapshot`, and `RaceShellStatus` were not exported yet.
- GREEN gate: `pnpm --filter @blitz/shared test` passed after Task 2.

## Decisions Made

- Used shared constants as object maps matching the existing `RACE_STATUS` pattern.
- Kept `RaceActionInput.action` as a string so later mode phases can define mode-specific action names without changing the base transport.
- Kept stale race-specific socket events untouched because consolidation is a separate concern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type Bug] Fixed generic payload assertions after tightening `GameInputPayload`**
- **Found during:** Task 2
- **Issue:** Existing direct property access on `GameInputPayload` no longer type-checked once the type became a union including discriminated race inputs.
- **Fix:** Kept generic payload assignment compatibility and changed assertions to use deep equality or an explicit property check.
- **Files modified:** `packages/shared/src/contracts.test.ts`
- **Verification:** `pnpm --filter @blitz/shared test`
- **Committed in:** `f2e6551`

**2. [Rule 2 - Missing Critical Verification] Added guard/helper smoke coverage**
- **Found during:** Task 2
- **Issue:** The threat mitigation required a runtime race input guard, but the initial Wave 0 tests only checked exported shapes.
- **Fix:** Added focused coverage for analog clamping plus valid/invalid `isRaceGameInput` samples.
- **Files modified:** `packages/shared/src/contracts.test.ts`
- **Verification:** `pnpm --filter @blitz/shared test`
- **Committed in:** `f2e6551`

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical verification)  
**Impact on plan:** Both were local to ARCH-01 contract correctness and did not expand product scope.

## Known Stubs

None.

## Issues Encountered

- `rg` is not installed in this environment, so acceptance string checks used `grep`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 01-02 can import `RaceGameInput`, `RaceShellSnapshot`, `RaceShellModeId`, and the guard/clamp helpers from `@blitz/shared` through the existing barrel export.

## Self-Check: PASSED

- Confirmed summary and modified source files exist.
- Confirmed task commits `5600773` and `f2e6551` exist in git history.

---
*Phase: 01-fullscreen-game-shell-and-input-foundation*
*Completed: 2026-04-25*
