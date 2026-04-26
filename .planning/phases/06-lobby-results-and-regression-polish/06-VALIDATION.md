---
phase: 06
slug: lobby-results-and-regression-polish
status: revised
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-26
---

# Phase 06 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Web: Vitest and Testing Library; server/shared/root: Node built-in test runner |
| **Config file** | `apps/web/vite.config.ts`; package scripts for server/shared/root |
| **Quick run command** | `pnpm --filter @blitz/web test` for web changes, `pnpm --filter @blitz/server test` for registry/socket changes, `pnpm --filter @blitz/shared test` for shared contract changes |
| **Full suite command** | `pnpm test` then `pnpm run build` |
| **Estimated runtime** | Unknown until measured during execution |

---

## Sampling Rate

- **After every task commit:** Run the focused package test for the touched boundary.
- **After every plan wave:** Run `pnpm test`.
- **Before `$gsd-verify-work`:** Run `pnpm test`, `pnpm run build`, and manual mobile viewport verification.
- **Max feedback latency:** Use focused package tests during task work; root suite/build only at wave and phase gates.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-W0-01 | Wave 0 | 0 | FLOW-01, FLOW-02 | T-06-01 | Unsupported variants remain unstartable server-side | web/shared/server | `pnpm --filter @blitz/web test`; `pnpm --filter @blitz/shared test`; `pnpm --filter @blitz/server test` | Existing tests need new assertions | pending |
| 06-W0-02 | Wave 0 | 0 | FLOW-03 | T-06-01 | Route mapping uses shared final variant ids, not client-only labels | web | `pnpm --filter @blitz/web test` | Route helper coverage may need new test file | pending |
| 06-W0-03 | Wave 0 | 0 | FLOW-04 | T-06-03 | Missing result summary fields do not break rankings or post-game actions | web | `pnpm --filter @blitz/web test` | Existing `ResultsPage.test.tsx` needs cases | pending |
| 06-W0-04 | Wave 0 | 0 | FLOW-05, ARCH-03 | T-06-04 | Host-only post-game actions remain server-authoritative | web/server/root | `pnpm test` | Existing coverage needs regression assertions | pending |
| 06-W0-05 | Wave 0 | 0 | FLOW-01, FLOW-03 | T-06-02 | Final race variants are not made startable unless Phase 3-5 runtimes and fullscreen pages exist | shared/server/web prerequisite | `test -f apps/web/src/pages/DragGearRacePage.tsx`; `test -f apps/server/src/games/race/straightObstacle.ts`; `test -f apps/web/src/pages/StraightObstacleRacePage.tsx`; `test -f apps/server/src/games/race/circleTrack.ts`; `test -f apps/web/src/pages/CircleTrackPage.tsx`; `test -f apps/server/src/games/race/figureEightTrack.ts`; `test -f apps/web/src/pages/FigureEightTrackPage.tsx` | Planned in `06-01-PLAN.md` Task 0 | pending |
| 06-W0-06 | Wave 0 | 0 | ARCH-03 | T-06-08 | Every final race page has explicit control availability and HUD copy tests | web component/page | `pnpm --filter @blitz/web test -- DragGearRacePage.test.tsx StraightObstacleRacePage.test.tsx CircleTrackPage.test.tsx FigureEightTrackPage.test.tsx` | Planned in `06-03-PLAN.md` Task 1 | pending |
| 06-GATE | Final | final | ARCH-04 | - | N/A | full gate | `pnpm test`; `pnpm run build` | Root scripts exist | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/src/pages/LobbyPage.test.tsx` includes assertions for all four final race variants and objective/control/skill copy.
- [ ] `apps/web/src/lib/sessionRoutes.test.ts` or `apps/web/src/app/router.test.tsx` includes route coverage for all four final race variants.
- [ ] `apps/web/src/pages/DragGearRacePage.test.tsx` asserts controls `THROTTLE` and `SHIFT`, plus HUD copy `Time the shift window`, `RPM`, `GEAR 1/4`, `KM/H`, `M`, and `LAST SHIFT`.
- [ ] `apps/web/src/pages/StraightObstacleRacePage.test.tsx` asserts steering control availability and HUD copy `Dodge obstacles`, `Distance`, `Speed`, `Obstacle ahead`, `Hits`, and `Slowdown`.
- [ ] `apps/web/src/pages/CircleTrackPage.test.tsx` asserts analog control `STEER` and HUD copy `Complete 3 laps clockwise`, `Lap 1/3`, `Gate 2/4`, `Clockwise`, `On course`, and `42 km/h`.
- [ ] `apps/web/src/pages/FigureEightTrackPage.test.tsx` asserts analog control `STEER` and HUD copy `Figure Eight`, `Complete the figure eight`, `Lap 1/3`, `Next gate`, `Center eastbound`, `Crossing`, `On course`, `Wrong lobe`, and `42 km/h`.
- [ ] `apps/web/src/pages/ResultsPage.test.tsx` includes drag, dodge, circle, figure-eight, and missing-summary-field cases.
- [ ] `packages/shared/src/contracts.test.ts` or adjacent shared tests cover final race variant startability.
- [ ] `apps/server/src/games/registry.test.ts` covers registry resolution for all final race variants.
- [ ] `06-01-PLAN.md` Task 0 completes before production source edits and blocks final race startability if any Phase 3-5 runtime (`straightObstacle.ts`, `circleTrack.ts`, `figureEightTrack.ts`) or fullscreen page is missing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile lobby catalog readability | FLOW-01, FLOW-02 | Phone viewport density and touch comfort require real viewport inspection | Open the lobby on a phone-sized viewport, confirm all race cards/options are visible, readable, and selectable without horizontal overflow. |
| Full party flow on mobile viewport | FLOW-03, FLOW-05 | Route transitions and fullscreen gameplay chrome need viewport-level confirmation | Start each race variant from lobby on a phone-sized viewport, confirm it opens a fullscreen gameplay route and returns to results/post-game without normal app chrome constraining gameplay. |
| Final Render-style gate | ARCH-04 | Build output and health path must match deployment assumptions | Run `pnpm test`, `pnpm run build`, and confirm `/health` remains the intended health check in deployment config. |

---

## Threat References

| Ref | Threat | Required Mitigation |
|-----|--------|---------------------|
| T-06-01 | Client selects unsupported or stale race variant id | Server rechecks shared `isLobbySelectionStartable()` and registry resolution before session start. |
| T-06-03 | Browser result payload is missing, stale, or partial | Results treat stored payloads as display data only and degrade to rankings/no-data states. |
| T-06-04 | Non-host triggers post-game action | Server host checks for rematch, return-to-lobby, and change-game remain covered by tests. |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [ ] Focused test feedback used during task execution.
- [x] `nyquist_compliant: true` set in frontmatter after plans fully map these checks.

**Approval:** planning coverage revised; execution feedback pending
