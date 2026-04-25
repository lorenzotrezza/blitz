---
phase: 01-fullscreen-game-shell-and-input-foundation
plan: 04
subsystem: web-route-integration
tags: [react, vitest, socket-io, fullscreen-gameplay, race-controls]
requires:
  - phase: 01-fullscreen-game-shell-and-input-foundation
    plan: 01
    provides: shared RaceGameInput and RaceShellSnapshot contracts
  - phase: 01-fullscreen-game-shell-and-input-foundation
    plan: 02
    provides: reusable analog/action controls and useGameControls lifecycle
  - phase: 01-fullscreen-game-shell-and-input-foundation
    plan: 03
    provides: fullscreen game shell, viewport, HUD, states, and gameplay CSS
provides:
  - Fullscreen live race route outside the normal AppLayout chrome
  - Integrated Sprint Circuit shell with canvas, React HUD, analog pad, GO, and BRAKE controls
  - useLiveRaceSocket adapter that submits shared RaceGameInput intent through client:game-input
  - Route tests for chrome isolation, HUD/control rendering, finish navigation, and typed control emission
affects:
  - 02-drag-gear-race
  - 03-straight-obstacle-race
  - 04-circular-analog-track-race
  - 05-figure-eight-analog-track-race
tech-stack:
  added: []
  patterns:
    - Live race routes compose shared fullscreen shell primitives instead of app panel/card chrome
    - Socket hooks expose typed submitInput adapters while server snapshots/results stay authoritative
key-files:
  created:
    - .planning/phases/01-fullscreen-game-shell-and-input-foundation/01-04-SUMMARY.md
  modified:
    - apps/web/src/pages/SprintCircuitPage.tsx
    - apps/web/src/pages/SprintCircuitPage.test.tsx
    - apps/web/src/app/router.tsx
    - apps/web/src/app/router.test.tsx
    - apps/web/src/lib/useLiveRaceSocket.ts
key-decisions:
  - "The live race route is a top-level router branch so AppLayout topbar, viewport, panel, and card chrome do not constrain gameplay."
  - "SprintCircuitPage adapts authoritative RaceSnapshot data into RaceShellSnapshot HUD text; client controls emit intent only."
patterns-established:
  - "Fullscreen race pages keep canvas visuals in GameViewport and render status, entrants, progress, and inputs as React text."
  - "useLiveRaceSocket filters generic session events by session id plus game === 'race' and submits shared RaceGameInput payloads."
requirements-completed: [CTRL-01, CTRL-02, CTRL-03, CTRL-04, ARCH-01]
duration: 11m 25s
completed: 2026-04-25
---

# Phase 01 Plan 04: Live Race Route Integration And Phase Gate Verification Summary

**Fullscreen live Sprint Circuit route with reusable HUD/control shell and typed race-input socket emission**

## Performance

- **Duration:** 11m 25s
- **Started:** 2026-04-25T19:51:10Z
- **Completed:** 2026-04-25T20:02:35Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added route tests proving `/race/live/:sessionId` renders the fullscreen shell, HUD text, canvas, STEER analog pad, `GO`, and `BRAKE`.
- Moved `/race/live/:sessionId` outside `AppLayout`, removing normal top navigation and panel/card/viewport page chrome from the live race route.
- Reworked `SprintCircuitPage` to compose `FullscreenGameShell`, `GameViewport`, `GameHud`, `GameEmptyState`, `GameErrorState`, `AnalogPad`, `ActionButton`, and `useGameControls`.
- Replaced interval-based legacy steering emission in `useLiveRaceSocket` with `submitInput(input: RaceGameInput)` for typed `client:game-input` intent.
- Ran the required Phase 1 gate commands: shared tests, web tests, root tests, and production build.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend route integration tests** - `920bb65` (test)
2. **Task 2: Integrate shell, controls, route branch, and typed input emission** - `7dfe72e` (feat)
3. **Task 3: Run phase gate verification** - `80e0399` (chore, empty verification record)

## Files Created/Modified

- `apps/web/src/pages/SprintCircuitPage.test.tsx` - Route tests for fullscreen shell, chrome absence, finish storage/navigation, and typed button input emission.
- `apps/web/src/app/router.test.tsx` - Added `renders live race route outside app chrome`.
- `apps/web/src/app/router.tsx` - Moved the live race route to a top-level branch outside `AppLayout`.
- `apps/web/src/lib/useLiveRaceSocket.ts` - Added connection state plus `submitInput(input: RaceGameInput)` and removed old steer/brake interval API.
- `apps/web/src/pages/SprintCircuitPage.tsx` - Integrated fullscreen shell, HUD adapter, canvas viewport, entrant text, analog pad, primary/secondary buttons, and reset-on-finish behavior.

## Verification

- RED gate: `pnpm --filter @blitz/web test -- SprintCircuitPage.test.tsx router.test.tsx` failed after Task 1 because the route still rendered old `AppLayout` chrome and legacy panel/card controls.
- GREEN gate: `pnpm --filter @blitz/web test -- SprintCircuitPage.test.tsx router.test.tsx` passed after Task 2 with 15 files and 41 tests passing.
- Typecheck: `pnpm --filter @blitz/web lint` passed after Task 2.
- Phase gate: `pnpm --filter @blitz/shared test` passed.
- Phase gate: `pnpm --filter @blitz/web test` passed with 15 files and 41 tests.
- Phase gate: `pnpm test` passed, including pretest lint/build/bootstrap, shared, server, web, and root tests.
- Phase gate: `pnpm run build` passed for shared, server, and web.

## Decisions Made

- Kept the Sprint Circuit route as the Phase 1 integration target instead of introducing a new route, preserving current lobby/session/result flow.
- Treated the race shell HUD as an adapter over server snapshots, not as a client-side source of result/ranking truth.
- Used an empty commit for Task 3 because verification changed no tracked files but the executor contract requires a per-task commit record.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test Harness] Mocked React Router navigation in the finish-navigation route test**
- **Found during:** Task 2
- **Issue:** React Router memory navigation in jsdom hit an AbortSignal realm mismatch when the test tried to follow `/results/:sessionId`, creating an unhandled rejection unrelated to route behavior.
- **Fix:** Kept the real router render for the session route, mocked `useNavigate`, and asserted the exact `/results/session-1` navigation call plus `sessionStorage` write.
- **Files modified:** `apps/web/src/pages/SprintCircuitPage.test.tsx`
- **Verification:** `pnpm --filter @blitz/web test -- SprintCircuitPage.test.tsx router.test.tsx`
- **Committed in:** `7dfe72e`

**Total deviations:** 1 auto-fixed (1 test harness bug).  
**Impact on plan:** The test still covers finish storage and navigation intent without changing production behavior or product scope.

## Known Stubs

None.

## Threat Flags

None. The planned controls-to-socket and server-snapshot-to-route trust boundaries were implemented within the plan threat model; no unplanned network endpoint, auth path, file access pattern, or schema boundary was added.

## Issues Encountered

- `rg` is not installed in this environment, so acceptance and stub scans used `grep`.
- `pnpm test` runs `pnpm run build` during pretest, so the explicit final `pnpm run build` was still run separately to satisfy the plan gate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 1 is complete for CTRL-01 through CTRL-04 and ARCH-01. Later race mode phases can reuse the fullscreen route pattern, shared control primitives, and typed socket input path while replacing the Sprint Circuit snapshot adapter with mode-specific HUD/track adapters.

## Self-Check: PASSED

- Confirmed summary and modified source files exist.
- Confirmed task commits `920bb65`, `7dfe72e`, and `80e0399` exist in git history.

---
*Phase: 01-fullscreen-game-shell-and-input-foundation*
*Completed: 2026-04-25*
