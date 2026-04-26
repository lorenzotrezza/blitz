---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Executing Phase 03
last_updated: "2026-04-26T11:49:26.874Z"
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 31
  completed_plans: 15
  percent: 48
---

# State: Blitz Playable Minigames

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-25)

**Core value:** Every minigame must feel manually playable on a phone.
**Current focus:** Phase 03 — straight-obstacle-race

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
- Phase 3 Plan 01 completed in `.planning/phases/03-straight-obstacle-race/03-01-SUMMARY.md`.
- Phase 3 Plan 02 completed in `.planning/phases/03-straight-obstacle-race/03-02-SUMMARY.md`.
- Phase 3 Plan 03 completed in `.planning/phases/03-straight-obstacle-race/03-03-SUMMARY.md`.
- Phase 3 Plan 04 completed in `.planning/phases/03-straight-obstacle-race/03-04-SUMMARY.md`.
- Phase 3 Plan 05 completed in `.planning/phases/03-straight-obstacle-race/03-05-SUMMARY.md`.

## Active Phase

| Field | Value |
|-------|-------|
| Phase | 03 |
| Name | straight-obstacle-race |
| Status | In progress; 5 of 6 plans complete |
| UI hint | yes |
| Plans | 5 / 6 complete |

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
- Straight obstacle client input contains steering intent only: mode, kind, steerX, sequence, and client timestamp.
- Straight obstacle snapshots and result details own distance, speed, warnings, obstacles, hit count, slowdown, finish time, and result values.
- `race:straight-obstacle` is startable through shared lobby validation without removing the existing `traffic-survival` variant.
- Straight obstacle rules stay pure and side-effect free: no timers, Socket.IO, DOM, or mutable globals.
- Obstacle waves use seeded deterministic templates with continuous normalized x collision bounds.
- Obstacle hits are counted once per player/obstacle and produce server-owned slowdown and result details.
- Straight obstacle runtime advances on a server-owned interval using the latest valid steering intent per player.
- Runtime input accepts only straight-obstacle steer packets with finite increasing sequence values and finite steerX.
- Client-claimed speed, distance, hits, slowdown, finish, and rank fields are ignored because the runtime stores only clamped steering intent.
- Dodge frontend controls emit only normalized StraightObstacleInput steering intent.
- Dodge warning, hits, speed, distance, and slowdown are React-rendered text for tests and assistive technology.
- Dodge steering resets to neutral on pointer, blur, visibility, disabled, and unmount lifecycles.
- Straight obstacle sessions use a dedicated top-level fullscreen route at `/race/straight-obstacle/:sessionId` outside AppLayout chrome.
- StraightObstacleRacePage renders only server-owned straight-obstacle snapshots and submits steering intent through generic `client:game-input`.
- StraightObstacleRacePage rewrites steering sequence values with a route-local monotonic counter so neutral reset packets cannot make later same-session input stale.

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-fullscreen-game-shell-and-input-foundation | 01 | 5m 23s | 2 | 3 |
| 01-fullscreen-game-shell-and-input-foundation | 02 | 8m 15s | 2 | 6 |
| 01-fullscreen-game-shell-and-input-foundation | 03 | 4m 40s | 2 | 7 |
| 01-fullscreen-game-shell-and-input-foundation | 04 | 11m 25s | 3 | 5 |
| 02-drag-gear-race | 05 | 18m | 2 | 4 |
| 02-drag-gear-race | 06 | 24m | 3 | 3 |
| 03-straight-obstacle-race | 01 | 3m 11s | 3 | 5 |
| 03-straight-obstacle-race | 02 | 5m 59s | 2 | 3 |
| 03-straight-obstacle-race | 03 | 7m 17s | 2 | 5 |
| 03-straight-obstacle-race | 04 | 7m 22s | 2 | 10 |
| 03-straight-obstacle-race | 05 | 8m 12s | 2 | 5 |

## Last Session

| Field | Value |
|-------|-------|
| Timestamp | 2026-04-26T11:48:10Z |
| Stopped At | Completed 03-05-PLAN.md |
| Resume File | None |

## Open Risks

- Mobile control feel needs real viewport/manual testing.
- Existing race runtime files are large and should be split carefully.
- Socket identity/reconnect issues remain outside this milestone unless they block playability.

---
*Initialized: 2026-04-25*
