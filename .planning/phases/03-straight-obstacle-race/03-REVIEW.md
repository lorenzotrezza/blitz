---
phase: 03-straight-obstacle-race
reviewed: 2026-04-26T12:03:30Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - apps/server/src/games/race/straightObstacle.ts
  - apps/server/src/games/race/straightObstacle.test.ts
  - apps/server/src/games/race/straightObstacleRules.ts
  - apps/server/src/games/race/straightObstacleRules.test.ts
  - apps/server/src/games/registry.ts
  - apps/server/src/games/registry.test.ts
  - apps/web/src/components/game/DodgeHud.tsx
  - apps/web/src/components/game/DodgeHud.test.tsx
  - apps/web/src/components/game/DodgeResultsSummary.tsx
  - apps/web/src/components/game/DodgeRoadView.tsx
  - apps/web/src/components/game/DodgeRoadView.test.tsx
  - apps/web/src/components/game/DodgeSteeringPad.tsx
  - apps/web/src/components/game/DodgeSteeringPad.test.tsx
  - apps/web/src/components/game/useDodgeRaceControls.ts
  - apps/web/src/components/game/useDodgeRaceControls.test.tsx
  - apps/web/src/pages/StraightObstacleRacePage.tsx
  - apps/web/src/pages/StraightObstacleRacePage.test.tsx
  - apps/web/src/pages/ResultsPage.tsx
  - apps/web/src/pages/ResultsPage.test.tsx
  - apps/web/src/app/router.tsx
  - apps/web/src/lib/sessionRoutes.ts
  - apps/web/src/styles.css
  - packages/shared/src/contracts.ts
  - packages/shared/src/contracts.test.ts
  - packages/shared/src/game.ts
  - packages/shared/src/lobby.ts
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-04-26T12:03:30Z
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

Reviewed the straight-obstacle server runtime/rules, shared contracts, registry integration, route wiring, HUD/road/controls components, results display, CSS, and related tests. The implementation is generally scoped well and keeps the new race server-authoritative, but two behavioral issues should be fixed before considering the phase clean: finish times are stored as absolute server timestamps, and the road preview renders every obstacle in the race even after the player has passed them.

## Warnings

### WR-01: Straight-obstacle finish times use wall-clock timestamps

**File:** `apps/server/src/games/race/straightObstacleRules.ts:224`
**Issue:** `finishedAtMs` is assigned from `frame.nowMs`, and the runtime passes `Date.now()` as that value from `apps/server/src/games/race/straightObstacle.ts:219`. `buildStraightObstacleResults()` then formats `finishedAtMs / 1000` as seconds at `apps/server/src/games/race/straightObstacleRules.ts:283-286`. In production this will produce epoch-sized results such as `1777202004.0s` instead of elapsed race times, because tests seed `nowMs` with small synthetic values rather than a realistic wall clock.
**Fix:** Store elapsed race time, not absolute server time. One concrete approach is to pass elapsed time into the rule frame and use that for finish results while keeping wall-clock time for slowdown timers:

```ts
const elapsedMs = startedAtMs === null ? 0 : currentTimeMs - startedAtMs;
ruleState = advanceStraightObstacleRace(ruleState, latestIntentByPlayerId, {
  nowMs: currentTimeMs,
  elapsedMs,
  deltaMs,
});
```

Then set `finishedAtMs` from `frame.elapsedMs` when a player reaches `distanceTarget`, and add a runtime test that starts at a large `nowMs` and expects an elapsed label such as `0.8s`.

### WR-02: Passed obstacles stay rendered in the active road preview

**File:** `apps/server/src/games/race/straightObstacle.ts:138`
**Issue:** The snapshot's `activeObstacles` field includes every generated obstacle for the whole race. The road component then maps all of them at `apps/web/src/components/game/DodgeRoadView.tsx:305`, and `obstacleProgress()` clamps obstacles behind the player to `1` at `apps/web/src/components/game/DodgeRoadView.tsx:272-276`. Since CSS places progress `1` near the player car (`apps/web/src/styles.css:1210-1217`), already-passed obstacles will pile up at the bottom of the road and can obscure the readable upcoming hazards.
**Fix:** Send or render only obstacles within the visual preview window. For example, filter in `createSnapshot()` against the nearest active player distance:

```ts
const previewBackfill = 24;
const previewDistance = 180;
const playerDistances = ruleState.players.map((player) => player.distance);
const minDistance = Math.min(...playerDistances);
const maxDistance = Math.max(...playerDistances);

activeObstacles: ruleState.obstacles
  .filter((obstacle) =>
    obstacle.distance >= minDistance - previewBackfill &&
    obstacle.distance <= maxDistance + previewDistance
  )
  .map((obstacle) => ({
    ...obstacle,
    hitPlayerIds: [...obstacle.hitPlayerIds],
  })),
```

Alternatively, keep the full obstacle list server-side and filter in `DodgeRoadView` before mapping so only upcoming/near obstacles are drawn.

---

_Reviewed: 2026-04-26T12:03:30Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
