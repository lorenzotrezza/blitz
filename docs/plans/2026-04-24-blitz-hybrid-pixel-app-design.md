# Blitz Hybrid Pixel App Design

**Date:** 2026-04-24

## Goal

Keep the legacy `index.html` experience as the canonical home flow while evolving the new Railway app into a real 10bit-styled shell for hub, practice, bot race, lobby, and live race.

## Decisions

- `/` stays the legacy game, served inside the web app through the synced legacy document.
- `/hub` becomes the new 10bit control room, visually aligned with the legacy game rather than the temporary glossy shell.
- Existing games already built in the legacy document stay real and reusable:
  - `/hub/minigames/lights` boots the real semaforo
  - `/hub/minigames/penalty` boots the real rigori
- New game surfaces become native React/canvas pages:
  - `/practice`
  - `/race/bot`
  - `/lobby/:code`
  - `/race/live/:sessionId`
- The live lobby page uses the existing Socket.IO lobby lifecycle instead of rebuilding state locally.

## UI Direction

- Reuse the legacy palette, pixel typography, button language, and dense arcade framing.
- Avoid the current “Blitz Race Control” generic shell look.
- New pages should feel like siblings of the original `index.html`, not a different product.

## Implementation Shape

- Create a shared 10bit shell and component styling in `apps/web`.
- Keep the legacy document synchronized into `apps/web/public/legacy/index.html`.
- Build a shared native race scene for practice and bot modes with slower, more controllable steering than the legacy prototype.
- Add a web socket client layer for the lobby route so create/join/ready flows become real.
- Keep live race route ready to attach to server race events, even if the first pass focuses on lobby and race presentation.

## Success Criteria

- Legacy home remains intact.
- Hub is 10bit-styled and includes the already existing games.
- Practice and bot race are real native routes, not placeholders.
- Lobby route is functional against the current server lobby service.
- Web tests and monorepo build remain green.
