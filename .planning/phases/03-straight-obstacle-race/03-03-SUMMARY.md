---
phase: 03-straight-obstacle-race
plan: 03
subsystem: server-runtime
tags: [typescript, node-test, authoritative-runtime, registry, straight-obstacle-race, tdd]

requires:
  - phase: 03-straight-obstacle-race
    provides: StraightObstacleInput, StraightObstacleSnapshot, straight-obstacle lobby startability, and pure straight-obstacle rule helpers from Plans 01 and 02
provides:
  - Authoritative `race:straight-obstacle` runtime adapter with server tick progression
  - Runtime input validation, clamping, stale-sequence rejection, and latest-intent coalescing
  - Registry entry for `race:straight-obstacle`
  - Runtime and registry tests for lifecycle, tick advancement, malformed input rejection, and obstacle-hit result details
affects: [straight-obstacle-race, server-runtime, registry, session-results, mobile-gameplay]

tech-stack:
  added: []
  patterns: [server-authoritative tick runtime, latest-intent input coalescing, TDD RED-GREEN runtime coverage]

key-files:
  created:
    - apps/server/src/games/race/straightObstacle.ts
    - apps/server/src/games/race/straightObstacle.test.ts
    - .planning/phases/03-straight-obstacle-race/03-03-SUMMARY.md
  modified:
    - apps/server/src/games/registry.ts
    - apps/server/src/games/registry.test.ts

key-decisions:
  - "Straight obstacle runtime advances on a server-owned interval using the latest valid steering intent per player."
  - "Runtime input accepts only straight-obstacle steer packets with finite increasing sequence values and finite steerX."
  - "Client-claimed speed, distance, hits, slowdown, finish, and rank fields are ignored because the runtime stores only clamped steering intent."

patterns-established:
  - "Use createStraightObstacleRuntime() as the registry adapter around pure straightObstacleRules helpers."
  - "Use injected timer APIs for deterministic runtime tests while defaulting to unref'd server timers in production."
  - "Finish payloads use buildStraightObstacleResults() so labels and details stay server-owned."

requirements-completed: [DODGE-01, DODGE-02, DODGE-03, DODGE-05]

duration: 7m 17s
completed: 2026-04-26
---

# Phase 03 Plan 03: Authoritative Straight Obstacle Runtime Summary

**Authoritative straight-obstacle server runtime registered as `race:straight-obstacle`, with tick-based steering, validated input coalescing, and obstacle-hit result details.**

## Performance

- **Duration:** 7m 17s
- **Started:** 2026-04-26T11:17:12Z
- **Completed:** 2026-04-26T11:24:29Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added RED runtime and registry tests covering start snapshots, clamped steering, malformed/stale input rejection, neutral tick progression, finish payloads, and registry resolution.
- Implemented `createStraightObstacleRuntime()` around the pure Phase 3 rule helpers with default 3s countdown, 50ms server tick, injected timers for tests, and single `onFinished` emission.
- Registered `race:straight-obstacle` without changing existing `race:drag-sprint` or `race:sprint-circuit` entries.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add straight-obstacle runtime and registry tests** - `9289d77` (test)
2. **Task 2: Implement straight-obstacle runtime and registry entry** - `6b53f9d` (feat)

**Plan metadata:** this summary docs commit

_Note: Task 1/2 followed the TDD RED/GREEN flow. The RED run failed only because `./straightObstacle.js` did not exist yet._

## Files Created/Modified

- `apps/server/src/games/race/straightObstacle.ts` - Authoritative runtime adapter for straight-obstacle sessions, server ticks, input validation, snapshots, removal, disposal, and finish payloads.
- `apps/server/src/games/race/straightObstacle.test.ts` - Runtime tests for lifecycle, steering validation, neutral tick progression, finish payload details, and client-claimed field rejection.
- `apps/server/src/games/registry.ts` - Added `race:straight-obstacle` entry wired to `createStraightObstacleRuntime`.
- `apps/server/src/games/registry.test.ts` - Added registry assertion for `race:straight-obstacle`.
- `.planning/phases/03-straight-obstacle-race/03-03-SUMMARY.md` - Recorded plan execution results.

## Decisions Made

- Used an always-running server interval for this mode once active, because obstacle warnings, slowdown recovery, and distance must progress even when steering is neutral.
- Kept `applyInput()` side effects narrow: it validates, clamps, sequence-checks, and stores latest steering only; physics and results are produced by the server tick.
- Removed disconnected participants from the active straight-obstacle rule state so remaining active racers determine finish.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test Correctness] Corrected client-claimed field test steering**
- **Found during:** Task 2 (Implement straight-obstacle runtime and registry entry)
- **Issue:** The RED test used a later valid packet with client-claimed server fields and `steerX: -1`, which would correctly replace the earlier positive steering intent. That made the test assert the wrong steering direction.
- **Fix:** Kept the payload valid but changed its steering value to an out-of-range positive number, so the test still covers claimed server fields ignored while preserving clamped positive steering behavior.
- **Files modified:** `apps/server/src/games/race/straightObstacle.test.ts`
- **Verification:** `pnpm --filter @blitz/server test -- src/games/race/straightObstacle.test.ts src/games/registry.test.ts`
- **Committed in:** `6b53f9d`

**2. [Rule 3 - Blocking] Typed the fake interval handle for the runtime test harness**
- **Found during:** Task 2 (Implement straight-obstacle runtime and registry entry)
- **Issue:** Once the runtime type existed, the fake `setInterval` return object in the test harness was not assignable to Node's `Timeout` type.
- **Fix:** Cast the deterministic fake handle to `ReturnType<typeof setInterval>` so the test remains deterministic without using real timers.
- **Files modified:** `apps/server/src/games/race/straightObstacle.test.ts`
- **Verification:** `pnpm --filter @blitz/server test -- src/games/race/straightObstacle.test.ts src/games/registry.test.ts`
- **Committed in:** `6b53f9d`

**Total deviations:** 2 auto-fixed (1 test correctness issue, 1 blocking type issue).
**Impact on plan:** Both fixes supported the intended tests and implementation. No scope expansion.

## Issues Encountered

- `rg` is not installed in this environment, so source checks used `grep` and direct file reads.
- The server test script runs every server test file before applying extra CLI path arguments, so focused verification executed the full server test suite.

## Verification

- RED focused verification: `pnpm --filter @blitz/server test -- src/games/race/straightObstacle.test.ts src/games/registry.test.ts` - failed as expected on missing `./straightObstacle.js`.
- GREEN focused verification: `pnpm --filter @blitz/server test -- src/games/race/straightObstacle.test.ts src/games/registry.test.ts` - PASS, 12 server test files passed.
- Post-commit focused verification: `pnpm --filter @blitz/server test -- src/games/race/straightObstacle.test.ts src/games/registry.test.ts` - PASS.
- Project build: `pnpm run build` - PASS.
- Project tests: `pnpm test` - PASS (`@blitz/shared` 20 tests, `@blitz/server` 57 tests, `@blitz/web` 55 tests, root Node tests 7 tests).

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None - the new untrusted input surface was already covered by T-03-01 through T-03-03 in the plan threat model.

## Next Phase Readiness

Plan 03-04 can build the dodge road, HUD, steering controls, keyboard fallback, and CSS against a registered authoritative `race:straight-obstacle` runtime and its typed snapshots/results.

## Self-Check: PASSED

- Verified `apps/server/src/games/race/straightObstacle.ts`, `apps/server/src/games/race/straightObstacle.test.ts`, and this summary file exist.
- Verified task commits `9289d77` and `6b53f9d` exist in git history.

---
*Phase: 03-straight-obstacle-race*
*Completed: 2026-04-26*
