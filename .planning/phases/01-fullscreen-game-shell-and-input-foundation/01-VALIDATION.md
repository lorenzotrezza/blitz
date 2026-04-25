---
phase: 1
slug: fullscreen-game-shell-and-input-foundation
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-25
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Web: Vitest with jsdom; Shared: Node test runner with `tsx`; Server: Node test runner with `tsx` |
| **Config file** | `apps/web/vite.config.ts`; shared/server use package scripts |
| **Quick run command** | `pnpm --filter @blitz/web test -- FullscreenGameShell.test.tsx` and `pnpm --filter @blitz/shared test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~120 seconds for full suite; focused package tests should be faster |

---

## Sampling Rate

- **After every task commit:** Run the focused package test for the touched package.
- **After every plan wave:** Run `pnpm --filter @blitz/web test` and `pnpm --filter @blitz/shared test`.
- **Before `$gsd-verify-work`:** `pnpm run build` and `pnpm test` must pass.
- **Max feedback latency:** 3 task commits without an automated test run is not allowed.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | ARCH-01 | T1-01 | Browser input remains typed intent; server remains authoritative | shared type/unit | `pnpm --filter @blitz/shared test` | exists: `packages/shared/src/contracts.test.ts` | pending |
| 1-02-01 | 02 | 1 | CTRL-02, CTRL-04 | T1-02 | Input resets on cancel, blur, visibility change, and unmount | web component/hook | `pnpm --filter @blitz/web test -- useGameControls.test.tsx AnalogPad.test.tsx ActionButton.test.tsx` | missing: Wave 0 | pending |
| 1-03-01 | 03 | 2 | CTRL-01, CTRL-03 | T1-03 | Gameplay route renders inspectable HUD text and avoids normal page chrome | web component/route | `pnpm --filter @blitz/web test -- FullscreenGameShell.test.tsx GameHud.test.tsx SprintCircuitPage.test.tsx` | missing: Wave 0 | pending |
| 1-04-01 | 04 | 2 | CTRL-01, CTRL-02, CTRL-03, CTRL-04, ARCH-01 | T1-04 | Integrated shell emits typed compact intents and filters server snapshots by session | web integration | `pnpm --filter @blitz/web test` | partial: existing route tests | pending |

---

## Wave 0 Requirements

- [ ] `apps/web/src/components/game/FullscreenGameShell.test.tsx` - covers CTRL-01 fullscreen shell, game viewport, HUD/control presence, and absence of normal card/panel chrome.
- [ ] `apps/web/src/components/game/AnalogPad.test.tsx` - covers CTRL-02 analog vector output, `touch-action: none`, pointer cancel/up reset, and stable DOM attributes.
- [ ] `apps/web/src/components/game/ActionButton.test.tsx` - covers CTRL-02 and CTRL-04 press/release, keyboard activation, disabled state, and focus-visible contract hooks.
- [ ] `apps/web/src/components/game/GameHud.test.tsx` - covers CTRL-03 objective, progress/speed, penalty/status, current input state, mode metric, and `aria-live="polite"`.
- [ ] `apps/web/src/components/game/useGameControls.test.tsx` - covers CTRL-02 and CTRL-04 keyboard mappings, blur reset, visibility reset, unmount reset, and neutral input state.
- [ ] Extend `packages/shared/src/contracts.test.ts` - covers ARCH-01 exported discriminated input and shell snapshot sample shapes.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Phone fullscreen comfort | CTRL-01, CTRL-02 | jsdom cannot prove real viewport fit, safe-area behavior, or thumb reach | Run the web app on a phone-sized browser viewport in landscape and portrait. Confirm no page scroll during active gameplay, track/HUD/controls are visible, analog control sits bottom-left, action controls sit bottom-right, and OS gesture edges are not required for input. |
| Mobile control feel | CTRL-02 | Pointer event unit tests do not prove thumb comfort or accidental gesture behavior | Drag the analog pad continuously, press/release both actions, background/foreground the tab, and confirm controls reset to neutral with no stuck acceleration/brake state. |

---

## Security Notes

- **T1-01 malformed input:** Shared types are not runtime validation. Later server runtimes still need discriminant checks and numeric clamping before trusting `client:game-input`.
- **T1-02 stuck input:** Reset input on pointer cancel, lost pointer capture, window blur, visibility change, route unmount, and socket/session disconnect.
- **T1-03 inaccessible state:** Critical gameplay status must be React-rendered text, not canvas-only pixels.
- **T1-04 client authority:** Client controls emit intent only. Server snapshots/results remain authoritative.

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing test references.
- [x] No watch-mode flags.
- [x] Feedback latency target is explicit.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-04-25
