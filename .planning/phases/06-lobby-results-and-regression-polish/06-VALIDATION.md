---
phase: 06
slug: lobby-results-and-regression-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 06-GATE | Final | final | ARCH-04 | - | N/A | full gate | `pnpm test`; `pnpm run build` | Root scripts exist | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/src/pages/LobbyPage.test.tsx` includes assertions for all four final race variants and objective/control/skill copy.
- [ ] `apps/web/src/lib/sessionRoutes.test.ts` or `apps/web/src/app/router.test.tsx` includes route coverage for all four final race variants.
- [ ] `apps/web/src/pages/ResultsPage.test.tsx` includes drag, dodge, circle, figure-eight, and missing-summary-field cases.
- [ ] `packages/shared/src/contracts.test.ts` or adjacent shared tests cover final race variant startability.
- [ ] `apps/server/src/games/registry.test.ts` covers registry resolution for all final race variants.

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

- [ ] All tasks have automated verify commands or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags.
- [ ] Focused test feedback used during task execution.
- [ ] `nyquist_compliant: true` set in frontmatter after plans fully map these checks.

**Approval:** pending
