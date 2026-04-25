# Phase 6: Lobby, Results, And Regression Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-25T21:50:49Z
**Phase:** 06-lobby-results-and-regression-polish
**Areas discussed:** Race Catalog Presentation, Variant Routing Shape, Mode-Specific Results, Regression Gate Depth

---

## Race Catalog Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Final four-mode catalog | Expose Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track with objective/control/skill copy. | yes |
| Minimal rename | Rename existing Sprint Circuit and Drag Sprint labels but keep the selector shape mostly unchanged. | no |
| Defer catalog polish | Keep current labels until after more gameplay work. | no |

**User's choice:** Approved recommended defaults with "ok va bene".
**Notes:** Current `LobbyPage` only exposes `Sprint Circuit` and `Drag Sprint`, so Phase 6 should make all rebuilt modes visible and distinct.

---

## Variant Routing Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Mode-aware race routing with per-mode adapters | Keep fullscreen race routing, but make route resolution and page behavior variant-aware while avoiding one giant page. | yes |
| Separate full page per mode | Add distinct route/page modules for every race variant. | no |
| Keep one hardcoded race page | Route every race session to the current live race page behavior. | no |

**User's choice:** Approved recommended defaults with "ok va bene".
**Notes:** `resolveSessionRoute()` currently sends all race sessions to `/race/live/:sessionId`; `SprintCircuitPage` currently hardcodes circle-mode assumptions.

---

## Mode-Specific Results

| Option | Description | Selected |
|--------|-------------|----------|
| Shared rankings plus concise mode summaries | Keep the common ranking list and add drag/dodge/circle/figure-eight summary fields when available. | yes |
| Full custom result page per mode | Build completely separate result layouts for every race variant. | no |
| Generic rankings only | Do not show shift quality, obstacle hits, laps, or penalties. | no |

**User's choice:** Approved recommended defaults with "ok va bene".
**Notes:** `ResultsPage` is currently generic, but prior phase contexts already define the mode-specific summary fields players need to understand outcomes.

---

## Regression Gate Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full party-flow regression gate | Cover catalog, startability, route resolution, results, non-race flows, mobile viewport/manual checks, root tests, and build. | yes |
| Focus only changed components | Test only files directly edited in Phase 6. | no |
| Manual smoke only | Rely on informal play-through. | no |

**User's choice:** Approved recommended defaults with "ok va bene".
**Notes:** Phase 6 owns FLOW-05, ARCH-03, and ARCH-04, so it must prove existing Semaforo, Rigori, lobby, invite, ready, post-game, and Render-style build flows still work.

---

## the agent's Discretion

- Exact layout pattern for lobby race options.
- Exact shared variant id names, provided they map one-to-one to final modes.
- Exact implementation split for result summary helpers.
- Exact package-level test split, provided the final gate covers the full Phase 6 party flow.

## Deferred Ideas

- Persistent leaderboards, accounts, high scores, and shareable recap cards.
- Reconnect identity, socket hardening, payload validation, CORS hardening, and lobby TTL/capacity policy unless directly blocking Phase 6.
- Sound, haptics, advanced visual polish, car-specific handling, and powerups.
