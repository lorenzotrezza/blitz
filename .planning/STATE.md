# State: Blitz Playable Minigames

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-25)

**Core value:** Every minigame must feel manually playable on a phone.
**Current focus:** Phase 1 - Fullscreen Game Shell And Input Foundation

## Current Status

- Project initialized.
- Brownfield codebase map exists in `.planning/codebase/`.
- Requirements defined in `.planning/REQUIREMENTS.md`.
- Roadmap defined in `.planning/ROADMAP.md`.
- Next recommended command: `$gsd-discuss-phase 1`

## Active Phase

| Field | Value |
|-------|-------|
| Phase | 1 |
| Name | Fullscreen Game Shell And Input Foundation |
| Status | Not started |
| UI hint | yes |

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

## Open Risks

- Mobile control feel needs real viewport/manual testing.
- Existing race runtime files are large and should be split carefully.
- Socket identity/reconnect issues remain outside this milestone unless they block playability.

---
*Initialized: 2026-04-25*
