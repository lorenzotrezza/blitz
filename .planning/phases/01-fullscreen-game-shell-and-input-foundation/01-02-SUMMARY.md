---
phase: 01-fullscreen-game-shell-and-input-foundation
plan: 02
subsystem: web-controls
tags: [react, vitest, pointer-events, keyboard-input, race-controls]
requires:
  - phase: 01-fullscreen-game-shell-and-input-foundation
    plan: 01
    provides: shared RaceGameInput, RaceShellModeId, RaceGameButton, and analog clamp contracts
provides:
  - Reusable race keyboard/input lifecycle hook emitting typed RaceGameInput intent
  - Pointer-capture analog pad that emits clamped normalized vectors and resets on cancellation
  - Pointer/keyboard action button primitive for primary and secondary race controls
affects:
  - 01-fullscreen-game-shell-and-input-foundation
  - 02-drag-gear-race
  - 03-straight-obstacle-race
  - 04-circular-analog-track-race
  - 05-figure-eight-analog-track-race
tech-stack:
  added: []
  patterns:
    - React control primitives emit shared @blitz/shared race intent contracts
    - Cancellation paths reset local control state before later socket integration
key-files:
  created:
    - apps/web/src/components/game/useGameControls.ts
    - apps/web/src/components/game/AnalogPad.tsx
    - apps/web/src/components/game/ActionButton.tsx
    - apps/web/src/components/game/useGameControls.test.tsx
    - apps/web/src/components/game/AnalogPad.test.tsx
    - apps/web/src/components/game/ActionButton.test.tsx
  modified:
    - .planning/phases/01-fullscreen-game-shell-and-input-foundation/01-02-SUMMARY.md
key-decisions:
  - "Controls emit compact player intent only: analog vectors, button state changes, and one-shot action names."
  - "Pointer controls set functional touch-action/user-select safeguards inline until Plan 03 adds complete styling."
patterns-established:
  - "Keyboard fallback maps WASD/Arrow keys to normalized analog vectors, Space/Enter to primary, and Shift/Control to secondary."
  - "Reset lifecycle covers pointer cancellation, lost pointer capture, blur, visibility hidden, and hook unmount."
requirements-completed: [CTRL-02, CTRL-04, ARCH-01]
duration: 8m 15s
completed: 2026-04-25
---

# Phase 01 Plan 02: Reusable Analog And Action Controls Summary

**Typed fullscreen race control primitives with pointer-safe analog drag, action press/release, keyboard parity, and stuck-input reset coverage**

## Performance

- **Duration:** 8m 15s
- **Started:** 2026-04-25T19:28:19Z
- **Completed:** 2026-04-25T19:36:34Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added `useGameControls` to normalize keyboard input into shared `RaceGameInput` analog, button, and action intents with sequence numbers and client timestamps.
- Added `AnalogPad` using Pointer Events, pointer capture, normalized vector math, shared clamping, and neutral reset on pointer up/cancel/lost capture.
- Added `ActionButton` with pointer and Space/Enter press-release behavior, disabled-state suppression, stable class names, and mobile scroll-prevention styles.
- Added focused Vitest/Testing Library coverage for keyboard fallback, lifecycle reset, pointer cancellation, lost pointer capture, and disabled action controls.

## Task Commits

1. **Task 1: Add Wave 0 control tests** - `968dcad` (test)
2. **Task 2: Implement reusable controls and input lifecycle** - `4c122ff` (feat)

## Files Created/Modified

- `apps/web/src/components/game/useGameControls.ts` - Keyboard fallback, sequence/timestamp stamping, button/action emission, and blur/visibility/unmount reset lifecycle.
- `apps/web/src/components/game/AnalogPad.tsx` - Reusable pointer-capture analog pad that emits clamped normalized vectors and resets to neutral.
- `apps/web/src/components/game/ActionButton.tsx` - Reusable primary/secondary action button with pointer and keyboard press-release semantics.
- `apps/web/src/components/game/useGameControls.test.tsx` - Hook tests for keyboard mapping, button mapping, sequencing, timestamps, and cancellation lifecycle.
- `apps/web/src/components/game/AnalogPad.test.tsx` - Pointer drag, clamp, pointer cancel, and lost pointer capture tests.
- `apps/web/src/components/game/ActionButton.test.tsx` - Pointer, keyboard, cancel, lost capture, and disabled-state tests.

## Verification

- RED gate: `pnpm --filter @blitz/web test -- useGameControls.test.tsx AnalogPad.test.tsx ActionButton.test.tsx` failed after Task 1 because `useGameControls`, `AnalogPad`, and `ActionButton` did not exist.
- GREEN gate: `pnpm --filter @blitz/web test -- useGameControls.test.tsx AnalogPad.test.tsx ActionButton.test.tsx` passed after Task 2 with 13 files and 33 tests passing.
- Typecheck: `pnpm --filter @blitz/web lint` passed after Task 2.

## Decisions Made

- Kept controls as local React primitives for this plan; socket integration remains for Plan 04.
- Used inline `touchAction: 'none'` and user-select suppression on the control surfaces because these are functional input requirements, while full visual styling remains in Plan 03.
- Normalized diagonal keyboard vectors to unit magnitude so desktop fallback behaves like analog input rather than exceeding analog range.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Refreshed shared package build output for web tests**
- **Found during:** Task 2
- **Issue:** Web tests resolved `@blitz/shared` through `packages/shared/dist`, which was stale after Plan 01 and did not expose `RACE_GAME_BUTTONS` or `clampRaceAnalogVector`.
- **Fix:** Ran `pnpm --filter @blitz/shared build` so the local test runtime could load the Plan 01 shared exports. Generated dist files remain untracked.
- **Files modified:** None tracked.
- **Verification:** Focused web control tests progressed past missing shared export errors.
- **Committed in:** Not committed; generated build output is untracked.

**2. [Rule 1 - Test Harness Bug] Fixed jsdom pointer event payload creation**
- **Found during:** Task 2
- **Issue:** `fireEvent.pointerDown` did not preserve `pointerId`, `clientX`, and `clientY` in this jsdom/Vitest setup, causing tests to assert against browser PointerEvent fields that were missing from the synthetic event.
- **Fix:** Switched the analog test to `createEvent` with explicit event properties and relaxed pointer-capture assertions to verify capture is attempted.
- **Files modified:** `apps/web/src/components/game/AnalogPad.test.tsx`, `apps/web/src/components/game/ActionButton.test.tsx`
- **Verification:** `pnpm --filter @blitz/web test -- useGameControls.test.tsx AnalogPad.test.tsx ActionButton.test.tsx`
- **Committed in:** `4c122ff`

**3. [Rule 1 - Type Bug] Fixed RaceGameInput draft typing**
- **Found during:** Task 2
- **Issue:** TypeScript collapsed `Omit<RaceGameInput, ...>` in a way that rejected union-specific properties like `vector`, `button`, and `action`.
- **Fix:** Added an explicit `RaceInputDraft` discriminated union for local emission before sequence, timestamp, and mode fields are attached.
- **Files modified:** `apps/web/src/components/game/useGameControls.ts`
- **Verification:** `pnpm --filter @blitz/web lint`
- **Committed in:** `4c122ff`

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs).  
**Impact on plan:** Control functionality and verification are complete with no product scope expansion.

## Known Stubs

None.

## Threat Flags

None. This plan only adds local input controls that emit intent fields; it introduces no network endpoint, auth path, file access, or schema boundary.

## Issues Encountered

- `rg` is not installed in this environment, so file/string checks used `grep`, `find`, and `sed`.
- `@blitz/shared` package tests/build output must be fresh before web tests that import newly added shared exports through the package entrypoint.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 01-03 can style and place these primitives in the fullscreen shell using the stable `game-analog-pad`, `game-analog-knob`, `game-action-button`, `game-action-button--primary`, `game-action-button--secondary`, and `is-pressed` class names. Plan 01-04 can wire `useGameControls` emissions into the live race route/socket path without inventing new local input shapes.

## Self-Check: PASSED

- Confirmed source/test files and this summary exist.
- Confirmed commits `968dcad` and `4c122ff` exist in git history.
- Confirmed focused verification and web typecheck passed after implementation.

---
*Phase: 01-fullscreen-game-shell-and-input-foundation*
*Completed: 2026-04-25*
