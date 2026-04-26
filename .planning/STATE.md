---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Human verification required
last_updated: "2026-04-26T10:47:17Z"
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 26
  completed_plans: 14
  percent: 54
---

# State: Blitz Playable Minigames

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-25)

**Core value:** Every minigame must feel manually playable on a phone.
**Current focus:** Phase 02 — drag-gear-race human UAT

## Current Status

- Project initialized.
- Brownfield codebase map exists in `.planning/codebase/`.
- Requirements defined in `.planning/REQUIREMENTS.md`.
- Roadmap defined in `.planning/ROADMAP.md`.
- Phase 1 discussion completed in `.planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md`.
- Phase 1 UI design contract approved in `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md`.
- Phase 1 planned with 4 verified plans in `.planning/phases/01-fullscreen-game-shell-and-input-foundation/`.
- Phase 1 Plan 01 completed in `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-01-SUMMARY.md`.
- Phase 1 Plan 02 completed in `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-02-SUMMARY.md`.
- Phase 1 Plan 03 completed in `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-03-SUMMARY.md`.
- Phase 1 Plan 04 completed in `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-04-SUMMARY.md`.
- Next recommended phase: Phase 02 — drag-gear-race.
- Phase 2 execution completed with all 6 plans summarized in `.planning/phases/02-drag-gear-race/`.
- Phase 2 code review completed in `.planning/phases/02-drag-gear-race/02-REVIEW.md`; actionable warnings fixed in `.planning/phases/02-drag-gear-race/02-REVIEW-FIX.md`.
- Phase 2 automated verification completed in `.planning/phases/02-drag-gear-race/02-VERIFICATION.md` with status `human_needed`.
- Phase 2 human checks are tracked in `.planning/phases/02-drag-gear-race/02-HUMAN-UAT.md`.

## Active Phase

| Field | Value |
|-------|-------|
| Phase | 02 |
| Name | drag-gear-race |
| Status | Human verification required; 6 of 6 plans complete |
| UI hint | yes |
| Plans | 6 / 6 complete |

## Quick Tasks Completed

| Date | Slug | Status |
|------|------|--------|
| 2026-04-25 | ui-laps-gift-locked-maps | complete |

## Decisions To Preserve

- Browser-first, mobile-first gameplay.
- Keep the current React/Express/Socket.IO/shared-contract stack.
- Server remains authoritative for gameplay state.
- The race catalog must contain mechanically distinct modes, not renamed copies.
- Phase 1 should solve controls and fullscreen layout before individual game modes.
- Phase 1 locked decisions are recorded in `1-CONTEXT.md`: fullscreen gameplay route, landscape-first phone target, two-thumb controls, reusable analog/action primitives, minimal readable HUD, desktop fallback, and discriminated shared contracts.
- Race input remains player intent only; no result, rank, or authoritative position fields were added in Plan 01.
- Existing generic `GameInputPayload` compatibility was preserved with `PlayerInput` and `Record<string, unknown>` support.
- Controls emit compact player intent only: analog vectors, button state changes, and one-shot action names.
- Pointer controls set functional touch-action/user-select safeguards inline until Plan 03 adds complete styling.
- Gameplay shell uses fixed viewport containment and safe-area padding so race screens are not normal scroll pages.
- HUD values are React-rendered text with a polite live region; canvas children remain visual only.
- The live race route is a top-level router branch so AppLayout topbar, viewport, panel, and card chrome do not constrain gameplay.
- SprintCircuitPage adapts authoritative RaceSnapshot data into RaceShellSnapshot HUD text; client controls emit intent only.
- Drag sprint now runs as a straight drag gear race under the existing `race:drag-sprint` registry key.
- Drag inputs remain intent-only: hold throttle and one-shot shift; no client-authored speed, RPM, distance, rank, or result fields.
- Drag runtime advances held throttle on an authoritative server tick so RPM, speed, and distance update without repeated client packets.
- Drag results render only server-finished payload summary values for finish time and shift counts.

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-fullscreen-game-shell-and-input-foundation | 01 | 5m 23s | 2 | 3 |
| 01-fullscreen-game-shell-and-input-foundation | 02 | 8m 15s | 2 | 6 |
| 01-fullscreen-game-shell-and-input-foundation | 03 | 4m 40s | 2 | 7 |
| 01-fullscreen-game-shell-and-input-foundation | 04 | 11m 25s | 3 | 5 |
| 02-drag-gear-race | 05 | 18m | 2 | 4 |
| 02-drag-gear-race | 06 | 24m | 3 | 3 |

## Last Session

| Field | Value |
|-------|-------|
| Timestamp | 2026-04-26T10:47:17Z |
| Stopped At | Phase 2 automated verification complete; human UAT pending |
| Resume File | None |

## Open Risks

- Mobile control feel needs real viewport/manual testing.
- Existing race runtime files are large and should be split carefully.
- Socket identity/reconnect issues remain outside this milestone unless they block playability.

---
*Initialized: 2026-04-25*
