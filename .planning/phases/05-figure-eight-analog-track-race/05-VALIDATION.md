---
phase: 05
slug: figure-eight-analog-track-race
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-25
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shared/server use Node built-in test runner with `tsx`; web uses Vitest and Testing Library. |
| **Config file** | Web config: `apps/web/vite.config.ts`; server/shared use package scripts. |
| **Quick run command** | `pnpm --filter @blitz/server test` for rule/runtime work; `pnpm --filter @blitz/web test -- FigureEightTrackPage figureEightTrackCanvas` for web work; `pnpm --filter @blitz/shared test` for contracts. |
| **Full suite command** | `pnpm test` and `pnpm run build` |
| **Estimated runtime** | Package tests should remain under 60 seconds each; full suite runtime is repository-dependent. |

---

## Sampling Rate

- **After every task commit:** Run the focused package command for the files touched by that task.
- **After every plan wave:** Run every package test command touched by the wave.
- **Before `$gsd-verify-work`:** `pnpm test` and `pnpm run build` must be green.
- **Max feedback latency:** No more than one task may land without a focused automated check.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | ANLG-03 | T-05-01 | Client input remains compact intent; no client-authored lap/checkpoint/finish authority. | shared contract | `pnpm --filter @blitz/shared test` | existing `packages/shared/src/contracts.test.ts`; extend it | pending |
| 05-02-01 | 02 | 1 | ANLG-03 | T-05-02 | Gate order cannot be advanced by center cuts, skipped lobes, or wrong-way crossing. | server unit | `pnpm --filter @blitz/server test` | create `apps/server/src/games/race/figureEightTrackRules.test.ts` | pending |
| 05-03-01 | 03 | 2 | ANLG-03 | T-05-03 | Runtime accepts only valid figure-eight analog input for mapped players and computes authoritative state. | server runtime | `pnpm --filter @blitz/server test` | create `apps/server/src/games/race/figureEightTrack.test.ts` | pending |
| 05-04-01 | 04 | 2 | ANLG-03 | — | Fullscreen page exposes analog controls, HUD next-gate/direction text, crossing warning, and finish navigation. | web component | `pnpm --filter @blitz/web test -- FigureEightTrackPage` | create `apps/web/src/pages/FigureEightTrackPage.test.tsx` | pending |
| 05-04-02 | 04 | 2 | ANLG-03 | — | Canvas helper exposes bridge/underpass crossing treatment, active route cue, arrows, warning colors, and labels. | web unit | `pnpm --filter @blitz/web test -- figureEightTrackCanvas` | create `apps/web/src/game/figureEightTrackCanvas.test.ts` | pending |
| 05-05-01 | 05 | 3 | ANLG-03 | T-05-04 | Figure-eight routing/registry/results integration works without regressing circular analog tests. | regression | `pnpm test` and `pnpm run build` | depends on Phase 4 circle tests existing | pending |

---

## Wave 0 Requirements

- [ ] `packages/shared/src/contracts.test.ts` — assertions for `PARTY_GAME_VARIANTS.figureEightTrack`, startability, `modeId: 'figure-eight'`, and snapshot fields.
- [ ] `apps/server/src/games/race/figureEightTrackRules.test.ts` — gate-order, center crossing, skipped-lobe, lap, warning, and penalty tests.
- [ ] `apps/server/src/games/race/figureEightTrack.test.ts` — runtime start/input/finish/invalid payload tests.
- [ ] `apps/web/src/pages/FigureEightTrackPage.test.tsx` — fullscreen shell, no app chrome, analog control, HUD, crossing warning, and finish navigation tests.
- [ ] `apps/web/src/game/figureEightTrackCanvas.test.ts` — drawing helper tests for crossing treatment, next gate highlight, arrows, warning colors, and labels.
- [ ] `apps/web/src/lib/sessionRoutes.test.ts` — create or extend if Phase 4 has not already added route helper coverage.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Center crossing reads as intentional on a phone viewport. | ANLG-03 | Automated tests can assert labels/classes/canvas helper calls, but readability and thumb-play feel need viewport inspection. | Start a figure-eight session on a mobile-sized viewport, drive through the center crossing, and confirm bridge/underpass, arrows, next-gate cue, and HUD feedback are readable without scrolling. |

---

## Validation Sign-Off

- [x] All planned behaviors have automated verification targets or Wave 0 test dependencies.
- [x] Sampling continuity: no plan should have more than one task without automated verify.
- [x] Wave 0 covers all missing test references identified by research.
- [x] No watch-mode flags are required.
- [x] Feedback latency target documented.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending plan checker verification
