---
phase: 03-straight-obstacle-race
plan: 04
subsystem: web-gameplay-ui
tags: [react, vitest, mobile-controls, css, straight-obstacle-race, tdd]

requires:
  - phase: 01-fullscreen-game-shell-and-input-foundation
    provides: Fullscreen shell patterns, mobile control sizing, keyboard fallback expectations, and React HUD accessibility rules
  - phase: 03-straight-obstacle-race
    provides: StraightObstacleInput, StraightObstacleSnapshot, authoritative runtime snapshots, obstacle warnings, slowdown, and hit counts from Plans 01 through 03
provides:
  - React straight-obstacle road renderer with guide lanes, continuous player x-position, obstacles, warning, hit, and slowdown classes
  - React dodge HUD text for objective, distance, speed, warning, hit count, slowdown, and polite live updates
  - Continuous dodge steering pad and keyboard control hook emitting intent-only StraightObstacleInput packets
  - Mobile-first dodge road, HUD, and steering CSS
affects: [straight-obstacle-race, web-gameplay, mobile-controls, accessibility, session-routing]

tech-stack:
  added: []
  patterns: [React text HUD for authoritative snapshot state, pointer-capture steering pad, intent-only keyboard steering hook, mobile-first dodge CSS]

key-files:
  created:
    - apps/web/src/components/game/DodgeRoadView.tsx
    - apps/web/src/components/game/DodgeHud.tsx
    - apps/web/src/components/game/DodgeSteeringPad.tsx
    - apps/web/src/components/game/useDodgeRaceControls.ts
    - apps/web/src/components/game/DodgeRoadView.test.tsx
    - apps/web/src/components/game/DodgeHud.test.tsx
    - apps/web/src/components/game/DodgeSteeringPad.test.tsx
    - apps/web/src/components/game/useDodgeRaceControls.test.tsx
    - .planning/phases/03-straight-obstacle-race/03-04-SUMMARY.md
  modified:
    - apps/web/src/styles.css

key-decisions:
  - "Dodge frontend controls emit only normalized StraightObstacleInput steering intent: mode, kind, steerX, sequence, and client timestamp."
  - "Dodge obstacle warning, hits, speed, distance, and slowdown are rendered as React text so tests and assistive technology can inspect authoritative state."
  - "The dodge steering pad uses Pointer Events with pointer capture and resets to neutral on pointer, blur, visibility, disabled, and unmount lifecycles."

patterns-established:
  - "Use DodgeRoadView and DodgeHud as reusable snapshot consumers for the upcoming StraightObstacleRacePage integration."
  - "Use useDodgeRaceControls() for keyboard fallback and sequence emission rather than extending generic analog/game controls with mode-specific payloads."
  - "Keep dodge gameplay CSS under stable dodge-* classes with fixed mobile control dimensions and no panel/card chrome."

requirements-completed: [DODGE-01, DODGE-02, DODGE-03, DODGE-04]

duration: 7m 22s
completed: 2026-04-26
---

# Phase 03 Plan 04: Dodge Road, HUD, Steering Controls, Keyboard Fallback, And CSS Summary

**Reusable straight-obstacle React gameplay pieces with accessible HUD text and normalized steering input for touch and keyboard play.**

## Performance

- **Duration:** 7m 22s
- **Started:** 2026-04-26T11:28:26Z
- **Completed:** 2026-04-26T11:35:48Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added RED Vitest/Testing Library coverage for the dodge road, HUD, steering pad pointer lifecycle, and keyboard steering hook.
- Implemented `DodgeRoadView`, `DodgeHud`, `DodgeSteeringPad`, and `useDodgeRaceControls` against the shared straight-obstacle snapshot/input contracts.
- Added mobile-first `dodge-*` CSS for the road, obstacles, car, HUD chips, warning/hit/slowdown states, focus ring, and fixed-size steering pad.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add dodge component and control tests** - `1601c0d` (test)
2. **Task 2: Implement dodge road HUD steering controls and CSS** - `f8b35cf` (feat)

**Plan metadata:** this summary docs commit

_Note: Task 1/2 followed the TDD RED/GREEN flow. The RED run failed because `DodgeRoadView`, `DodgeHud`, `DodgeSteeringPad`, and `useDodgeRaceControls` did not exist yet._

## Files Created/Modified

- `apps/web/src/components/game/DodgeRoadView.tsx` - Renders straight obstacle road lanes, player car, active obstacles, and warning/hit/slowdown state classes from `StraightObstacleSnapshot`.
- `apps/web/src/components/game/DodgeHud.tsx` - Renders dodge objective, distance, speed, obstacle warning, hits, slowdown, and a polite live region as React text.
- `apps/web/src/components/game/DodgeSteeringPad.tsx` - Emits continuous horizontal `steerX` from pointer position and resets to neutral on pointer release/cancel/lost capture.
- `apps/web/src/components/game/useDodgeRaceControls.ts` - Maps ArrowLeft/A and ArrowRight/D into sequenced `StraightObstacleInput` packets and neutral reset lifecycle events.
- `apps/web/src/components/game/DodgeRoadView.test.tsx` - Covers road lanes, car/obstacle CSS variables, warning classes, and absence of drag/analog-only copy.
- `apps/web/src/components/game/DodgeHud.test.tsx` - Covers required HUD copy and `aria-live="polite"`.
- `apps/web/src/components/game/DodgeSteeringPad.test.tsx` - Covers pointer capture, continuous steering, and pointer reset lifecycle.
- `apps/web/src/components/game/useDodgeRaceControls.test.tsx` - Covers keyboard steering, sequence increments, straight-obstacle mode packets, and neutral reset lifecycle.
- `apps/web/src/styles.css` - Adds dodge road, HUD, steering pad, warning, hit, slowdown, focus, and portrait rules.
- `.planning/phases/03-straight-obstacle-race/03-04-SUMMARY.md` - Records plan execution results.

## Decisions Made

- Used DOM/CSS road rendering for this reusable component layer so road lanes, obstacles, player position, and state classes are directly testable before route integration.
- Kept `useDodgeRaceControls()` mode-specific instead of adapting `useGameControls()` because the server runtime expects the compact `StraightObstacleInput` shape, not generic analog/button packets.
- Rendered slowdown and warning status from snapshot/player fields only; the client never derives collision results or authoritative speed/hit state.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The web test script runs all web test files even when focused file names are passed after `--`; the focused command still passed and included the new dodge suites.
- `gsd-sdk query state.advance-plan`, `state.add-decision`, and `state.record-session` did not match the current `STATE.md` section labels, so the same single-plan updates were applied directly after the supported progress/metric handlers ran.

## Verification

- RED verification: `pnpm --filter @blitz/web test -- DodgeRoadView.test.tsx DodgeHud.test.tsx DodgeSteeringPad.test.tsx useDodgeRaceControls.test.tsx` - failed as expected on missing implementation imports.
- GREEN focused verification: `pnpm --filter @blitz/web test -- DodgeRoadView.test.tsx DodgeHud.test.tsx DodgeSteeringPad.test.tsx useDodgeRaceControls.test.tsx` - PASS, 21 web test files and 59 tests passed.
- Project build: `pnpm run build` - PASS.
- Project tests: `pnpm test` - PASS (`@blitz/shared` 20 tests, `@blitz/server` 57 tests, `@blitz/web` 59 tests, root Node tests 7 tests).

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None - the new input and snapshot rendering surfaces were covered by T-03-01, T-03-02, and T-03-04 in the plan threat model.

## Next Phase Readiness

Plan 03-05 can mount these components in the fullscreen straight-obstacle route, connect `useDodgeRaceControls()` to `client:game-input`, and feed authoritative session snapshots into `DodgeRoadView` and `DodgeHud`.

## Self-Check: PASSED

- Verified summary and all modified/created files exist.
- Verified task commits `1601c0d` and `f8b35cf` exist in git history.

---
*Phase: 03-straight-obstacle-race*
*Completed: 2026-04-26*
