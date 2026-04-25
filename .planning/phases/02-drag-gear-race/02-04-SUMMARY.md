---
phase: 02-drag-gear-race
plan: 04
subsystem: web-gameplay-ui
tags: [react, canvas, drag-race, mobile-controls, css]

requires:
  - phase: 02-drag-gear-race
    provides: Shared drag gear source contracts and authoritative drag-sprint runtime snapshots from Plans 01 and 03
provides:
  - Drag gear HUD with React-rendered RPM, gear, speed, distance, and last shift quality
  - Visible RPM meter with ideal shift window and current RPM needle
  - Straight drag track canvas with progress markers and finish line
  - Two-control throttle hold and discrete shift action surface
affects: [drag-gear-route, drag-gameplay-ui, mobile-controls]

tech-stack:
  added: []
  patterns: [server-derived React telemetry, guarded canvas drawing, two-button drag controls]

key-files:
  created:
    - apps/web/src/components/game/DragGearHud.tsx
    - apps/web/src/components/game/RpmShiftMeter.tsx
    - apps/web/src/components/game/ShiftQualityBadge.tsx
    - apps/web/src/components/game/StraightDragTrack.tsx
    - apps/web/src/components/game/DragActionControls.tsx
    - .planning/phases/02-drag-gear-race/02-04-SUMMARY.md
  modified:
    - apps/web/src/styles.css

key-decisions:
  - "Drag controls expose only hold throttle and one-shot shift; no analog, steering, brake, lane, or obstacle controls are rendered."
  - "Drag UI components mirror the shared source drag snapshot types locally until the workspace shared package declarations are rebuilt."

patterns-established:
  - "Drag HUD values are DOM text while the canvas remains a visual straight-track surface."
  - "Shift action is guarded against hold repeats and throttle state is delegated to the Phase 1 game control lifecycle."

requirements-completed: [DRAG-01, DRAG-02, DRAG-04]

duration: 10m
completed: 2026-04-25
---

# Phase 02 Plan 04: Drag HUD, RPM Meter, Straight Track, And Action Controls Summary

**Mobile-first drag gameplay components with DOM telemetry, a visible shift window, straight progress canvas, and two-thumb throttle/shift controls.**

## Performance

- **Duration:** 10m
- **Started:** 2026-04-25T21:51:30Z
- **Completed:** 2026-04-25T22:01:37Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `DragGearHud`, `RpmShiftMeter`, and `ShiftQualityBadge` so RPM, gear, speed, distance, and last shift quality are visible as React-rendered text.
- Added `StraightDragTrack` with a guarded canvas effect, distance markers, player progress, and finish line only.
- Added `DragActionControls` and drag CSS for bottom-left hold throttle and bottom-right discrete shift with stable mobile sizing and focus states.

## Task Commits

1. **Task 1: Create drag HUD and track display components** - `b64e676` (feat)
2. **Task 2: Create drag action controls and CSS** - `d7cfe2c` (feat)

**Plan metadata:** this summary docs commit

## Files Created/Modified

- `apps/web/src/components/game/DragGearHud.tsx` - Selects the current player from server snapshots and renders objective, RPM, gear, speed, distance, status, and last shift quality.
- `apps/web/src/components/game/RpmShiftMeter.tsx` - Renders the RPM label, numeric RPM, ideal shift window, perfect sub-window, and current needle.
- `apps/web/src/components/game/ShiftQualityBadge.tsx` - Provides stable text/class output for `--`, `EARLY`, `GOOD`, `PERFECT`, and `LATE`.
- `apps/web/src/components/game/StraightDragTrack.tsx` - Draws straight drag progress, distance markers, cars, and finish line with the existing jsdom canvas guard pattern.
- `apps/web/src/components/game/DragActionControls.tsx` - Exposes exactly throttle hold and shift action controls.
- `apps/web/src/styles.css` - Adds drag HUD, RPM meter, shift badge, track, and two-button control styles.

## Decisions Made

- Kept all critical race telemetry in DOM text; the canvas only visualizes progress.
- Used local UI interfaces matching `packages/shared/src/game.ts` because `@blitz/shared` package declarations were stale during web lint.
- Implemented shift as a one-shot action guarded by a press lock, while throttle uses `setButtonState('primary', pressed)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mirrored shared drag source types locally**
- **Found during:** Task 1
- **Issue:** `pnpm --filter @blitz/web lint` could not import `DragGearSnapshot`, `DragGearPlayerState`, `DragShiftWindow`, or `DragShiftQuality` from `@blitz/shared` because the package declarations were stale.
- **Fix:** Added matching exported UI interfaces/types in the owned component files and kept the prop contracts named `DragGearSnapshot`, `DragGearPlayerState`, `DragShiftWindow`, and `DragShiftQuality`.
- **Files modified:** `DragGearHud.tsx`, `RpmShiftMeter.tsx`, `ShiftQualityBadge.tsx`, `StraightDragTrack.tsx`
- **Verification:** `pnpm --filter @blitz/web lint` passed after the change.
- **Committed in:** `b64e676`

---

**Total deviations:** 1 auto-fixed (Rule 3: 1).
**Impact on plan:** No gameplay scope change. The UI contracts still match the shared source shape and can later switch back to package imports when shared declarations are rebuilt.

## Issues Encountered

- A pre-existing untracked Phase 05 planning file appeared briefly during execution and was left untouched. Final status was clean before summary creation.

## Verification

- `pnpm --filter @blitz/web lint` - PASS.
- Acceptance greps confirmed `Time the shift window`, `LAST SHIFT`, `drag-rpm-meter__window`, `PERFECT`, `aria-label="Straight drag race track"`, `THROTTLE`, `Hold Throttle`, and `controls.emitAction('shift')`.
- Negative greps confirmed `StraightDragTrack.tsx` does not contain `obstacle` and `DragActionControls.tsx` does not contain analog, steering, brake, lane, or obstacle controls.
- CSS greps confirmed `.drag-rpm-meter__window`, `min-height: 40px`, `min-width: 112px`, `min-width: 88px`, `touch-action: none`, `-webkit-user-select: none`, and `outline: 3px solid #ffd700`.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. Stub scan found only intentional null guards for snapshot/canvas availability.

## Threat Flags

None. The plan added no network endpoints, auth paths, file access patterns, schema changes, or new trust boundaries.

## Next Phase Readiness

Plan 05 can compose these components into the fullscreen drag route and map generic Phase 1 control events to the authoritative drag throttle/shift input contract.

## Self-Check: PASSED

- Verified all created component files and this summary file exist.
- Verified task commits `b64e676` and `d7cfe2c` exist in git history.
- Verified no `.planning/STATE.md` or `.planning/ROADMAP.md` modifications were made.

---
*Phase: 02-drag-gear-race*
*Completed: 2026-04-25*
