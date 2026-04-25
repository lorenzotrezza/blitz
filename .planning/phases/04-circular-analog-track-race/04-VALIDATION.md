---
phase: 4
slug: circular-analog-track-race
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-25
---

# Phase 4 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in test runner for `apps/server` and `packages/shared`; Vitest with jsdom for `apps/web` |
| **Config file** | `apps/web/vite.config.ts` for web tests; package scripts for server/shared tests |
| **Quick run command** | `pnpm --filter @blitz/server test` or `pnpm --filter @blitz/web test -- CircleTrackPage` depending on touched package |
| **Full suite command** | `pnpm test` and `pnpm run build` |
| **Estimated runtime** | ~90 seconds focused, ~180 seconds full workspace |

---

## Sampling Rate

- **After every task commit:** Run the focused package test for the package touched by the task.
- **After every plan wave:** Run `pnpm --filter @blitz/shared test`, `pnpm --filter @blitz/server test`, and `pnpm --filter @blitz/web test`.
- **Before `$gsd-verify-work`:** `pnpm test` and `pnpm run build` must both pass.
- **Max feedback latency:** 180 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-W0-shared | Wave 0 | 0 | ANLG-01, ANLG-02 | T-04-01 / T-04-03 | Shared contracts expose circle input/snapshot without accepting client lap/result authority | contract | `pnpm --filter @blitz/shared test` | W0 missing | pending |
| 04-W0-rules | Wave 0 | 0 | ANLG-02, ANLG-04 | T-04-01 / T-04-03 | Server helpers clamp input and derive gates/laps/penalties from server state | unit | `pnpm --filter @blitz/server test` | W0 missing | pending |
| 04-W0-runtime | Wave 0 | 0 | ANLG-01, ANLG-02, ANLG-04 | T-04-01 / T-04-02 / T-04-03 | Runtime ignores invalid/unknown input and emits authoritative snapshots/results | runtime | `pnpm --filter @blitz/server test` | W0 missing | pending |
| 04-W0-web | Wave 0 | 0 | ANLG-01, ANLG-05 | T-04-01 | Page renders fullscreen analog controls and HUD from snapshot state | component | `pnpm --filter @blitz/web test -- CircleTrackPage` | W0 missing | pending |
| 04-W0-routing | Wave 0 | 0 | ANLG-01, ANLG-05 | T-04-03 | Circle variant routes to the circle page, not stale sprint/race events | route/component | `pnpm --filter @blitz/web test -- sessionRoutes router` | W0 missing | pending |

*Status values: pending, green, red, flaky.*

---

## Wave 0 Requirements

- [ ] `packages/shared/src/contracts.test.ts` or shared package tests cover `PARTY_GAME_VARIANTS.circleTrack`, startability, and circle input/snapshot exports if new exports are added.
- [ ] `apps/server/src/games/race/circleTrackRules.test.ts` covers gate order, lap completion, skipped gate rejection, off-track grace, wrong-way grace, and penalty application.
- [ ] `apps/server/src/games/race/circleTrack.test.ts` covers runtime start, analog input application, finish rankings, result summary, invalid input handling, and state emission.
- [ ] `apps/web/src/pages/CircleTrackPage.test.tsx` covers fullscreen shell, analog control presence, circle HUD copy, off-track/wrong-way warning copy, finish navigation, and generic session input usage.
- [ ] `apps/web/src/lib/sessionRoutes.test.ts` or `apps/web/src/app/router.test.tsx` covers `race/circle-track` session routing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile analog feel and thumb comfort | ANLG-01 | jsdom cannot validate real touch ergonomics, safe-area comfort, or steering feel | On a phone viewport, start a circle-track session, drag the analog pad through a full lap, confirm the pad stays bottom-left, the page does not scroll, and the car is steerable without twitch-only precision |
| Track readability during live play | ANLG-02, ANLG-05 | Canvas readability and next-gate salience need visual inspection | In landscape and portrait, confirm the start gate, next gate, route arrows, car, lap, gate, speed, and penalty HUD are all readable without overlap |

---

## Threat References

| Threat | Description | Required Mitigation |
|--------|-------------|---------------------|
| T-04-01 | Malformed or extreme analog input values | Clamp vector values, reject invalid `kind`/`modeId`, and compute state server-side |
| T-04-02 | High-frequency input spam | Keep payload compact and avoid expensive per-input work; planner may add coalescing/throttling if needed |
| T-04-03 | Client fakes lap, checkpoint, penalty, or finish state | Never accept lap/checkpoint/result fields from client input; derive them in runtime helpers |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency < 180s.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-04-25
