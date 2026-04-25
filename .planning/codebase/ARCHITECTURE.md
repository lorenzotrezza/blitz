# Architecture

**Analysis Date:** 2026-04-25

## Pattern Overview

**Overall:** pnpm workspace with a client/server/shared-contract architecture.

**Key Characteristics:**
- `apps/web` is a React 19 + Vite single-page app with route-level pages in `apps/web/src/pages/` and socket-aware hooks in `apps/web/src/lib/`.
- `apps/server` is an Express + Socket.IO process. Express exposes HTTP health only; Socket.IO owns lobby, realtime session, game input, and post-game control flow.
- `packages/shared` is the contract boundary. Both app packages import socket event names, payload types, lobby state, game state, and validation helpers from `@blitz/shared`.
- Server runtime state is in memory. Lobby state lives in `apps/server/src/lobby/store.ts`; active game runtimes live in `apps/server/src/games/manager.ts`.
- Game implementations use a registry/factory boundary. Add realtime games by implementing `GameRuntimeInstance` and registering them in `apps/server/src/games/registry.ts`.

## Layers

**Workspace Orchestration:**
- Purpose: Coordinate package scripts and build order.
- Location: `package.json`, `pnpm-workspace.yaml`
- Contains: Workspace package list, root `dev`, `build`, `test`, `lint`, and `verify:bootstrap` scripts.
- Depends on: `apps/web/package.json`, `apps/server/package.json`, `packages/shared/package.json`
- Used by: Local development, CI-style verification, root bootstrap tests in `tests/`.

**Shared Contracts:**
- Purpose: Define the stable typed API between browser and server.
- Location: `packages/shared/src/`
- Contains: Socket event names and payload maps in `packages/shared/src/contracts.ts`, lobby constants and helpers in `packages/shared/src/lobby.ts`, race/game state types in `packages/shared/src/game.ts`, public exports in `packages/shared/src/index.ts`.
- Depends on: TypeScript only.
- Used by: `apps/web/src/lib/socket.ts`, `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/lib/useGameSessionSocket.ts`, `apps/web/src/lib/useLiveRaceSocket.ts`, `apps/server/src/socket/register.ts`, `apps/server/src/lobby/service.ts`, and all server game runtimes.

**Web Shell and Routing:**
- Purpose: Mount the SPA and map URLs to pages.
- Location: `apps/web/src/main.tsx`, `apps/web/src/app/App.tsx`, `apps/web/src/app/router.tsx`
- Contains: React root mounting, `RouterProvider`, route tree, shared app layout, top navigation.
- Depends on: `react`, `react-dom`, `react-router-dom`, page modules in `apps/web/src/pages/`.
- Used by: Vite entrypoint `apps/web/index.html`.

**Web Realtime Client Layer:**
- Purpose: Own browser-side Socket.IO connection and convert events into React state/actions.
- Location: `apps/web/src/lib/`
- Contains: Singleton socket factory in `apps/web/src/lib/socket.ts`, lobby hook in `apps/web/src/lib/useLobbySocket.ts`, generic game session hook in `apps/web/src/lib/useGameSessionSocket.ts`, race-specific hook in `apps/web/src/lib/useLiveRaceSocket.ts`, post-game hook in `apps/web/src/lib/usePostGameActions.ts`, route resolver in `apps/web/src/lib/sessionRoutes.ts`.
- Depends on: `socket.io-client`, `@blitz/shared`, browser storage APIs.
- Used by: `apps/web/src/pages/LobbyPage.tsx`, `apps/web/src/pages/LightsSessionPage.tsx`, `apps/web/src/pages/PenaltySessionPage.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/pages/ResultsPage.tsx`.

**Web Pages and Presentation:**
- Purpose: Render route-specific UI and translate user gestures into hook actions.
- Location: `apps/web/src/pages/`, `apps/web/src/components/`, `apps/web/src/game/`, `apps/web/src/styles.css`
- Contains: Hub, mode selection, lobby, minigame, live session, race canvas, results, retro HUD, race drawing helpers.
- Depends on: React, router hooks, hooks in `apps/web/src/lib/`, shared types from `@blitz/shared`.
- Used by: Route tree in `apps/web/src/app/router.tsx`.

**Server HTTP Layer:**
- Purpose: Create the Express app and expose basic health checking.
- Location: `apps/server/src/app.ts`, `apps/server/src/http/health.ts`
- Contains: `createApp()`, Express `x-powered-by` disablement, `GET /health`.
- Depends on: `express`.
- Used by: HTTP server factory in `apps/server/src/index.ts`.

**Server Socket Gateway:**
- Purpose: Bind Socket.IO event handlers to lobby mutations, game startup, game input, disconnection cleanup, and post-game actions.
- Location: `apps/server/src/socket/register.ts`
- Contains: `registerSockets()`, typed `BlitzSocketServer`, event handlers for `SOCKET_EVENTS.client.*`, room broadcasting helpers, lobby error emission.
- Depends on: `socket.io`, `@blitz/shared`, `apps/server/src/lobby/service.ts`, `apps/server/src/games/manager.ts`, `apps/server/src/games/registry.ts`.
- Used by: `apps/server/src/index.ts`.

**Lobby Domain:**
- Purpose: Enforce lobby rules and own lobby persistence.
- Location: `apps/server/src/lobby/`
- Contains: Lobby code generation in `apps/server/src/lobby/code.ts`, business rules in `apps/server/src/lobby/service.ts`, in-memory cloned snapshots and player index in `apps/server/src/lobby/store.ts`.
- Depends on: Lobby types/constants from `@blitz/shared`.
- Used by: `apps/server/src/socket/register.ts`.

**Game Runtime Domain:**
- Purpose: Run active multiplayer sessions and emit state/results through callbacks.
- Location: `apps/server/src/games/`
- Contains: Runtime interface in `apps/server/src/games/runtime.ts`, registry in `apps/server/src/games/registry.ts`, active-session manager in `apps/server/src/games/manager.ts`, implementations in `apps/server/src/games/lights/runtime.ts`, `apps/server/src/games/penalty/runtime.ts`, `apps/server/src/games/race/sprintCircuit.ts`, `apps/server/src/games/race/dragSprint.ts`.
- Depends on: `@blitz/shared` contracts and lobby snapshots.
- Used by: Socket gateway in `apps/server/src/socket/register.ts`.

## Data Flow

**Application Boot:**

1. Browser loads `apps/web/index.html` and executes `apps/web/src/main.tsx`.
2. `apps/web/src/main.tsx` mounts `<App />` into `#app`.
3. `apps/web/src/app/App.tsx` creates a router from `apps/web/src/app/router.tsx`.
4. Route elements render pages from `apps/web/src/pages/`.

**Server Boot:**

1. `apps/server/src/index.ts` loads config with `loadConfig()` from `apps/server/src/config.ts`.
2. `createServer()` creates the Express app via `apps/server/src/app.ts`.
3. `createServer()` wraps the app in a Node HTTP server and attaches Socket.IO with `registerSockets()`.
4. `startServer()` listens on `config.port`; direct CLI execution logs the selected port or sets `process.exitCode = 1` on failure.

**Lobby Lifecycle:**

1. `apps/web/src/pages/LobbyPage.tsx` calls `useLobbySocket()` with the route lobby code.
2. `apps/web/src/lib/useLobbySocket.ts` connects the shared socket from `apps/web/src/lib/socket.ts`.
3. Browser actions emit events such as `client:create-lobby`, `client:join-lobby`, `client:set-ready`, `client:select-game`, and `client:update-lobby-settings`.
4. `apps/server/src/socket/register.ts` handles those events and delegates rule checks to `apps/server/src/lobby/service.ts`.
5. `apps/server/src/lobby/service.ts` reads/writes cloned lobby snapshots through `apps/server/src/lobby/store.ts`.
6. The socket gateway broadcasts the latest `LobbyState` to the lobby room with `server:lobby-updated`.
7. `apps/web/src/lib/useLobbySocket.ts` persists the active lobby in `localStorage` under `blitz-active-lobby` and updates page state.

**Session Start:**

1. Host clicks start in `apps/web/src/pages/LobbyPage.tsx`; `useLobbySocket().startSession()` emits `client:start-session`.
2. `apps/server/src/socket/register.ts` verifies host ownership, readiness, and startability with `isLobbySelectionStartable()` from `packages/shared/src/lobby.ts`.
3. The selected game and variant resolve through `createGameRuntimeRegistry()` in `apps/server/src/games/registry.ts`.
4. `LobbyService.setStatus()` moves the lobby to `LOBBY_STATUS.inSession`.
5. `apps/server/src/games/manager.ts` creates a session id, maps players to the active runtime, starts the runtime, and returns `SessionStartedPayload`.
6. Socket.IO emits `server:session-started`; `apps/web/src/lib/useLobbySocket.ts` receives it and `apps/web/src/pages/LobbyPage.tsx` navigates via `resolveSessionRoute()` in `apps/web/src/lib/sessionRoutes.ts`.

**Realtime Game Session:**

1. A session page such as `apps/web/src/pages/LightsSessionPage.tsx`, `apps/web/src/pages/PenaltySessionPage.tsx`, or `apps/web/src/pages/SprintCircuitPage.tsx` subscribes through `useGameSessionSocket()` or `useLiveRaceSocket()`.
2. Player inputs emit `client:game-input` through the shared socket.
3. `apps/server/src/socket/register.ts` passes the input and `socket.id` to `GameManager.applyInput()`.
4. `apps/server/src/games/manager.ts` resolves the player's session and calls the active runtime's `applyInput()`.
5. Runtime implementations update their in-memory state and invoke `onState()`.
6. `apps/server/src/socket/register.ts` broadcasts `server:session-state` to the lobby room.
7. The browser filters events by `sessionId` and renders current state.

**Session Finish and Post-Game:**

1. Runtime implementations call `onFinished()` with `SessionFinishedPayload`.
2. `apps/server/src/games/manager.ts` cleans runtime/session maps and forwards the payload.
3. `apps/server/src/socket/register.ts` sets the lobby status to `LOBBY_STATUS.results`, broadcasts `server:lobby-updated`, then emits `server:session-finished`.
4. Session pages store results in `sessionStorage` under `blitz-results:{sessionId}` and navigate to `/results/:sessionId`.
5. `apps/web/src/pages/ResultsPage.tsx` reads route state or session storage, then uses `usePostGameActions()` for host rematch/return/change-game actions.
6. `apps/server/src/socket/register.ts` handles `client:post-game-action`; rematch starts another session, while return/change-game moves the lobby back to waiting and emits `server:post-game-updated`.

**State Management:**
- Server state is authoritative for lobby state, game state, session results, and player identity via `socket.id`.
- Client state is derived from socket events, route state, `localStorage` (`blitz-active-lobby`), and `sessionStorage` (`blitz-results:{sessionId}`).
- No database or durable backend store is present; `apps/server/src/lobby/store.ts` and `apps/server/src/games/manager.ts` use process-local `Map` instances.

## Key Abstractions

**Shared Socket Contract:**
- Purpose: Keep event names and payload function signatures synchronized across server and web.
- Examples: `packages/shared/src/contracts.ts`, `apps/web/src/lib/socket.ts`, `apps/server/src/socket/register.ts`
- Pattern: `SOCKET_EVENTS` constants plus `ClientToServerEvents` and `ServerToClientEvents` mapped types.

**LobbyService:**
- Purpose: Encapsulate lobby mutation rules and hide persistence details from socket handlers.
- Examples: `apps/server/src/lobby/service.ts`, `apps/server/src/lobby/store.ts`
- Pattern: Factory function `createLobbyService()` with injectable `LobbyStore` and lobby code generator for tests.

**LobbyStore:**
- Purpose: Provide an in-memory snapshot store and reverse player-to-lobby index.
- Examples: `apps/server/src/lobby/store.ts`
- Pattern: Closure over `Map` objects, clone-on-read/write to prevent external mutation.

**GameRuntimeInstance:**
- Purpose: Standardize lifecycle for all realtime game engines.
- Examples: `apps/server/src/games/runtime.ts`, `apps/server/src/games/lights/runtime.ts`, `apps/server/src/games/penalty/runtime.ts`, `apps/server/src/games/race/sprintCircuit.ts`, `apps/server/src/games/race/dragSprint.ts`
- Pattern: Runtime object with `start()`, `applyInput()`, `removePlayer()`, and `dispose()` methods plus callback-based state/result emission.

**GameRuntimeRegistry:**
- Purpose: Resolve selected lobby game/variant into a runtime factory and countdown metadata.
- Examples: `apps/server/src/games/registry.ts`
- Pattern: Static registry array with `list()` and `resolve(game, variant)`.

**GameManager:**
- Purpose: Track active sessions, map player socket ids to runtime instances, and clean up finished or replaced sessions.
- Examples: `apps/server/src/games/manager.ts`
- Pattern: Factory with process-local `Map` indexes by session id, player id, and lobby code.

**Route-Specific Hooks:**
- Purpose: Keep socket wiring out of page components.
- Examples: `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/lib/useGameSessionSocket.ts`, `apps/web/src/lib/useLiveRaceSocket.ts`, `apps/web/src/lib/usePostGameActions.ts`
- Pattern: React hooks expose UI-ready state plus command functions that emit typed socket events.

## Entry Points

**Root Workspace Commands:**
- Location: `package.json`
- Triggers: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm run verify:bootstrap`
- Responsibilities: Run package-level development, build, typecheck/test, and bootstrap verification commands in the correct workspace order.

**Web App Entrypoint:**
- Location: `apps/web/src/main.tsx`
- Triggers: Vite loads `apps/web/index.html`.
- Responsibilities: Find `#app`, mount React StrictMode, import global styles from `apps/web/src/styles.css`, render `App`.

**Web Router Entrypoint:**
- Location: `apps/web/src/app/router.tsx`
- Triggers: `apps/web/src/app/App.tsx`
- Responsibilities: Define public landing route, shell-wrapped hub/lobby/session/results routes, and memory-router support for tests.

**Server Entrypoint:**
- Location: `apps/server/src/index.ts`
- Triggers: `tsx watch src/index.ts` in development, built JS in production, and server tests that import `createServer()`.
- Responsibilities: Load config, create Express/HTTP/Socket.IO runtime, start listening when executed as main module.

**HTTP Health Route:**
- Location: `apps/server/src/http/health.ts`
- Triggers: `GET /health`
- Responsibilities: Return `{ status: 'ok' }`.

**Socket Entrypoint:**
- Location: `apps/server/src/socket/register.ts`
- Triggers: Socket.IO `connection` event.
- Responsibilities: Register all client event handlers and broadcast lobby/session updates.

**Shared Package Entrypoint:**
- Location: `packages/shared/src/index.ts`
- Triggers: Imports from `@blitz/shared`.
- Responsibilities: Re-export `contracts.ts`, `game.ts`, and `lobby.ts` public API.

## Error Handling

**Strategy:** Domain errors are converted to socket error payloads at the gateway; unexpected server errors are allowed to surface.

**Patterns:**
- `apps/server/src/lobby/service.ts` throws `LobbyServiceError` with stable `code` and user-facing `message`.
- `apps/server/src/socket/register.ts` catches `LobbyServiceError` inside `handleLobbyMutation()` and emits `server:lobby-error` to the requesting socket.
- `apps/server/src/index.ts` catches startup failures in main-module execution, logs `Failed to start Blitz server`, and sets `process.exitCode = 1`.
- Web hooks keep socket/lobby errors in React state, for example `error` in `apps/web/src/lib/useLobbySocket.ts`.
- Runtime input handlers ignore irrelevant or invalid context, for example unknown player/session input in `apps/server/src/games/manager.ts` and session-id filtering in `apps/web/src/lib/useGameSessionSocket.ts`.

## Cross-Cutting Concerns

**Logging:** Minimal console logging exists in `apps/server/src/index.ts` for server startup and startup failure. No structured logger is present.

**Validation:** Shared startability validation lives in `packages/shared/src/lobby.ts`. Server-side domain validation lives in `apps/server/src/lobby/service.ts` and runtime input readers such as `readReactionAtMs()` in `apps/server/src/games/lights/runtime.ts`, `readKickChoice()` in `apps/server/src/games/penalty/runtime.ts`, and `readSteer()` in `apps/server/src/games/race/sprintCircuit.ts`.

**Authentication:** No external authentication is present. Socket identity is the Socket.IO `socket.id`; lobby host control checks compare `socket.id` to `LobbyState.hostId` in `apps/server/src/socket/register.ts` and `apps/server/src/lobby/service.ts`.

**Configuration:** Server configuration is read from `PORT` and `SOCKET_IO_CORS_ORIGIN` in `apps/server/src/config.ts`. Web socket URL resolution uses `VITE_SOCKET_URL`, browser origin, or `http://127.0.0.1:3004` in `apps/web/src/lib/socket.ts`. Vite proxies `/socket.io` websocket traffic to `http://127.0.0.1:3004` in `apps/web/vite.config.ts`.

**Persistence:** `apps/server/src/lobby/store.ts` and `apps/server/src/games/manager.ts` are in-memory only. Browser-side restoration uses `localStorage` in `apps/web/src/lib/useLobbySocket.ts` and `sessionStorage` in session/results pages.

**Testing Hooks:** Factory-style entry points accept injected dependencies for tests: `createServer(config)` in `apps/server/src/index.ts`, `registerSockets(server, config, options)` in `apps/server/src/socket/register.ts`, `createLobbyService(options)` in `apps/server/src/lobby/service.ts`, runtime options with injectable timers in `apps/server/src/games/*`.

---

*Architecture analysis: 2026-04-25*
