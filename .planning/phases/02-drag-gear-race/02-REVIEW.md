---
phase: 02-drag-gear-race
reviewed: 2026-04-26T10:34:57Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - packages/shared/src/game.ts
  - packages/shared/src/contracts.ts
  - packages/shared/src/contracts.test.ts
  - apps/server/src/games/race/dragGearRules.ts
  - apps/server/src/games/race/dragGearRules.test.ts
  - apps/server/src/games/race/dragSprint.ts
  - apps/server/src/games/race/dragSprint.test.ts
  - apps/server/src/games/registry.ts
  - apps/web/src/components/game/DragGearHud.tsx
  - apps/web/src/components/game/RpmShiftMeter.tsx
  - apps/web/src/components/game/ShiftQualityBadge.tsx
  - apps/web/src/components/game/StraightDragTrack.tsx
  - apps/web/src/components/game/DragActionControls.tsx
  - apps/web/src/styles.css
  - apps/web/src/pages/DragGearRacePage.tsx
  - apps/web/src/pages/DragGearRacePage.test.tsx
  - apps/web/src/app/router.tsx
  - apps/web/src/lib/sessionRoutes.ts
  - apps/web/src/components/game/DragResultsSummary.tsx
  - apps/web/src/pages/ResultsPage.tsx
  - apps/web/src/pages/ResultsPage.test.tsx
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-26T10:34:57Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Reviewed the shared drag contracts, deterministic rule helpers, server runtime adapter, fullscreen drag route/components, routing, and results rendering. The drag scoring helpers are well isolated, but the runtime currently has no server-side tick after race start, so held throttle does not produce live progress unless another input arrives. Results rendering also trusts `sessionStorage` JSON during render.

## Warnings

### WR-01: Held throttle does not advance or broadcast without later input

**File:** `apps/server/src/games/race/dragSprint.ts:319`
**Issue:** `start()` schedules only the countdown-to-race transition, and after `activateRace()` there is no recurring server tick. Physics advances only inside `applyInput()` via `advanceDragPlayersToNow()` at lines 348-349. The web control emits throttle only when the button state changes, so a player can press and hold throttle and then receive no updated RPM/speed/distance snapshots until they shift, release, or send another input. That makes the RPM meter stale exactly when timing is supposed to matter, and a race may not finish until a later packet arrives.
**Fix:** Add an authoritative runtime tick while racing, advance players from that timer, emit state snapshots, and finish when a player crosses the target. Clear the timer on finish/dispose.

```ts
let raceTimer: TimerHandle = null;

function clearRaceTimer() {
  if (raceTimer !== null) {
    cancel(raceTimer);
    raceTimer = null;
  }
}

function scheduleRaceTick() {
  if (raceTimer !== null || state.state.status !== RACE_STATUS.racing) {
    return;
  }

  raceTimer = schedule(() => {
    raceTimer = null;
    advanceDragPlayersToNow();
    const finishedState = maybeFinishAfterAdvance();
    if (!finishedState) {
      setState(RACE_STATUS.racing, null);
      emitState();
      scheduleRaceTick();
    }
  }, 50);
}
```

Call `scheduleRaceTick()` from `activateRace()`, and call `clearRaceTimer()` from `finishRace()` and `dispose()`.

### WR-02: Corrupt stored results can crash the results page

**File:** `apps/web/src/pages/ResultsPage.tsx:65`
**Issue:** `JSON.parse(storedPayload)` runs during render without error handling. Any corrupted, stale, or manually edited `blitz-results:${sessionId}` value in `sessionStorage` throws before the page can show the empty/results fallback.
**Fix:** Move storage parsing into a small safe reader that catches parse errors and returns `null`.

```ts
function readStoredResults(sessionId: string) {
  const raw = window.sessionStorage.getItem(`blitz-results:${sessionId}`);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionFinishedPayload | RaceFinishedPayload;
  } catch {
    return null;
  }
}
```

Then use `normalizePayload(locationPayload ?? readStoredResults(sessionId))`.

## Info

### IN-01: Drag gear snapshot/input types are duplicated instead of sharing the contract

**File:** `apps/web/src/components/game/DragGearHud.tsx:4`
**Issue:** The web component redefines `DragShiftSummary`, `DragGearPlayerState`, and `DragGearSnapshot` even though `packages/shared/src/game.ts` exports the same contract. The server runtime also keeps a local `DragGearSnapshot` shape. This is a drift risk at the client/server boundary.
**Fix:** Import the shared types where possible, and keep only component-local prop types in UI files.

```ts
import type { DragGearPlayerState, DragGearSnapshot } from '@blitz/shared';
```

---

_Reviewed: 2026-04-26T10:34:57Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
