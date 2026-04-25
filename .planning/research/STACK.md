# Project Research: Stack

## Context

This is a brownfield realtime browser game. The current stack already matches the product needs:

- React + Vite for the frontend
- Express + Socket.IO for realtime sessions
- TypeScript shared contracts in `@blitz/shared`
- Node test runner and Vitest for verification
- Canvas rendering for race scenes

## Recommendation

Keep the current stack for v1 gameplay rebuild.

| Area | Choice | Confidence | Rationale |
|------|--------|------------|-----------|
| Frontend | React + Vite | High | Existing route/hook/test setup is already working. |
| Realtime | Socket.IO | High | Lobby/session architecture already depends on Socket.IO and supports rooms. |
| Shared contracts | `@blitz/shared` | High | Keeps input/snapshot/result payloads synchronized across client and server. |
| Rendering | Canvas 2D for gameplay, React for HUD/controls | High | Enough for arcade 2D racing and easier than introducing a game engine mid-project. |
| Physics/rules | Small deterministic reducers/helpers per mode | High | Existing large runtime files are hard to modify safely; pure helpers improve tests. |
| Mobile controls | Pointer events with keyboard fallback | High | One input model can cover touch, mouse, stylus, and later keyboard parity. |

## What Not To Use Yet

- Full game engine such as Phaser: useful later, but heavy for a brownfield focused rebuild.
- Three.js/WebGL: unnecessary for 2D arcade racing and harder to test.
- Native mobile wrappers: not needed before the browser controls are proven.
- Database/Redis for this milestone: gameplay validation does not require persistence.

## Implementation Notes

- Add new shared input/snapshot types before changing server runtimes.
- Keep server authoritative, but let the client render local control state immediately for responsiveness.
- Use fixed-step runtime updates where possible so acceleration, shift timing, obstacle collisions, and checkpoint progress are deterministic.
- Prefer one reusable fullscreen game shell with mode-specific HUD and controls.

## Risks

- Existing `useLiveRaceSocket()` is tailored to left/right/brake style controls and may need a more general game input hook.
- Race modules are currently large; adding mechanics directly into them risks regressions.
- Canvas rendering tied to socket snapshots can feel choppy if not separated from control feedback.
