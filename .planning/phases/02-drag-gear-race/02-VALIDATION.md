---
phase: 02
slug: drag-gear-race
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-25
---

# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner for server/shared; Vitest for web |
| **Config file** | `apps/web/vite.config.ts`; server/shared use package TypeScript configs and Node test CLI |
| **Quick run command** | `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts src/games/race/dragSprint.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~60-120 seconds |

---

## Sampling Rate

- **After every task commit:** Run the focused package test for touched code.
- **After every plan wave:** Run `pnpm --filter @blitz/shared test`, `pnpm --filter @blitz/server test`, and relevant `@blitz/web` tests for changed pages/components.
- **Before `$gsd-verify-work`:** `pnpm run build` and `pnpm test` must pass.
- **Max feedback latency:** 120 seconds for focused checks; full suite before completion.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | DRAG-01, DRAG-02, DRAG-03, DRAG-04, DRAG-05, ARCH-02 | T-02-01 / T-02-02 | Shared payloads contain intent/snapshot/result fields only; server remains authoritative | shared contract | `pnpm --filter @blitz/shared test` | partial | pending |
| 02-02-01 | 02 | 1 | DRAG-01, DRAG-02, DRAG-03, ARCH-02 | T-02-01 / T-02-02 | Runtime guards reject malformed drag input and ignore impossible shift state | server unit | `pnpm --filter @blitz/server test -- src/games/race/dragGearRules.test.ts` | no - W0 | pending |
| 02-03-01 | 03 | 1 | DRAG-01, DRAG-02, DRAG-03, DRAG-05, ARCH-02 | T-02-01 / T-02-02 | Runtime derives speed, RPM, finish time, rankings, and summary from server state | server integration | `pnpm --filter @blitz/server test -- src/games/race/dragSprint.test.ts` | yes - rewrite | pending |
| 02-04-01 | 04 | 2 | DRAG-01, DRAG-02, DRAG-04 | T-02-03 | Client resets throttle on cancel/blur/unmount and emits shift as discrete action | web component | `pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx` | no - W0 | pending |
| 02-05-01 | 05 | 2 | DRAG-05 | T-02-01 | Results render server-provided finish time and shift summary without trusting client outcome | web page | `pnpm --filter @blitz/web test -- ResultsPage.test.tsx` | yes - extend | pending |
| 02-06-01 | 06 | 3 | DRAG-01, DRAG-02, DRAG-03, DRAG-04, DRAG-05, ARCH-02 | all | Full build/test proves package integration | workspace | `pnpm run build && pnpm test` | yes | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `packages/shared/src/contracts.test.ts` - add/adjust assertions for `DragGearInput`, `DragGearSnapshot`, `DragShiftQuality`, and `DragShiftSummary` exports.
- [ ] `apps/server/src/games/race/dragGearRules.test.ts` - create pure rule tests for shift timing, acceleration, finish, ranking, and shift summary.
- [ ] `apps/server/src/games/race/dragSprint.test.ts` - rewrite old lane/obstacle/pickup/survival assertions for gear-race session behavior.
- [ ] `apps/web/src/pages/DragGearRacePage.test.tsx` - create page tests for fullscreen route, HUD copy, throttle/shift controls, and finish navigation.
- [ ] `apps/web/src/pages/ResultsPage.test.tsx` - add visible `Shift Summary` assertions.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Touch comfort and learnability on phone viewport | DRAG-01, DRAG-02, DRAG-04 | Automated tests can verify controls and HUD text, but not whether shift timing feels learnable on real touch hardware | Run a local session on mobile viewport or phone browser. Confirm throttle is holdable, shift is tappable, ideal window is visible before shifting, and one bad shift is recoverable. |
| Better timing clearly wins in local play | DRAG-03, DRAG-05 | Automated tuning tests can assert relative curves, but final play feel needs a human sanity check | Run one single-player or two-player manual race. Confirm runs with more `PERFECT`/`GOOD` shifts finish faster than mediocre runs. |

---

## Threat Model References

| Ref | Threat | Mitigation Required In Plans |
|-----|--------|------------------------------|
| T-02-01 | Forged client speed/RPM/finish payload | Input payloads contain throttle/shift intent only; server derives speed, RPM, finish time, rankings, and summary. |
| T-02-02 | High-rate shift/throttle spam | Runtime guards clamp/ignore malformed sequence, repeated shift actions, invalid gear transitions, and inputs when not racing. |
| T-02-03 | Stuck throttle after cancel/background/unmount | Client control code resets throttle on pointer cancel, blur, visibility change, route unmount, race finish, and connection loss. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 120s for focused checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-25
