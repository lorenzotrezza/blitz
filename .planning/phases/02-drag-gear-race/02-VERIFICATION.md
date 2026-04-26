---
phase: 02-drag-gear-race
verified: 2026-04-26T10:45:06Z
status: human_needed
score: 26/26 must-haves verified
overrides_applied: 0
deferred:
  - truth: "ARCH-02 full race-rule coverage for collisions, checkpoints, and penalties"
    addressed_in: "Phases 3, 4, and 5"
    evidence: "Phase 3 covers obstacle collisions; Phase 4 covers checkpoint and penalty rules; Phase 5 covers figure-eight checkpoint crossing behavior."
human_verification:
  - test: "Phone viewport drag race playthrough"
    expected: "On a phone-sized viewport, the fullscreen drag route shows track, HUD, throttle, and shift controls without scrolling or app chrome."
    why_human: "Touch comfort, visual fit, and real viewport behavior cannot be fully verified from static code/tests."
  - test: "Live timing feel with one or two players"
    expected: "Holding throttle advances live RPM/speed/distance, and better shift timing visibly beats mediocre timing."
    why_human: "Real-time perception and multiplayer socket flow need hands-on browser validation."
  - test: "Post-race user flow"
    expected: "Finished drag sessions navigate to results and show finish time plus shift counts while host post-game actions still feel clear."
    why_human: "End-to-end navigation clarity and result readability are user-flow checks."
---

# Phase 2: Drag Gear Race Verification Report

**Phase Goal:** Ship a straight drag race where acceleration and shift timing decide the result.
**Verified:** 2026-04-26T10:45:06Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Player can accelerate and shift gears during a straight race. | VERIFIED | `DragGearRacePage` maps controls to `drag-throttle` and `drag-shift`; `dragSprint.ts` starts `trackId: 'straight-drag-gear'` and consumes only drag input. |
| 2 | Early/perfect/late shifts produce measurably different acceleration curves and finish times. | VERIFIED | `scoreShift` implements early/good/perfect/late windows; rule tests compare perfect/good vs mediocre finish ordering. |
| 3 | HUD shows RPM, gear, speed, distance, and last shift quality. | VERIFIED | `DragGearHud` renders `RPM`, `GEAR`, `KM/H`, `M`, and `LAST SHIFT` as DOM text. |
| 4 | Results include finish time and shift summary. | VERIFIED | Runtime summary includes `finishTimeMs`, `perfectShifts`, `goodShifts`, `earlyShifts`, `lateShifts`, `totalShifts`; `DragResultsSummary` renders them. |
| 5 | Runtime rule tests cover shift timing, acceleration, finish, and ranking. | VERIFIED | `dragGearRules.test.ts` covers shift windows, throttle acceleration, finish ordering, competent finish time, rankings, and summary counts. |
| 6 | Phase 2 checks Phase 1 shell/control prerequisites. | VERIFIED | Phase 1 shell/control files exist; shared `RaceGameInput` and `RaceShellSnapshot` are present in `packages/shared/src/game.ts`. |
| 7 | Shared drag input is intent-only. | VERIFIED | `DragGearInput` contains only throttle/shift discriminants, sequence, client time, and pressed state; contract tests assert no speed/RPM/distance/result fields. |
| 8 | Shared drag snapshots expose telemetry and shift summary types. | VERIFIED | `DragGearSnapshot`, `DragGearPlayerState`, `DragShiftWindow`, and `DragShiftSummary` exist in shared source. |
| 9 | Held throttle advances speed, RPM, and distance through server rules. | VERIFIED | `advanceDragGearPlayer` derives server-owned speed/RPM/distance; tests assert all increase with held throttle. |
| 10 | Shift timing is scored from authoritative server state. | VERIFIED | `applyDragGearInput` scores from `state.player.rpm`; runtime advances players before scoring drag shift. |
| 11 | Different shift quality runs produce different finish outcomes. | VERIFIED | `perfect and good shifts beat mediocre timing` test proves better timing wins. |
| 12 | Malformed or repeated shift input is ignored. | VERIFIED | `readDragGearInput` validates shape; `applyDragGearInput` rejects repeated sequence and invalid/non-racing shifts. |
| 13 | Existing `race:drag-sprint` runtime starts a straight gear race. | VERIFIED | Registry still resolves `race:drag-sprint` to `createDragSprintRuntime`; runtime snapshot track is `straight-drag-gear`. |
| 14 | Runtime accepts throttle hold/release and one-shot shift with no old lane/obstacle behavior. | VERIFIED | Runtime parses only `drag-throttle`/`drag-shift`; tests assert old steering input does not create lane or obstacles. |
| 15 | Finished payloads include rankings, finish time, and shift counts. | VERIFIED | `finishRace` emits `SessionFinishedPayload` with rankings and drag summary keys; tests assert payload shape. |
| 16 | Drag HUD renders required telemetry as DOM text. | VERIFIED | `DragGearHud.tsx` renders labels and values outside the canvas. |
| 17 | RPM meter shows the ideal shift window before shifting. | VERIFIED | `RpmShiftMeter` renders `drag-rpm-meter__window`, `drag-rpm-meter__perfect`, and `drag-rpm-meter__needle`. |
| 18 | Touch controls expose bottom-left throttle and bottom-right shift without steering. | VERIFIED | `DragActionControls` renders only `THROTTLE` and `SHIFT`; no analog/steering/brake controls. |
| 19 | Straight track shows progress and finish line without obstacles/checkpoints. | VERIFIED | `StraightDragTrack` draws distance markers, player progress, and finish line; no obstacle code. |
| 20 | Starting `race:drag-sprint` opens fullscreen drag route. | VERIFIED | `resolveSessionRoute` returns `/race/drag/:sessionId`; router registers the route outside app chrome. |
| 21 | Player can hold throttle and tap shift through `client:game-input` intent packets. | VERIFIED | `DragGearRacePage` submits drag intent through `useGameSessionSocket().submitInput`. |
| 22 | HUD and controls remain visible without app chrome. | VERIFIED | `DragGearRacePage.test.tsx` asserts no `.topbar`, `.viewport`, `.panel`, or `.card` chrome on drag route. |
| 23 | Throttle releases on cancel, blur, hidden visibility, unmount, finish, and disconnect. | VERIFIED | Page tests cover pointer cancel, blur, visibility change, finish, disconnect, and unmount release paths. |
| 24 | Results page visibly shows drag finish time and shift counts. | VERIFIED | `ResultsPage` conditionally renders `DragResultsSummary`; tests assert `Shift Summary`, `Finish Time`, qualities, and counts. |
| 25 | Results values come from server-finished payloads. | VERIFIED | `DragResultsSummary` receives `payload.results.summary`; no client gameplay state is used for outcome counts. |
| 26 | Focused and root verification gates pass. | VERIFIED | Focused shared/server/web tests, `pnpm test`, and `pnpm run build` passed during verification. |

**Score:** 26/26 truths verified

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | ARCH-02 full collision rule coverage | Phase 3 | Phase 3 success criteria require obstacle collisions to apply slowdown/penalty and affect final time. |
| 2 | ARCH-02 full checkpoint and penalty rule coverage | Phase 4 | Phase 4 success criteria require checkpoint order, lap completion, off-track/wrong-way feedback, and penalties. |
| 3 | ARCH-02 figure-eight checkpoint crossing coverage | Phase 5 | Phase 5 success criteria require figure-eight checkpoint/lap logic and crossing behavior tests. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/shared/src/game.ts` | Drag input/snapshot/result contracts | VERIFIED | Exports `DragGearInput`, `DragGearSnapshot`, `DragShiftWindow`, `DragShiftSummary`, and shift quality literals. |
| `packages/shared/src/contracts.ts` | `GameInputPayload` compatibility | VERIFIED | Imports `DragGearInput` and includes it in the input union. |
| `packages/shared/src/contracts.test.ts` | Shared contract tests | VERIFIED | Includes drag intent, snapshot telemetry, and shift summary tests. |
| `apps/server/src/games/race/dragGearRules.ts` | Pure rule helpers | VERIFIED | Implements scoring, acceleration, input guards, rankings, and summaries. |
| `apps/server/src/games/race/dragGearRules.test.ts` | Deterministic rule tests | VERIFIED | Covers shift windows, acceleration, malformed input, finish ordering, pacing, and summary counts. |
| `apps/server/src/games/race/dragSprint.ts` | Runtime adapter | VERIFIED | Uses pure helpers, server tick, finish payloads, and `straight-drag-gear` snapshots. |
| `apps/server/src/games/race/dragSprint.test.ts` | Runtime tests | VERIFIED | Covers registry start, throttle, server tick, shift scoring, ignored old input, and finish summary. |
| `apps/server/src/games/registry.ts` | Registry integration | VERIFIED | `race:drag-sprint` still points to `createDragSprintRuntime`. |
| `apps/web/src/components/game/DragGearHud.tsx` | Telemetry HUD | VERIFIED | Renders all required HUD values as text. |
| `apps/web/src/components/game/RpmShiftMeter.tsx` | Shift cue | VERIFIED | Renders visible window, perfect zone, and needle. |
| `apps/web/src/components/game/DragActionControls.tsx` | Throttle/shift controls | VERIFIED | Calls `setButtonState('primary', pressed)` and `controls.emitAction('shift')`. |
| `apps/web/src/components/game/StraightDragTrack.tsx` | Straight progress track | VERIFIED | Canvas is visual-only and labeled `Straight drag race track`. |
| `apps/web/src/pages/DragGearRacePage.tsx` | Fullscreen drag route | VERIFIED | Uses session socket, shell, HUD, track, controls, keyboard fallback, and lifecycle cleanup. |
| `apps/web/src/pages/DragGearRacePage.test.tsx` | Route/control tests | VERIFIED | Covers rendering, input packets, keyboard fallback, cleanup, results navigation, and route resolution. |
| `apps/web/src/app/router.tsx` | Fullscreen route registration | VERIFIED | Registers `/race/drag/:sessionId` outside `AppLayout`. |
| `apps/web/src/lib/sessionRoutes.ts` | Session start routing | VERIFIED | Routes `race`/`drag-sprint` to `/race/drag/:sessionId`. |
| `apps/web/src/components/game/DragResultsSummary.tsx` | Drag summary component | VERIFIED | Renders finish time and shift counts from summary payload. |
| `apps/web/src/pages/ResultsPage.tsx` | Results integration | VERIFIED | Conditionally renders drag summary and safely parses stored results. |
| `apps/web/src/pages/ResultsPage.test.tsx` | Results tests | VERIFIED | Covers drag summary, non-drag exclusion, host actions, and corrupt storage. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `contracts.ts` | `game.ts` | `DragGearInput` type import | VERIFIED | Automated key-link check passed. |
| `contracts.test.ts` | `index.ts` | Public package import | VERIFIED | Automated key-link check passed. |
| `dragGearRules.ts` | `game.ts` | Shared status/result imports | VERIFIED | Uses shared `RACE_STATUS`, `RaceStatus`, and `GameResultEntry`; local duplicated drag types noted as advisory IN-01. |
| `registry.ts` | `dragSprint.ts` | Runtime factory | VERIFIED | `createDragSprintRuntime` used for `race:drag-sprint`. |
| `dragSprint.ts` | `dragGearRules.ts` | Pure helper imports | VERIFIED | Imports `advanceDragGearPlayer`, `applyDragGearInput`, rankings, summaries, and input parser. |
| `DragGearHud.tsx` | drag snapshot shape | Props/imports | VERIFIED | Uses drag snapshot/player fields matching shared source shape; local duplication is informational. |
| `DragActionControls.tsx` | `useGameControls.ts` | Phase 1 hook API | VERIFIED | Manually verified `controls.emitAction('shift')`; automated check missed the exact string. |
| `sessionRoutes.ts` | `DragGearRacePage.tsx` | Drag route | VERIFIED | `drag-sprint` returns `/race/drag/${payload.sessionId}`. |
| `DragGearRacePage.tsx` | `useGameSessionSocket.ts` | `submitInput` | VERIFIED | Page submits `drag-throttle` and `drag-shift` intent. |
| `dragSprint.ts` | `ResultsPage.tsx` | `SessionFinishedPayload.results.summary` | VERIFIED | Server emits summary keys consumed by results UI. |
| `ResultsPage.tsx` | `DragResultsSummary.tsx` | Conditional render | VERIFIED | Rendered only for `payload.game === 'race' && payload.variant === 'drag-sprint'`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `DragGearRacePage.tsx` | `snapshot` | `useGameSessionSocket(sessionId)` receives server `GameSessionEnvelope` | Yes - server runtime emits `DragGearSnapshot` via session state | FLOWING |
| `DragGearHud.tsx` | `playersState`, selected player telemetry | Props from `DragGearRacePage` server snapshot | Yes - populated in `dragSprint.ts` from rule state | FLOWING |
| `StraightDragTrack.tsx` | `playersState` progress | Props from server snapshot | Yes - `distanceM` advances in `advanceDragGearPlayer` and runtime tick/input paths | FLOWING |
| `DragActionControls.tsx` | control events | `useGameControls` callbacks in route | Yes - route maps to `submitInput` intent packets | FLOWING |
| `dragSprint.ts` | `players`, results summary | Pure rule helpers and runtime timer/input lifecycle | Yes - no static results; rankings and summary built from player state | FLOWING |
| `ResultsPage.tsx` | `payload.results.summary` | Route state or `sessionStorage` finished payload | Yes - written from server-finished payload on drag route | FLOWING |
| `DragResultsSummary.tsx` | shift count fields | `payload.results.summary` | Yes - requires numeric server summary fields before rendering | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Shared drag contracts compile and tests pass | `pnpm --filter @blitz/shared test` | 18 shared contract tests passed | PASS |
| Server drag rules/runtime pass | `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts src/games/race/dragSprint.test.ts` | Server test script passed 10 files / 10 tests in focused run | PASS |
| Web drag route/results tests pass | `pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx ResultsPage.test.tsx` | 17 files / 55 tests passed | PASS |
| Root test gate passes | `pnpm test` | Lint/build/bootstrap plus shared/server/web/root tests passed | PASS |
| Root build gate passes | `pnpm run build` | Shared build, server TypeScript build, and web Vite build passed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DRAG-01 | 02-01 through 02-05 | Player can start a straight drag race and control acceleration. | SATISFIED | Registry/runtime start `race:drag-sprint`; route opens `/race/drag/:sessionId`; throttle emits intent and server advances acceleration. |
| DRAG-02 | 02-01 through 02-05 | Player can shift gears during the race. | SATISFIED | Shift control, keyboard fallback, runtime input parser, and rule tests cover `drag-shift` and gear changes. |
| DRAG-03 | 02-01, 02-02, 02-03 | Runtime scores shift timing and changes acceleration/result accordingly. | SATISFIED | `scoreShift`, shift multipliers, runtime elapsed scoring, and finish-order tests verify outcomes. |
| DRAG-04 | 02-01, 02-04, 02-05 | Player can see RPM, gear, speed, distance, and last shift quality during the race. | SATISFIED | `DragGearHud` and route tests render all labels and server snapshot values. |
| DRAG-05 | 02-01, 02-03, 02-06 | Results show finish time and shift performance summary. | SATISFIED | Runtime emits summary; `ResultsPage` renders `DragResultsSummary`; tests assert visible finish time and counts. |
| ARCH-02 | 02-01, 02-02, 02-03, 02-06 | Server race rules are covered by deterministic tests for timing, collisions, checkpoints, penalties, and results. | SATISFIED FOR PHASE 2; REMAINDER DEFERRED | Drag timing, acceleration, finish, ranking, and results are covered now. Collision/checkpoint/penalty coverage is explicitly scheduled in later race phases. |

No orphaned Phase 2 requirement IDs were found. Every ID declared by the user and PLAN frontmatter appears in `.planning/REQUIREMENTS.md` and is accounted for above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/web/src/components/game/DragGearHud.tsx` | 4 | Local drag snapshot/type duplication | Info | Matches review IN-01. Drift risk only; not blocking because tests/build pass and shapes match shared source. |
| `apps/server/src/games/race/dragSprint.ts` | 34 | Local runtime drag snapshot/type duplication | Info | Same advisory as IN-01; runtime behavior is tested through emitted payloads. |

Review warnings WR-01 and WR-02 are resolved in commit `02395c6`. Verification confirmed server race tick coverage and corrupt stored results coverage are present and passing.

### Human Verification Required

### 1. Phone Viewport Drag Race Playthrough

**Test:** Open a live `race:drag-sprint` session on a phone-sized viewport and play through the race.
**Expected:** Track, HUD, throttle, and shift controls fit fullscreen without scrolling or app chrome.
**Why human:** Touch comfort, physical thumb zones, and actual mobile viewport fit need manual validation.

### 2. Live Timing Feel With One Or Two Players

**Test:** Hold throttle, watch RPM rise, shift at different timings, and compare a good run against a mediocre run.
**Expected:** RPM/speed/distance update live, shift quality is readable, and better timing produces a better finish.
**Why human:** Real-time timing perception and multiplayer socket feel cannot be fully proven by static tests.

### 3. Post-Race User Flow

**Test:** Finish a drag session and inspect the results page and host post-game controls.
**Expected:** Results show finish time and shift counts, then host actions remain usable.
**Why human:** Navigation clarity and result readability are user-flow quality checks.

### Gaps Summary

No blocking gaps were found. All Phase 2 roadmap success criteria and plan must-haves are implemented, wired, and covered by passing focused and root checks. Overall status remains `human_needed` only because mobile visual fit, real-time feel, and end-to-end user flow require manual validation.

---

_Verified: 2026-04-26T10:45:06Z_
_Verifier: Claude (gsd-verifier)_
