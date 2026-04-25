---
phase: 01-fullscreen-game-shell-and-input-foundation
plan: 03
subsystem: web-game-shell
tags: [react, vitest, css, fullscreen-gameplay, hud, mobile-controls]
requires:
  - phase: 01-fullscreen-game-shell-and-input-foundation
    plan: 01
    provides: shared RaceShellSnapshot, RaceShellModeId, and HUD contracts
  - phase: 01-fullscreen-game-shell-and-input-foundation
    plan: 02
    provides: game-analog-pad and game-action-button class contracts for controls
provides:
  - Fullscreen mobile-first gameplay shell without normal app chrome classes
  - Stable game viewport container for canvas/track children
  - React-rendered race HUD with common gameplay fields and polite live status
  - Waiting and connection error states for race sessions
  - Safe-area, no-scroll, pointer-safe gameplay CSS for HUD, viewport, and controls
affects:
  - 01-fullscreen-game-shell-and-input-foundation
  - 02-drag-gear-race
  - 03-straight-obstacle-race
  - 04-circular-analog-track-race
  - 05-figure-eight-analog-track-race
tech-stack:
  added: []
  patterns:
    - Fullscreen gameplay components live under apps/web/src/components/game
    - Critical gameplay status is rendered as React text outside canvas content
key-files:
  created:
    - apps/web/src/components/game/FullscreenGameShell.tsx
    - apps/web/src/components/game/FullscreenGameShell.test.tsx
    - apps/web/src/components/game/GameViewport.tsx
    - apps/web/src/components/game/GameHud.tsx
    - apps/web/src/components/game/GameHud.test.tsx
    - apps/web/src/components/game/GameStates.tsx
    - .planning/phases/01-fullscreen-game-shell-and-input-foundation/01-03-SUMMARY.md
  modified:
    - apps/web/src/styles.css
key-decisions:
  - "Gameplay shell uses fixed viewport containment and safe-area padding so race screens are not normal scroll pages."
  - "HUD values are React-rendered text with a polite live region; canvas children remain visual only."
patterns-established:
  - "FullscreenGameShell owns only layout slots: HUD, viewport, controls, and optional state overlay."
  - "GameHud consumes RaceShellSnapshot and keeps common labels stable for later mode-specific race phases."
requirements-completed: [CTRL-01, CTRL-02, CTRL-03, ARCH-01]
duration: 4m 40s
completed: 2026-04-25
---

# Phase 01 Plan 03: Fullscreen Game Shell, Viewport, HUD, States, And Gameplay CSS Summary

**Fullscreen race session surface with inspectable HUD text, stable canvas viewport, waiting/error states, and phone-safe control CSS**

## Performance

- **Duration:** 4m 40s
- **Started:** 2026-04-25T19:41:03Z
- **Completed:** 2026-04-25T19:45:43Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added Wave 0 component tests covering fullscreen shell slots, absence of normal app chrome classes, waiting copy, HUD text, and `aria-live="polite"`.
- Added `FullscreenGameShell`, `GameViewport`, `GameHud`, and `GameStates` for reusable fullscreen race screens.
- Appended gameplay CSS for `100dvh` containment, safe-area padding, no scrolling, fixed thumb zones, pointer-safe analog/action controls, focus rings, and allowed gameplay typography sizes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Wave 0 shell and HUD tests** - `b679f1d` (test)
2. **Task 2: Implement fullscreen shell, HUD, states, viewport, and gameplay CSS** - `d88f993` (feat)

## Files Created/Modified

- `apps/web/src/components/game/FullscreenGameShell.test.tsx` - Tests shell slot rendering, no app chrome classes, and waiting empty state copy.
- `apps/web/src/components/game/GameHud.test.tsx` - Tests common HUD labels/values and polite live-region semantics.
- `apps/web/src/components/game/FullscreenGameShell.tsx` - Provides fixed fullscreen layout slots for HUD, viewport, controls, and optional state overlay.
- `apps/web/src/components/game/GameViewport.tsx` - Provides a stable labeled track/canvas container with nested stage.
- `apps/web/src/components/game/GameHud.tsx` - Renders `RaceShellSnapshot` objective, progress, speed, penalty, input, mode metric, session, countdown, and status as text.
- `apps/web/src/components/game/GameStates.tsx` - Provides exact waiting and connection-error copy from the UI contract.
- `apps/web/src/styles.css` - Adds fullscreen gameplay, HUD, viewport, state, analog pad, action button, portrait, safe-area, touch, and focus styles.

## Verification

- RED gate: `pnpm --filter @blitz/web test -- FullscreenGameShell.test.tsx GameHud.test.tsx` failed after Task 1 because `FullscreenGameShell`, `GameHud`, and `GameStates` did not exist yet.
- GREEN gate: `pnpm --filter @blitz/web test -- FullscreenGameShell.test.tsx GameHud.test.tsx` passed after Task 2 with 15 files and 37 tests passing.
- Typecheck: `pnpm --filter @blitz/web lint` passed after Task 2.
- Final verification: `pnpm --filter @blitz/web test -- FullscreenGameShell.test.tsx GameHud.test.tsx` passed after both task commits with 15 files and 37 tests passing.

## Decisions Made

- Kept the shell as a slot component instead of coupling it to socket/session logic; Plan 01-04 can integrate live route data without changing the component contract.
- Kept `GameViewport` drawing-free so canvas and track implementations remain owned by mode-specific pages.
- Used dedicated `game-*` class names and avoided `.panel`, `.card`, `.viewport`, `.topbar`, `.scanlines`, and `.shell-glow` in the shell implementation.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The new security-relevant surfaces are the planned server snapshot-to-React HUD and React route-to-canvas boundaries, and both are covered by the plan threat model. No new network endpoint, auth path, file access pattern, or schema boundary was introduced.

## Issues Encountered

- `rg` is not installed in this environment, so acceptance and stub checks used `grep`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 01-04 can compose `FullscreenGameShell`, `GameViewport`, `GameHud`, `GameEmptyState`, `GameErrorState`, `AnalogPad`, `ActionButton`, and `useGameControls` into the live race route and socket input path. Later race mode phases can fill the viewport with mode-specific canvas/track rendering while keeping common HUD text outside the canvas.

## Self-Check: PASSED

- Confirmed created source/test files and this summary exist.
- Confirmed task commits `b679f1d` and `d88f993` exist in git history.

---
*Phase: 01-fullscreen-game-shell-and-input-foundation*
*Completed: 2026-04-25*
