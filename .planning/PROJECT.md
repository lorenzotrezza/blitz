# Blitz Playable Minigames

## What This Is

Blitz is a browser party arcade built with React, Express, Socket.IO, and shared TypeScript contracts. The current app has lobbies, realtime sessions, results, and several race/minigame routes, but the next project goal is to rebuild the minigames into things that are actually played by the user instead of feeling like they run by themselves.

The focus is the race catalog: replace near-duplicate race variants with distinct, mobile-friendly game experiences that have different maps, different controls, and meaningful moment-to-moment decisions.

## Core Value

Every minigame must feel manually playable on a phone: the player should win or lose because of timing, steering, gear changes, obstacle avoidance, and control skill, not because the simulation mostly plays itself.

## Requirements

### Validated

- ✓ Realtime lobby flow exists — users can create/join lobbies, ready up, select games, start sessions, and see results.
- ✓ Shared client/server contracts exist — `@blitz/shared` defines lobby, socket, and game payload types.
- ✓ Socket.IO session runtime exists — server runtimes can receive inputs and broadcast session state.
- ✓ Race runtime registry exists — race variants can be registered through `apps/server/src/games/registry.ts`.
- ✓ Mobile web deployment path exists — Express serves health/static assets and the app is prepared for free Render hosting.

### Active

- [ ] Rebuild drag race as a straight-line gear/timing game: accelerate, shift at the right moment, and gain/lose speed based on timing.
- [ ] Rebuild straight obstacle race as a lane/position game where the player actively avoids obstacles that slow the car when hit.
- [ ] Add a circular track race controlled with an analog-style touch pad.
- [ ] Add a figure-eight track race controlled with the same analog-style touch pad and clear crossing/intersection handling.
- [ ] Redesign gameplay screens as fullscreen mobile-first game surfaces with controls placed for thumb comfort.
- [ ] Make race variants visually and mechanically distinct in lobby selection, runtime state, HUD, and results.
- [ ] Keep multiplayer/session architecture compatible with the existing lobby and result flow.

### Out of Scope

- Native mobile app — the project remains browser-first and must work on phone browsers.
- Persistent accounts, stats, or leaderboards — not needed to validate playable mechanics.
- Database-backed lobbies — in-memory sessions are acceptable for this milestone.
- Advanced car tuning or simulation-grade physics — the goal is fun arcade feel, not a realistic simulator.
- New non-race minigames — this milestone focuses on making the race set genuinely playable.

## Context

The repository is a pnpm workspace:

- `apps/web`: React 19 + Vite SPA with route pages and Socket.IO hooks.
- `apps/server`: Express + Socket.IO process with in-memory lobby/session runtime.
- `packages/shared`: shared contracts for socket events, lobby state, and game snapshots.

Existing race code has two main server runtime files:

- `apps/server/src/games/race/dragSprint.ts`
- `apps/server/src/games/race/sprintCircuit.ts`

The current race UX problem is product-level, not only technical: variants are too similar, maps do not communicate different challenges, and controls do not make the user feel responsible for the outcome. The next milestone must therefore plan game feel, input design, screen layout, and runtime contracts together.

Important codebase concerns that shape this project:

- Race runtime modules are large and stateful, so new mechanics should be split into smaller rule/reducer helpers where practical.
- Socket state is authoritative on the server; client controls should emit compact input intents.
- Mobile controls need keyboard parity later, but touch comfort is the primary gameplay constraint for this milestone.
- Canvas-only gameplay needs HUD/readable state outside the canvas for usability and testability.

## Constraints

- **Tech stack**: Keep React, Vite, Express, Socket.IO, TypeScript, and `@blitz/shared` — the current architecture already supports realtime sessions.
- **Hosting cost**: Free-tier hosting is preferred; avoid requiring paid infrastructure for this milestone.
- **Mobile UX**: Gameplay must be comfortable on phone screens first, with fullscreen game screens and thumb-friendly controls.
- **Realtime architecture**: Server remains authoritative for multiplayer state; client input should not decide final outcomes alone.
- **Scope**: Four race experiences are the target: drag gear timing, straight obstacle dodge, circular analog track, figure-eight analog track.
- **Testing**: Each new mechanic needs deterministic rule tests and at least route/component coverage for controls and HUD.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat this as a brownfield project | The lobby, session, socket, result, and deployment foundations already exist. | ✓ Good |
| Keep the current stack and runtime registry | Rebuilding infrastructure would delay the gameplay work that matters most. | — Pending |
| Make input design part of Phase 1 | Bad control placement will make every later mechanic feel wrong on phones. | — Pending |
| Build drag race separately from obstacle straight race | They share a straight map shape but have different skill loops: timing vs avoidance. | — Pending |
| Use an analog-style pad for circular and figure-eight tracks | The user explicitly asked for analog movement and those maps need directional control, not only left/right buttons. | — Pending |
| Defer persistence and leaderboards | They do not solve the current “not playable” problem. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-25 after initialization*
