---
phase: 01-fullscreen-game-shell-and-input-foundation
verified: 2026-04-25T20:22:52Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Mobile fullscreen race route check"
    expected: "`/race/live/:sessionId` fills the phone viewport, keeps HUD/track/controls visible without page scrolling, and does not show normal app chrome."
    why_human: "Actual browser viewport, safe-area behavior, and address-bar resizing cannot be fully proven by static code checks or jsdom tests."
  - test: "Touch control feel check on phone"
    expected: "STEER analog pad, GO, and BRAKE remain thumb-friendly, do not trigger browser panning/zooming, and reset cleanly after touch cancel/app switch."
    why_human: "Pointer capture, touch-action behavior, and thumb comfort need a real mobile browser/manual interaction pass."
---

# Phase 1: Fullscreen Game Shell And Input Foundation Verification Report

**Phase Goal:** Create the reusable fullscreen mobile game surface, controls, and shared contracts that every rebuilt race mode will use.
**Verified:** 2026-04-25T20:22:52Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A session route can render a fullscreen game layout with canvas/track area, HUD, and fixed bottom controls without normal app chrome. | VERIFIED | `router.tsx` places `/race/live/:sessionId` outside `AppLayout`; `SprintCircuitPage.tsx` composes `FullscreenGameShell`, `GameViewport`, `GameHud`, `AnalogPad`, and `ActionButton`; route tests assert no `.topbar`, `.viewport`, `.panel`, or `.card`. |
| 2 | Touch controls use pointer/touch-safe behavior and stay usable with thumbs. | VERIFIED | `AnalogPad.tsx` and `ActionButton.tsx` use Pointer Events, pointer capture, cancellation reset, and inline `touchAction: 'none'`; `styles.css` fixes bottom left/right control zones and sets 144px/72px minimum controls. Real phone feel still needs human verification. |
| 3 | Desktop fallback inputs exist for the same gameplay commands. | VERIFIED | `useGameControls.ts` maps WASD/Arrow to analog, Space/Enter to primary, Shift/Control to secondary; tests cover emitted typed inputs. |
| 4 | Shared contracts include discriminated input/snapshot shapes for rebuilt race modes. | VERIFIED | `packages/shared/src/game.ts` exports `RaceGameInput`, analog/button/action variants, `RaceShellSnapshot`, constants, clamp helper, and guard; `contracts.ts` keeps `GameInputPayload = RaceGameInput \| PlayerInput \| Record<string, unknown>`. |
| 5 | Tests cover shell rendering, control presence, and contract exports. | VERIFIED | Shared, shell/HUD, control, router, socket, and route tests exist and pass under current `pnpm test`. |
| 6 | Route renders canvas/track area, HUD text, analog pad, primary action, and secondary action. | VERIFIED | `SprintCircuitPage.tsx` renders canvas in `GameViewport`, React HUD, STEER analog pad, GO and BRAKE buttons; `SprintCircuitPage.test.tsx` asserts all are present. |
| 7 | HUD feedback includes objective, progress, speed, penalty/status, current input, and mode metric. | VERIFIED | `GameHud.tsx` renders all common fields and an `aria-live="polite"` status; `SprintCircuitPage.tsx` adapts server `RaceSnapshot` into checkpoint/speed/progress/input HUD labels. |
| 8 | Client controls emit shared typed intent only; snapshots/results remain authoritative. | VERIFIED | `useGameControls.ts` emits `RaceGameInput`; `useLiveRaceSocket.ts` emits it via `client:game-input`; `SprintCircuitPage.tsx` derives display/result navigation from server snapshot/finished payloads. |
| 9 | Existing Sprint Circuit finish navigation and session filtering keep working. | VERIFIED | `SprintCircuitPage.tsx` writes `blitz-results:{sessionId}` and navigates to `/results/:sessionId`; `useLiveRaceSocket.ts` filters by session id, game `race`, and sprint-circuit variant; tests cover both. |
| 10 | Input state resets to neutral on cancellation, blur, visibility loss, finish, and unmount. | VERIFIED | Control hook and components reset on pointer cancel/lost capture/up, `window.blur`, hidden visibility, effect cleanup, and finish handling; tests cover cancellation lifecycle. |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/shared/src/game.ts` | Race input/snapshot contracts and guards | VERIFIED | Exists, substantive, exported through shared package, covered by tests. |
| `packages/shared/src/contracts.ts` | Compatible generic session input transport | VERIFIED | Imports `RaceGameInput`; keeps legacy `PlayerInput` and generic record compatibility. |
| `apps/web/src/components/game/useGameControls.ts` | Keyboard/input lifecycle and typed emission | VERIFIED | Emits analog/button/action intents with sequence/timestamp and reset lifecycle. |
| `apps/web/src/components/game/AnalogPad.tsx` | Pointer-capture analog primitive | VERIFIED | Calculates normalized vectors, clamps values, and resets on pointer termination. |
| `apps/web/src/components/game/ActionButton.tsx` | Pointer/keyboard action primitive | VERIFIED | Supports press/release via pointer and keyboard, disabled suppression, and stop-propagation for keyboard activation. |
| `apps/web/src/components/game/FullscreenGameShell.tsx` | Fullscreen shell layout | VERIFIED | Slot-based shell with `game-shell` root and no normal app chrome classes. |
| `apps/web/src/components/game/GameViewport.tsx` | Stable track/canvas slot | VERIFIED | Labeled `role="img"` viewport with canvas-capable stage. |
| `apps/web/src/components/game/GameHud.tsx` | Inspectable HUD and live region | VERIFIED | Renders common HUD values as React text and polite live status. |
| `apps/web/src/components/game/GameStates.tsx` | Waiting/error states | VERIFIED | Contains required waiting and connection-lost copy. |
| `apps/web/src/pages/SprintCircuitPage.tsx` | Integrated fullscreen race route consumer | VERIFIED | Wires shell, socket snapshot adapter, controls, canvas, roster, and finish navigation. |
| `apps/web/src/lib/useLiveRaceSocket.ts` | Race socket adapter | VERIFIED | Filters live race events and exposes `submitInput(input: RaceGameInput)`. |
| `apps/web/src/app/router.tsx` | Fullscreen route branch | VERIFIED | Live race route is top-level outside `AppLayout`. |
| `apps/web/src/styles.css` | Fullscreen gameplay/control CSS | VERIFIED | Contains fixed `100dvh` shell, safe-area padding, overflow hidden, fixed controls, touch-action none, and focus rings. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `contracts.ts` | `game.ts` | `RaceGameInput` type import | WIRED | `gsd-sdk query verify.key-links` passed for Plan 01. |
| `contracts.test.ts` | `index.ts` | Public barrel import | WIRED | Contract tests import public exports. |
| `useGameControls.ts` | `@blitz/shared` | `RaceGameInput`, `clampRaceAnalogVector` imports | WIRED | Control hook emits shared contract shapes. |
| `AnalogPad.tsx` | `useGameControls.ts` | `createNeutralAnalogVector` and vector callback | WIRED | Analog pad uses shared vector shape and neutral reset helper. |
| `GameHud.tsx` | `@blitz/shared` | `RaceShellSnapshot` type | WIRED | HUD consumes shell snapshot contract. |
| `styles.css` | `FullscreenGameShell.tsx` | `game-shell` classes | WIRED | CSS selectors match shell/control class names. |
| `SprintCircuitPage.tsx` | `FullscreenGameShell.tsx` | Component composition | WIRED | Page renders the shell directly. |
| `SprintCircuitPage.tsx` | `useLiveRaceSocket.ts` | Snapshot and `submitInput` hook | WIRED | Page consumes server snapshot/finished state and emits controls through hook. |
| `router.tsx` | `SprintCircuitPage.tsx` | `/race/live/:sessionId` route | WIRED | Route is outside app chrome. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `SprintCircuitPage.tsx` | `snapshot`, `finished` | `useLiveRaceSocket(sessionId)` | Yes | FLOWING - hook listens to `server:session-state` and `server:session-finished`, filters by session/game/variant, and updates React state. |
| `SprintCircuitPage.tsx` | `shellSnapshot` | Adapter over authoritative `RaceSnapshot` plus route countdown | Yes | FLOWING - HUD labels derive from server `playersState`, status, countdown, and track fields; no hardcoded empty props at call site. |
| `useLiveRaceSocket.ts` | `submitInput` | Shared Socket.IO client | Yes | FLOWING - emits `SOCKET_EVENTS.client.gameInput` with caller-provided `RaceGameInput`. |
| `useGameControls.ts` | `RaceGameInput` | Browser pointer/keyboard events | Yes | FLOWING - inputs are stamped with mode, sequence, timestamp, and discriminants before emission. |
| `GameHud.tsx` | HUD fields | `RaceShellSnapshot` prop | Yes | FLOWING - renders passed snapshot values, falling back only when no snapshot exists. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Shared race contracts compile and tests pass | `pnpm --filter @blitz/shared test` | `contracts.test.ts` passed | PASS |
| Route/control/socket focused web tests pass | `pnpm --filter @blitz/web test -- SprintCircuitPage.test.tsx ActionButton.test.tsx useLiveRaceSocket.test.ts` | 16 test files, 43 tests passed | PASS |
| Root verification gate passes | `pnpm test` | pretest lint/build/bootstrap, shared/server/web/root tests passed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| CTRL-01 | 01-03, 01-04 | Fullscreen mobile-first game screen with track, HUD, controls visible without scrolling | SATISFIED | Fixed `game-shell`, top-level live race route outside `AppLayout`, shell/route tests, no app chrome classes. Human phone check still required. |
| CTRL-02 | 01-02, 01-03, 01-04 | Touch controls in fixed thumb zones that do not trigger scrolling | SATISFIED | Pointer events, pointer capture, cancellation reset, `touch-action: none`, fixed bottom left/right zones. Human phone check still required. |
| CTRL-03 | 01-03, 01-04 | Mode-specific HUD feedback for objective, progress, speed, penalty, input state | SATISFIED | `GameHud` renders objective/progress/speed/penalty/input/mode metric and `SprintCircuitPage` supplies checkpoint and input labels. |
| CTRL-04 | 01-02, 01-04 | Keyboard/desktop fallback for every gameplay input | SATISFIED | `useGameControls` maps keyboard to analog, primary, and secondary controls; tests verify emitted input. |
| ARCH-01 | 01-01, 01-02, 01-03, 01-04 | Shared contracts define explicit input and snapshot shapes for each rebuilt race mode | SATISFIED | `RaceGameInput`, `RaceShellSnapshot`, mode/status/button constants, guard/helper, and `GameInputPayload` compatibility exist and are tested. |

No orphaned Phase 1 requirements found in `.planning/REQUIREMENTS.md`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `apps/web/src/pages/SprintCircuitPage.tsx` | 61 | `return null` | Info | Legitimate no-snapshot/no-countdown branch feeding the waiting overlay, not a placeholder implementation. |

### Human Verification Required

### 1. Mobile Fullscreen Race Route Check

**Test:** On a real phone browser, open or route into `/race/live/:sessionId` during a race session.
**Expected:** The route fills the phone viewport, HUD/track/controls are visible without page scrolling, safe-area padding is respected, and normal Home/Hub chrome is absent.
**Why human:** Static CSS and jsdom route tests cannot prove real mobile browser viewport/address-bar/safe-area behavior.

### 2. Touch Control Feel Check On Phone

**Test:** During a live race on a phone, drag STEER and press/release GO and BRAKE, including an app switch or interrupted touch.
**Expected:** Controls remain thumb-friendly, do not trigger browser panning/zooming, emit/respond continuously, and return to neutral after cancellation or app switch.
**Why human:** Pointer capture, `touch-action`, and control ergonomics need real device interaction.

### Gaps Summary

No automated verification gaps were found. The phase goal is implemented in code and current automated gates pass. Status is `human_needed` only because mobile fullscreen behavior and touch feel require manual browser/device validation before the phase should be considered fully accepted.

---

_Verified: 2026-04-25T20:22:52Z_
_Verifier: Claude (gsd-verifier)_
