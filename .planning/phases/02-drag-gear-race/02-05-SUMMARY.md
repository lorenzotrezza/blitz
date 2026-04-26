---
phase: 02-drag-gear-race
plan: 05
subsystem: ui
tags: [react, router, fullscreen-gameplay, drag-gear, vitest]

requires:
  - phase: 01-fullscreen-game-shell-and-input-foundation
    provides: FullscreenGameShell and reusable game controls
  - phase: 02-drag-gear-race
    provides: drag contracts, server runtime, and drag HUD/control components
provides:
  - Fullscreen drag gear race route for race:drag-sprint sessions
  - Intent-only throttle and shift submission through the generic session socket
  - Lifecycle release handling for stuck-throttle prevention
affects: [drag-gear-race, race-routing, results-navigation]

tech-stack:
  added: []
  patterns: [fullscreen route outside app chrome, route-local keyboard fallback, sessionStorage result handoff]

key-files:
  created:
    - apps/web/src/pages/DragGearRacePage.tsx
  modified:
    - apps/web/src/pages/DragGearRacePage.test.tsx
    - apps/web/src/app/router.tsx
    - apps/web/src/lib/sessionRoutes.ts

key-decisions:
  - "Drag sprint sessions now resolve to /race/drag/:sessionId instead of the generic live race route."
  - "The drag page emits only drag-throttle and drag-shift intent payloads; speed, RPM, and result state remain server-derived."
  - "Route-local cleanup releases throttle on cancellation, blur, hidden visibility, finish, disconnect, and unmount."

patterns-established:
  - "Mode-specific race pages can compose the Phase 1 fullscreen shell with mode-specific HUD, viewport, and controls."
  - "Keyboard fallback can be captured at the route level when a game mode needs keys to map differently than generic race controls."

requirements-completed: [DRAG-01, DRAG-02, DRAG-04]

duration: 18min
completed: 2026-04-26
---

# Phase 02: Drag Gear Race Plan 05 Summary

**Fullscreen drag gear session route with tested throttle, shift, cleanup, and session-start routing**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-26T10:08:00Z
- **Completed:** 2026-04-26T10:26:37Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `DragGearRacePage` for live `race:drag-sprint` sessions using the fullscreen shell, drag HUD, straight track, and drag action controls.
- Routed `race:drag-sprint` session starts to `/race/drag/:sessionId` and registered that route outside normal app chrome.
- Covered pointer, keyboard, finish navigation, disconnect, visibility, blur, cancel, and unmount release behavior in `DragGearRacePage.test.tsx`.

## Task Commits

1. **Task 1: Add drag gear page and routing tests** - `2b462c4` (test)
2. **Task 2: Implement drag gear session route** - `b412adb` (feat)

## Files Created/Modified

- `apps/web/src/pages/DragGearRacePage.tsx` - Live fullscreen drag gear route that submits throttle and shift intent.
- `apps/web/src/pages/DragGearRacePage.test.tsx` - Route, controls, cleanup, result handoff, and route-resolution tests.
- `apps/web/src/app/router.tsx` - Registers `/race/drag/:sessionId` as a fullscreen route.
- `apps/web/src/lib/sessionRoutes.ts` - Routes `race:drag-sprint` session starts to the drag page.

## Decisions Made

- Kept drag controls intent-only by mapping Phase 1 primary button state to `drag-throttle` and the `shift` action to `drag-shift`.
- Captured `Space`, `ArrowUp`, `Shift`, and `Enter` on the route to prevent generic race keyboard listeners from emitting analog or non-drag inputs.
- Stored finished payloads under `blitz-results:${finished.sessionId}` before replacing navigation to `/results/:sessionId`.

## Deviations from Plan

### Auto-fixed Issues

**1. Test harness state reset for disconnect lifecycle**
- **Found during:** Task 2 verification
- **Issue:** The disconnect release assertion attempted to press throttle while the mocked page was still in a finished state, so controls were disabled.
- **Fix:** Reset the mock session to an active drag session and rerender before pressing throttle for the disconnect release check.
- **Files modified:** `apps/web/src/pages/DragGearRacePage.test.tsx`
- **Verification:** `pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx`
- **Committed in:** `b412adb`

---

**Total deviations:** 1 auto-fixed test harness issue
**Impact on plan:** No scope change; the test now exercises the intended disconnect cleanup path.

## Issues Encountered

- Initial focused test execution hung because the route cleanup effect depended on the entire controls object, whose identity changes after control state updates. The implementation now depends on stable control callbacks, preventing repeated cleanup loops.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx` - passed, 17 test files / 52 tests.

## Next Phase Readiness

Plan 06 can now render drag-specific results because drag sessions navigate through `/results/:sessionId` with the server-finished payload stored in route state and session storage.

---
*Phase: 02-drag-gear-race*
*Completed: 2026-04-26*
