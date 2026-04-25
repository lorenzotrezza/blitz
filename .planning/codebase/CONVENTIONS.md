# Coding Conventions

**Analysis Date:** 2026-04-25

## Naming Patterns

**Files:**
- Use PascalCase for React component and page modules: `apps/web/src/pages/LobbyPage.tsx`, `apps/web/src/components/RetroRaceView.tsx`, `apps/web/src/app/App.tsx`.
- Use camelCase for hooks, libraries, utilities, and server modules: `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/game/useRetroRace.ts`, `apps/server/src/lobby/service.ts`, `apps/server/src/socket/register.ts`.
- Use `.test.ts` and `.test.tsx` beside source files for unit and component tests: `apps/server/src/lobby/service.test.ts`, `apps/web/src/pages/LobbyPage.test.tsx`.
- Keep root smoke tests in plain JavaScript under `tests/`: `tests/tooling-smoke.test.js`, `tests/blitz-flow.test.js`, `tests/bootstrap-smoke.mjs`.

**Functions:**
- Use camelCase verbs for behavior and factories: `createLobbyService` in `apps/server/src/lobby/service.ts`, `registerSockets` in `apps/server/src/socket/register.ts`, `createAppRouter` in `apps/web/src/app/router.tsx`.
- Prefix React hooks with `use`: `useLobbySocket` in `apps/web/src/lib/useLobbySocket.ts`, `useGameSessionSocket` in `apps/web/src/lib/useGameSessionSocket.ts`, `useRetroRace` in `apps/web/src/game/useRetroRace.ts`.
- Use local helper functions for pure calculations and guards near the code that consumes them: `normalizeLobbyCode`, `assertLobbyWaiting`, and `assertHost` in `apps/server/src/lobby/service.ts`.

**Variables and Constants:**
- Use camelCase for local variables and state values: `requestedCode`, `isCreateRoute`, `joinedLobby`, `sessionStarted` in `apps/web/src/lib/useLobbySocket.ts`.
- Use SCREAMING_SNAKE_CASE for module-level constants and exported enum-like objects: `SOCKET_EVENTS` in `packages/shared/src/contracts.ts`, `LOBBY_RACE_MODES` in `packages/shared/src/lobby.ts`, `ACTIVE_LOBBY_STORAGE_KEY` in `apps/web/src/lib/useLobbySocket.ts`.
- Use explicit `is`/`can` boolean names: `isBusy`, `isConnected`, `isHost`, `canStartSession` in `apps/web/src/pages/LobbyPage.tsx`.

**Types:**
- Use PascalCase for interfaces and type aliases: `LobbySocketState` in `apps/web/src/lib/useLobbySocket.ts`, `LobbyService` in `apps/server/src/lobby/service.ts`, `GameSessionEnvelope` in `packages/shared/src/contracts.ts`.
- Use `Input`, `Payload`, `State`, and `Options` suffixes to clarify data roles: `CreateLobbyInput` in `apps/server/src/lobby/service.ts`, `SessionStartedPayload` in `packages/shared/src/contracts.ts`, `RegisterSocketOptions` in `apps/server/src/socket/register.ts`.
- Use `type`-only imports for compile-time contracts: `type LobbyState` in `apps/web/src/pages/LobbyPage.tsx`, `type ServerConfig` in `apps/server/src/socket/register.ts`.

## Code Style

**Formatting:**
- No Prettier, ESLint, or Biome configuration is present. Formatting is enforced by repository convention rather than a formatter config.
- Use 2-space indentation, semicolons, single quotes, and trailing commas in multiline literals and calls, as shown in `apps/web/src/lib/useLobbySocket.ts` and `apps/server/src/lobby/service.ts`.
- Prefer multiline formatting for object literals, function arguments, JSX props, and long conditions. Examples: `apps/web/src/pages/LobbyPage.tsx`, `apps/server/src/socket/register.ts`.

**Linting:**
- Lint scripts are TypeScript checks, not style linters:
  - Root `package.json`: `pnpm run lint`
  - `apps/web/package.json`: `tsc --noEmit -p tsconfig.json`
  - `apps/server/package.json`: `tsc --noEmit -p tsconfig.json`
  - `packages/shared/package.json`: `tsc --noEmit -p tsconfig.json`
- TypeScript strict mode is enabled in `tsconfig.base.json`; keep new code strict-compatible.
- `forceConsistentCasingInFileNames`, `resolveJsonModule`, `skipLibCheck`, `esModuleInterop`, and `allowSyntheticDefaultImports` are enabled in `tsconfig.base.json`.

## Import Organization

**Order:**
1. Node built-ins first: `node:assert/strict`, `node:http`, `node:crypto` in `apps/server/src/socket/register.test.ts` and `apps/server/src/socket/register.ts`.
2. Third-party packages next: `react`, `react-router-dom`, `socket.io`, `vitest`, `@testing-library/react`.
3. Workspace imports from `@blitz/shared` after external packages.
4. Relative imports last, using `.js` extensions in NodeNext server/shared code and extensionless imports in Vite web code.

**Path Aliases:**
- Use the workspace package import `@blitz/shared` for shared contracts from web and server code: `apps/web/src/lib/useLobbySocket.ts`, `apps/server/src/lobby/service.ts`.
- No `tsconfig` path aliases are configured in `tsconfig.base.json`, `apps/web/tsconfig.json`, `apps/server/tsconfig.json`, or `packages/shared/tsconfig.json`.

**Module Syntax:**
- All packages declare `"type": "module"` in `apps/web/package.json`, `apps/server/package.json`, and `packages/shared/package.json`.
- Server and shared relative TypeScript imports use `.js` specifiers for NodeNext output compatibility: `./store.js` in `apps/server/src/lobby/service.ts`, `./game.js` in `packages/shared/src/contracts.ts`.
- Web code uses Vite/Bundler-style extensionless relative imports: `../lib/useLobbySocket` in `apps/web/src/pages/LobbyPage.tsx`.

## TypeScript Patterns

**Strict Contracts:**
- Put cross-package contracts in `packages/shared/src/` and export them through `packages/shared/src/index.ts`.
- Model enum-like values as `as const` objects plus derived types. Example: `SOCKET_EVENTS` and `GameSessionStatus` in `packages/shared/src/contracts.ts`.
- Keep socket payloads typed end-to-end with `ClientToServerEvents` and `ServerToClientEvents` from `packages/shared/src/contracts.ts`.

**Nullability:**
- Use explicit `null` for absent runtime state: `LobbyState | null`, `PlayerInfo | null`, `SessionStartedPayload | null` in `apps/web/src/lib/useLobbySocket.ts`.
- Guard before side effects or dereferencing nullable state. Examples: `toggleReady`, `leave`, `selectGame`, and `startSession` in `apps/web/src/lib/useLobbySocket.ts`.

**Error Types:**
- Use dedicated error classes for domain errors. `LobbyServiceError` in `apps/server/src/lobby/service.ts` carries a stable `code` string and human message.
- Convert expected service errors into typed socket payloads near the transport boundary. `emitLobbyError` and `handleLobbyMutation` in `apps/server/src/socket/register.ts` are the pattern to follow.

## React and UI Patterns

**Components:**
- Use function components with named exports: `LobbyPage`, `LobbyIndexPage`, and `createAppRouter`.
- Keep route layout in `apps/web/src/app/router.tsx` and page-level UI under `apps/web/src/pages/`.
- Use semantic HTML where practical: forms in `apps/web/src/pages/LobbyPage.tsx`, route shell header/nav/main in `apps/web/src/app/router.tsx`, articles for lobby cards in `apps/web/src/pages/LobbyPage.tsx`.

**State Management:**
- Use React local state and custom hooks. No Redux, Zustand, TanStack Query, or global state library is present.
- Encapsulate socket state and mutations in hooks under `apps/web/src/lib/`: `useLobbySocket.ts`, `useGameSessionSocket.ts`, `useLiveRaceSocket.ts`, `usePostGameActions.ts`.
- Use `useMemo` to create/reuse socket instances, `useEffect` for subscriptions, `useState` for render state, and `useRef` for mutable timers/input state. Examples: `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/game/useRetroRace.ts`.
- Persist only selected browser state in `localStorage` behind helper functions: `readStoredActiveLobby` and `persistActiveLobby` in `apps/web/src/lib/useLobbySocket.ts`.

**Routing:**
- Define route objects in `buildRoutes` inside `apps/web/src/app/router.tsx`.
- Use `createMemoryRouter` for testable routes when `initialEntries` is provided; use `createBrowserRouter` for production.
- Use `navigate(..., { replace: true })` for automatic route replacement after lobby creation or session start in `apps/web/src/pages/LobbyPage.tsx`.

**Styling:**
- Global CSS lives in `apps/web/src/styles.css`; component-specific CSS modules are not used.
- Use CSS custom properties for theme colors and shared styling tokens: `--bg-1`, `--panel`, `--accent`, `--shadow` in `apps/web/src/styles.css`.
- Reuse class names such as `panel`, `card`, `button`, `button-primary`, `button-secondary`, `action-row`, and page-specific classes from JSX in `apps/web/src/pages/LobbyPage.tsx`.

## Server Patterns

**Services:**
- Keep domain mutations in service modules that accept injected dependencies for tests. `createLobbyService` accepts `store` and `generateLobbyCode` in `apps/server/src/lobby/service.ts`.
- Return immutable snapshots by copying objects and arrays rather than mutating existing state. Examples: `store.saveLobby({ ...lobby, players: [...] })` in `apps/server/src/lobby/service.ts`.
- Use in-memory stores behind interfaces for current persistence. `LobbyStore` and `createInMemoryLobbyStore` live in `apps/server/src/lobby/store.ts`.

**Socket Handlers:**
- Register socket events centrally in `apps/server/src/socket/register.ts`.
- Wrap mutation handlers with `handleLobbyMutation` so domain errors emit `SOCKET_EVENTS.server.lobbyError` instead of crashing the socket handler.
- Broadcast lobby snapshots with `emitLobbySnapshot` after successful mutations.

**Game Runtime:**
- Place shared game runtime types in `apps/server/src/games/runtime.ts`.
- Place game-specific runtimes under `apps/server/src/games/`: `apps/server/src/games/lights/runtime.ts`, `apps/server/src/games/penalty/runtime.ts`, `apps/server/src/games/race/dragSprint.ts`, `apps/server/src/games/race/sprintCircuit.ts`.
- Register playable games through `apps/server/src/games/registry.ts`.

## Logging

**Framework:** console

**Patterns:**
- Server startup logs to `console.log` and startup failure logs to `console.error` in `apps/server/src/index.ts`.
- No structured logger is configured.
- Avoid adding ad hoc browser `console` logging in web code; existing web source does not use console logging.

## Comments and Documentation

**When to Comment:**
- Code is mostly self-describing and uses few comments. Prefer clear helper/function names over explanatory comments.
- Add comments only for non-obvious runtime constraints or test harness behavior.

**JSDoc/TSDoc:**
- Not used as a common pattern. Public contracts are documented through TypeScript interfaces and tests rather than JSDoc.

## Function Design

**Size:**
- Prefer small pure helpers for reusable logic, but page components and socket registration can be larger when they coordinate UI or event handlers. Examples: `apps/web/src/pages/LobbyPage.tsx` and `apps/server/src/socket/register.ts`.
- Keep game physics and runtime rules isolated in pure functions where possible. Example: `advanceRaceState` in `apps/web/src/game/useRetroRace.ts`.

**Parameters:**
- Use object parameters for domain mutations and setup options: `CreateLobbyInput`, `JoinLobbyInput`, `RegisterSocketOptions`, and `CreateLobbyServiceOptions`.
- Use positional parameters for small local helpers only when the values are obvious: `normalizeLobbyCode(code)` in `apps/server/src/lobby/service.ts`.

**Return Values:**
- Return explicit state snapshots or `null` for absent state in services: `LobbyState | null` in `apps/server/src/lobby/service.ts`.
- Return structured hook state objects that include state and commands together: `LobbySocketState` in `apps/web/src/lib/useLobbySocket.ts`.

## Module Design

**Exports:**
- Prefer named exports. Examples: `createLobbyService`, `LobbyServiceError`, `registerSockets`, `createAppRouter`, `useLobbySocket`.
- Export shared constants and types from `packages/shared/src/index.ts` so consumers import from `@blitz/shared`.

**Barrel Files:**
- `packages/shared/src/index.ts` is the package barrel for shared contracts.
- No broad barrel files are used in `apps/web/src/` or `apps/server/src/`; import modules directly by relative path.

## Quality Gaps and Recommendations

**Formatting Enforcement:**
- Gap: No Prettier, ESLint, or Biome config is present.
- Impact: Style consistency depends on manual discipline.
- Recommendation: Add a formatter/linter only after choosing one standard; wire it into root `package.json` without weakening existing `tsc --noEmit` checks.

**Coverage Reporting:**
- Gap: Vitest and Node test scripts do not enforce or report coverage.
- Impact: New code can land without visibility into untested branches.
- Recommendation: Add coverage reporting for `apps/web` through Vitest and for Node tests through a Node-compatible coverage tool, then set thresholds only after measuring the current baseline.

**Generated Artifacts:**
- Gap: Test discovery shows compiled files under `apps/server/dist/`, while `.gitignore` ignores `dist/`.
- Impact: Generated tests can appear in local scans and confuse codebase mapping or ad hoc test discovery.
- Recommendation: Exclude `dist/` in repository search commands and avoid editing generated files.

**Large Runtime Files:**
- Gap: `apps/server/src/games/race/dragSprint.ts` is 827 lines and `apps/server/src/games/race/sprintCircuit.ts` is 492 lines.
- Impact: Rule changes in race runtimes have a larger review surface.
- Recommendation: Keep new race behavior covered by focused tests in the matching `.test.ts` file before refactoring runtime internals.

---

*Convention analysis: 2026-04-25*
