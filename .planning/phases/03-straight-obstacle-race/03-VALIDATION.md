---
phase: 3
slug: straight-obstacle-race
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-25
---

# Phase 3 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shared/server: Node test runner through `node --import tsx --test`; web: Vitest with jsdom |
| **Config file** | Web: `apps/web/vite.config.ts`; server/shared use package scripts and TS configs |
| **Quick run command** | `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts src/games/race/straightObstacle.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | Focused server tests under 15s; full suite project-dependent |

---

## Sampling Rate

- **After every task commit:** Run the focused package test for changed files.
- **After every plan wave:** Run `pnpm --filter @blitz/shared test`, `pnpm --filter @blitz/server test`, and `pnpm --filter @blitz/web test`.
- **Before `$gsd-verify-work`:** Run `pnpm run build` and `pnpm test`.
- **Max feedback latency:** 15s for focused helper/runtime changes; full suite required at phase gate.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DODGE-01, DODGE-04, DODGE-05 | T-03-01 | Shared input is intent-only; snapshots/results are server-owned fields | contract | `pnpm --filter @blitz/shared test` | Partial | pending |
| 03-02-01 | 02 | 1 | DODGE-01, DODGE-02, DODGE-03 | T-03-01, T-03-02 | Server clamps malformed steering and computes collisions/hits itself | unit | `pnpm --filter @blitz/server test -- src/games/race/straightObstacleRules.test.ts` | No - Wave 0 | pending |
| 03-03-01 | 03 | 2 | DODGE-01, DODGE-02, DODGE-03, DODGE-05 | T-03-01, T-03-02, T-03-03 | Runtime accepts only player intent and emits authoritative snapshots/results | runtime | `pnpm --filter @blitz/server test -- src/games/race/straightObstacle.test.ts` | No - Wave 0 | pending |
| 03-04-01 | 04 | 3 | DODGE-01, DODGE-04 | T-03-04 | Component HUD exposes warning/slowdown state as React text and steering resets on cancel | web | `pnpm --filter @blitz/web test -- DodgeRoadView.test.tsx DodgeHud.test.tsx DodgeSteeringPad.test.tsx useDodgeRaceControls.test.tsx` | No - Wave 0 | pending |
| 03-05-01 | 05 | 4 | DODGE-01, DODGE-04 | T-03-04 | Fullscreen route uses Phase 1 shell, submits steering intent, and navigates to results on finish | web | `pnpm --filter @blitz/web test -- StraightObstacleRacePage.test.tsx` | No - Wave 0 | pending |
| 03-06-01 | 06 | 5 | DODGE-05 | T-03-02, T-03-04 | Results render obstacle hits from typed result metadata, not label parsing, then root gates run | web + phase gate | `pnpm --filter @blitz/web test -- ResultsPage.test.tsx && pnpm test && pnpm run build` | Partial | pending |

---

## Wave 0 Requirements

- [ ] `packages/shared/src/contracts.test.ts` - add straight-obstacle input/snapshot/result shape coverage.
- [ ] `apps/server/src/games/race/straightObstacleRules.test.ts` - create pure rule tests for steering, wave generation, collisions, slowdown, recovery, finish, and rankings.
- [ ] `apps/server/src/games/race/straightObstacle.test.ts` - create runtime lifecycle, tick, finish, and registry integration tests.
- [ ] `apps/web/src/pages/StraightObstacleRacePage.test.tsx` - create route, HUD, steering control, and finish-navigation tests.
- [ ] `apps/web/src/pages/ResultsPage.test.tsx` - extend with dodge result summary assertions.

---

## Threat References

| Threat | Risk | Required Mitigation |
|--------|------|---------------------|
| T-03-01 | Client sends out-of-range or malformed `steerX` input | Server input reader rejects wrong mode/kind and clamps finite numeric steering to `-1..1` |
| T-03-02 | Client claims speed, distance, hit count, slowdown, or finish | Shared input carries intent only; server computes all authoritative gameplay fields |
| T-03-03 | Client floods `client:game-input` | Runtime stores latest valid steering intent per player and ignores stale/non-finite sequence values |
| T-03-04 | Canvas-only feedback hides warnings/slowdown from tests and assistive tech | HUD renders `Obstacle ahead`, `Hits`, `Speed`, `Distance`, and `Slowdown` as React text with a polite live region |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Phone steering comfort and first-pass obstacle tuning | DODGE-01, DODGE-02, DODGE-03 | Exact thumb feel, reaction distance, and difficulty curve need real viewport play-testing | Run the dev app on a phone-sized viewport; confirm smooth left/right steering, readable incoming waves, visible speed drop, and recoverable first collision |
| Fullscreen no-scroll behavior on mobile browser | DODGE-01, DODGE-04 | CSS viewport/safe-area behavior varies by browser chrome | Open the straight obstacle session route on mobile viewport; verify HUD, road, and controls are visible without page scrolling |

---

## Validation Sign-Off

- [x] All tasks have automated verification or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency target documented.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-04-25
