# Research Summary

## Stack

Keep the current React/Vite + Express/Socket.IO + shared TypeScript contract stack. It already supports lobbies, realtime sessions, and results; the main missing piece is better gameplay architecture and mobile-first control design.

## Table Stakes

- Fullscreen mobile gameplay surface.
- Thumb-friendly controls with no page scrolling.
- Distinct game objectives and controls per race variant.
- Server-authoritative runtime with deterministic rule tests.
- Clear HUD explaining objective, progress, penalties, and results.
- Shared contracts that make each input/snapshot mode explicit.

## Watch Out For

- Do not add another race variant that only changes labels.
- Do not let drag race become hold-to-win.
- Do not place controls below the screen where mobile players have to hunt for them.
- Do not bury all mechanics inside one large runtime file.
- Do not ship analog tracks without clear checkpoint/direction feedback.

## Recommended Build Sequence

1. Fullscreen game shell and input control foundation.
2. Drag Gear Race.
3. Straight Obstacle Race.
4. Circular Analog Race.
5. Figure-Eight Analog Race.
6. Lobby/results integration polish and cleanup.
