---
phase: 03-straight-obstacle-race
plan: 05
subsystem: web-gameplay-routing
tags: [react, vitest, react-router, mobile-controls, straight-obstacle-race, tdd]

requires:
  - phase: 01-fullscreen-game-shell-and-input-foundation
    provides: FullscreenGameShell, GameViewport, and mobile-first no-chrome gameplay route patterns
  - phase: 03-straight-obstacle-race
    provides: StraightObstacleSnapshot/Input contracts, authoritative runtime snapshots, and DodgeRoadView/DodgeHud/DodgeSteeringPad controls from Plans 01 through 04
provides:
  - Route-level fullscreen straight-obstacle gameplay page wired to generic session socket state
  - Explicit `/race/straight-obstacle/:sessionId` top-level route outside app chrome
  - Session route resolver mapping for `race:straight-obstacle`
  - Route tests for HUD, controls, no app chrome, steering intent, finish navigation, and empty/error states
affects: [straight-obstacle-race, web-gameplay, session-routing, mobile-controls, results-flow]

tech-stack:
  added: []
  patterns: [Top-level fullscreen gameplay route, authoritative snapshot type guard, route-level monotonic steering sequence wrapper, generic session result storage]

key-files:
  created:
    - apps/web/src/pages/StraightObstacleRacePage.tsx
    - apps/web/src/pages/StraightObstacleRacePage.test.tsx
    - .planning/phases/03-straight-obstacle-race/03-05-SUMMARY.md
  modified:
    - apps/web/src/app/router.tsx
    - apps/web/src/lib/sessionRoutes.ts

key-decisions:
  - "Straight obstacle sessions use a dedicated top-level fullscreen route at `/race/straight-obstacle/:sessionId`, outside AppLayout chrome."
  - "StraightObstacleRacePage renders only server-owned straight-obstacle snapshots and submits steering intent through generic `client:game-input`."
  - "The route rewrites steering sequence values with a route-local monotonic counter so neutral reset packets cannot make later same-session input stale."

patterns-established:
  - "Use route-specific snapshot guards before passing generic session state into gameplay HUD/viewport components."
  - "Store finished generic session payloads under `blitz-results:{sessionId}` and replace-navigate to `/results/{sessionId}` with route state."
  - "Keep race variant session routing in `sessionRoutes.ts` explicit for mechanically distinct fullscreen pages."

requirements-completed: [DODGE-01, DODGE-02, DODGE-03, DODGE-04]

duration: 8m 12s
completed: 2026-04-26
---

# Phase 03 Plan 05: Fullscreen Straight-Obstacle Route And Session Routing Summary

**Live `race:straight-obstacle` sessions now open a fullscreen dodge page with authoritative road/HUD rendering, steering intent submission, and result navigation.**

## Performance

- **Duration:** 8m 12s
- **Started:** 2026-04-26T11:39:58Z
- **Completed:** 2026-04-26T11:48:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added RED page/route tests for the straight-obstacle fullscreen route, dodge HUD/road/control rendering, chrome absence, steering submission, finish navigation, and waiting/connection states.
- Implemented `StraightObstacleRacePage` with `FullscreenGameShell`, `GameViewport`, `DodgeRoadView`, `DodgeHud`, `DodgeSteeringPad`, and `useDodgeRaceControls`.
- Registered `/race/straight-obstacle/:sessionId` outside `AppLayout` and mapped `race:straight-obstacle` session starts to that route.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add straight-obstacle page and route tests** - `a39612a` (test)
2. **Task 2: Implement straight-obstacle fullscreen page and routing** - `0726ede` (feat)

**Plan metadata:** this summary docs commit

_Note: Task 1/2 followed the TDD RED/GREEN flow. The RED run failed because `/race/straight-obstacle/session-dodge` had no registered route and rendered React Router's 404._

## Files Created/Modified

- `apps/web/src/pages/StraightObstacleRacePage.tsx` - Route-level fullscreen dodge session page using generic session socket state, snapshot guarding, dodge HUD/road/control components, neutral steering reset, and result navigation.
- `apps/web/src/pages/StraightObstacleRacePage.test.tsx` - Vitest/Testing Library route tests for fullscreen rendering, no app chrome, route resolution, pointer/keyboard steering, finish storage/navigation, and waiting/connection states.
- `apps/web/src/app/router.tsx` - Adds the top-level `/race/straight-obstacle/:sessionId` route outside normal app chrome.
- `apps/web/src/lib/sessionRoutes.ts` - Resolves `race:straight-obstacle` session-start payloads to the new fullscreen route.
- `.planning/phases/03-straight-obstacle-race/03-05-SUMMARY.md` - Records plan execution results.

## Decisions Made

- Used the generic `useGameSessionSocket()` path for this route so steering continues through `client:game-input` rather than stale race-specific socket events.
- Kept the page as an adapter: it type-checks authoritative straight-obstacle snapshots and never computes speed, distance, hits, slowdown, finish time, rank, or result details.
- Wrapped outgoing steering sequence values at the page boundary with a monotonic route-local counter initialized from time to avoid stale sequence values after reset/navigation lifecycle edges.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prevented neutral reset packets from poisoning future steering sequence order**
- **Found during:** Task 2 (Implement straight-obstacle fullscreen page and routing)
- **Issue:** A direct neutral reset packet initially used an artificial maximum sequence, which could make later same-session steering packets stale if the route was remounted.
- **Fix:** Added a route-local monotonic sequence wrapper for all outgoing straight-obstacle steering inputs, including neutral resets.
- **Files modified:** `apps/web/src/pages/StraightObstacleRacePage.tsx`
- **Verification:** `pnpm --filter @blitz/web test -- StraightObstacleRacePage.test.tsx`, `pnpm run build`, and `pnpm test` passed.
- **Committed in:** `0726ede`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix stayed inside the route integration surface and preserved intent-only input.

## Issues Encountered

- The web test script runs all web test files even when a focused filename is passed after `--`; the focused command still passed and included `StraightObstacleRacePage.test.tsx`.
- The waiting-state assertion was tightened to the overlay heading because `DodgeHud` also correctly renders `Waiting for dodge race` in its polite live region when no snapshot is present.

## Verification

- RED verification: `pnpm --filter @blitz/web test -- StraightObstacleRacePage.test.tsx` - failed as expected on React Router 404 for `/race/straight-obstacle/session-dodge`.
- GREEN focused verification: `pnpm --filter @blitz/web test -- StraightObstacleRacePage.test.tsx` - PASS, 22 web test files and 63 tests passed.
- Project build: `pnpm run build` - PASS.
- Project tests: `pnpm test` - PASS (`@blitz/shared` 20 tests, `@blitz/server` 57 tests, `@blitz/web` 63 tests, root Node tests 7 tests).

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None - the new route/input/result surfaces are covered by T-03-01 through T-03-04 in the plan threat model.

## Next Phase Readiness

Plan 03-06 can render dodge-specific result summaries from the stored finished payloads and run the final Phase 3 verification gate.

## Self-Check: PASSED

- Verified `apps/web/src/pages/StraightObstacleRacePage.tsx` exists.
- Verified `apps/web/src/pages/StraightObstacleRacePage.test.tsx` exists.
- Verified `.planning/phases/03-straight-obstacle-race/03-05-SUMMARY.md` exists.
- Verified task commits `a39612a` and `0726ede` exist in git history.

---
*Phase: 03-straight-obstacle-race*
*Completed: 2026-04-26*
