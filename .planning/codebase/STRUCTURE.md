# Codebase Structure

**Analysis Date:** 2026-04-25

## Directory Layout

```text
blitz/
├── apps/
│   ├── server/              # Express + Socket.IO backend package
│   │   ├── src/
│   │   │   ├── games/       # Realtime game runtime manager, registry, and implementations
│   │   │   ├── http/        # Express HTTP routes
│   │   │   ├── lobby/       # Lobby domain service, code generation, in-memory store
│   │   │   ├── socket/      # Socket.IO gateway and event handlers
│   │   │   ├── app.ts       # Express app factory
│   │   │   ├── config.ts    # Server env config loader
│   │   │   └── index.ts     # Server runtime factory and process entrypoint
│   │   ├── package.json     # @blitz/server scripts and dependencies
│   │   └── tsconfig.json    # Server TypeScript config
│   └── web/                 # React + Vite browser app package
│       ├── public/          # Static browser assets, including legacy HTML
│       ├── src/
│       │   ├── app/         # App shell and router
│       │   ├── components/  # Shared UI components
│       │   ├── game/        # Client-side race drawing/data helpers
│       │   ├── legacy/      # Legacy document utilities/tests
│       │   ├── lib/         # Socket client, hooks, route helpers
│       │   ├── pages/       # Route-level React pages
│       │   ├── main.tsx     # Browser app entrypoint
│       │   └── styles.css   # Global app styling
│       ├── index.html       # Vite HTML entrypoint
│       ├── package.json     # @blitz/web scripts and dependencies
│       ├── tsconfig.json    # Web TypeScript config
│       └── vite.config.ts   # Vite, React plugin, test, and socket proxy config
├── packages/
│   └── shared/              # TypeScript contract package imported as @blitz/shared
│       ├── scripts/         # Shared build script
│       ├── src/
│       │   ├── contracts.ts # Socket events and payload types
│       │   ├── game.ts      # Game/race state types and constants
│       │   ├── index.ts     # Public package exports
│       │   └── lobby.ts     # Lobby state types, constants, startability helper
│       ├── package.json     # @blitz/shared scripts and package exports
│       ├── tsconfig.json    # Shared dev/test TypeScript config
│       └── tsconfig.build.json # Shared build TypeScript config
├── tests/                   # Root-level bootstrap and flow smoke tests
├── docs/plans/              # Planning and implementation notes
├── package.json             # Workspace scripts
├── pnpm-workspace.yaml      # Workspace package discovery
├── pnpm-lock.yaml           # pnpm lockfile
├── package-lock.json        # npm lockfile present at root
└── tsconfig.base.json       # Shared TypeScript compiler baseline
```

## Directory Purposes

**`apps/web`:**
- Purpose: Browser-facing game and lobby UI.
- Contains: Vite config, React app, route pages, socket hooks, canvas/game helpers, global styles, static assets.
- Key files: `apps/web/src/main.tsx`, `apps/web/src/app/router.tsx`, `apps/web/src/lib/socket.ts`, `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/pages/LobbyPage.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`.

**`apps/web/src/app`:**
- Purpose: Application composition and route definition.
- Contains: `App` component and route builder.
- Key files: `apps/web/src/app/App.tsx`, `apps/web/src/app/router.tsx`.

**`apps/web/src/pages`:**
- Purpose: Route-level UI screens.
- Contains: Landing, hub, mode selection, lobby, minigame, live session, race, and results pages.
- Key files: `apps/web/src/pages/LobbyPage.tsx`, `apps/web/src/pages/LightsSessionPage.tsx`, `apps/web/src/pages/PenaltySessionPage.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/pages/ResultsPage.tsx`.

**`apps/web/src/lib`:**
- Purpose: Client-side integration layer and reusable hooks.
- Contains: Shared Socket.IO client, socket-backed React hooks, post-game actions, session route resolver.
- Key files: `apps/web/src/lib/socket.ts`, `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/lib/useGameSessionSocket.ts`, `apps/web/src/lib/useLiveRaceSocket.ts`, `apps/web/src/lib/usePostGameActions.ts`, `apps/web/src/lib/sessionRoutes.ts`.

**`apps/web/src/components`:**
- Purpose: Reusable presentation components that are not route owners.
- Contains: Legacy game frame, retro HUD, race view components.
- Key files: `apps/web/src/components/LegacyGameFrame.tsx`, `apps/web/src/components/RetroHud.tsx`, `apps/web/src/components/RetroRaceView.tsx`.

**`apps/web/src/game`:**
- Purpose: Browser-only game display/data helpers.
- Contains: Race data, sprint circuit track drawing, retro race hook.
- Key files: `apps/web/src/game/raceData.ts`, `apps/web/src/game/sprintCircuitTrack.ts`, `apps/web/src/game/useRetroRace.ts`.

**`apps/server`:**
- Purpose: Backend HTTP/socket process and authoritative realtime state.
- Contains: Express app factory, config loader, Socket.IO gateway, lobby domain, game runtime domain.
- Key files: `apps/server/src/index.ts`, `apps/server/src/app.ts`, `apps/server/src/socket/register.ts`, `apps/server/src/lobby/service.ts`, `apps/server/src/games/manager.ts`, `apps/server/src/games/registry.ts`.

**`apps/server/src/socket`:**
- Purpose: All Socket.IO event binding and room broadcasts.
- Contains: `registerSockets()` and typed socket aliases.
- Key files: `apps/server/src/socket/register.ts`.

**`apps/server/src/lobby`:**
- Purpose: Lobby rules, lobby code generation, and storage abstraction.
- Contains: `LobbyService`, `LobbyStore`, code generator.
- Key files: `apps/server/src/lobby/service.ts`, `apps/server/src/lobby/store.ts`, `apps/server/src/lobby/code.ts`.

**`apps/server/src/games`:**
- Purpose: Realtime game session orchestration and runtime implementations.
- Contains: Runtime interface, active session manager, registry, lights/penalty/race engines.
- Key files: `apps/server/src/games/runtime.ts`, `apps/server/src/games/manager.ts`, `apps/server/src/games/registry.ts`, `apps/server/src/games/lights/runtime.ts`, `apps/server/src/games/penalty/runtime.ts`, `apps/server/src/games/race/sprintCircuit.ts`, `apps/server/src/games/race/dragSprint.ts`.

**`apps/server/src/http`:**
- Purpose: HTTP routes outside Socket.IO.
- Contains: Health endpoint registration.
- Key files: `apps/server/src/http/health.ts`.

**`packages/shared`:**
- Purpose: Workspace package for cross-app contracts and domain constants.
- Contains: Socket contracts, lobby models, game/race models, package build script.
- Key files: `packages/shared/src/contracts.ts`, `packages/shared/src/lobby.ts`, `packages/shared/src/game.ts`, `packages/shared/src/index.ts`, `packages/shared/scripts/build.mjs`.

**`tests`:**
- Purpose: Root-level smoke and cross-package verification tests.
- Contains: Bootstrap smoke, tooling smoke, flow tests.
- Key files: `tests/bootstrap-smoke.mjs`, `tests/tooling-smoke.test.js`, `tests/blitz-flow.test.js`.

**`docs/plans`:**
- Purpose: Human-readable design and implementation notes.
- Contains: Dated plan and TDD log Markdown files.
- Key files: `docs/plans/2026-04-25-blitz-party-arcade-design.md`, `docs/plans/2026-04-25-blitz-party-arcade-implementation.md`.

## Key File Locations

**Entry Points:**
- `apps/web/src/main.tsx`: React DOM entrypoint for the browser app.
- `apps/web/src/app/App.tsx`: Creates and renders the router provider.
- `apps/web/src/app/router.tsx`: Defines browser routes and test memory router support.
- `apps/server/src/index.ts`: Server runtime factory and executable entrypoint.
- `packages/shared/src/index.ts`: Public exports for `@blitz/shared`.

**Configuration:**
- `package.json`: Root workspace scripts and workspace package list.
- `pnpm-workspace.yaml`: pnpm workspace package matching.
- `tsconfig.base.json`: Shared TypeScript compiler baseline.
- `apps/web/vite.config.ts`: Vite React plugin, jsdom test environment, `/socket.io` proxy to `http://127.0.0.1:3004`.
- `apps/web/tsconfig.json`: Web package TypeScript configuration.
- `apps/server/tsconfig.json`: Server package TypeScript configuration.
- `packages/shared/tsconfig.json`: Shared package dev/test TypeScript configuration.
- `packages/shared/tsconfig.build.json`: Shared package build TypeScript configuration.
- `apps/server/src/config.ts`: Runtime `PORT` and `SOCKET_IO_CORS_ORIGIN` parsing.
- `apps/web/src/lib/socket.ts`: Browser socket URL resolution with `VITE_SOCKET_URL`.

**Core Logic:**
- `packages/shared/src/contracts.ts`: Socket event names and typed client/server event maps.
- `packages/shared/src/lobby.ts`: Lobby constants, lobby state, game selection rules.
- `packages/shared/src/game.ts`: Race/session state types.
- `apps/server/src/socket/register.ts`: Main server-side control-flow gateway.
- `apps/server/src/lobby/service.ts`: Lobby business rules.
- `apps/server/src/lobby/store.ts`: In-memory lobby persistence.
- `apps/server/src/games/manager.ts`: Active session indexing and lifecycle cleanup.
- `apps/server/src/games/registry.ts`: Runtime resolution for selected games.
- `apps/server/src/games/runtime.ts`: Runtime interface for game implementations.
- `apps/web/src/lib/useLobbySocket.ts`: Browser lobby state/action facade.
- `apps/web/src/lib/useGameSessionSocket.ts`: Generic session socket facade.
- `apps/web/src/lib/useLiveRaceSocket.ts`: Race-specific socket/input facade.
- `apps/web/src/lib/usePostGameActions.ts`: Results/rematch/change-game socket facade.

**Testing:**
- `apps/server/src/*.test.ts`, `apps/server/src/**/*.test.ts`: Server unit/integration tests co-located with modules.
- `apps/web/src/**/*.test.tsx`, `apps/web/src/**/*.test.ts`: Web tests co-located with modules.
- `packages/shared/src/contracts.test.ts`: Shared contract tests.
- `tests/*.test.js`, `tests/*.mjs`: Root smoke tests.

## Naming Conventions

**Files:**
- React route pages use PascalCase with `Page` suffix: `apps/web/src/pages/LobbyPage.tsx`, `apps/web/src/pages/ResultsPage.tsx`.
- React components use PascalCase: `apps/web/src/components/RetroHud.tsx`, `apps/web/src/components/LegacyGameFrame.tsx`.
- React hooks use `use` prefix and camelCase filenames: `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/game/useRetroRace.ts`.
- Server domain modules use lower camelCase or concise noun filenames: `apps/server/src/lobby/service.ts`, `apps/server/src/games/manager.ts`, `apps/server/src/games/race/dragSprint.ts`.
- Tests are co-located with `.test.ts` or `.test.tsx`: `apps/server/src/lobby/service.test.ts`, `apps/web/src/app/router.test.tsx`.

**Directories:**
- Workspace packages live under plural package containers: `apps/web`, `apps/server`, `packages/shared`.
- Server domains use noun directories: `apps/server/src/lobby`, `apps/server/src/socket`, `apps/server/src/games`, `apps/server/src/http`.
- Web UI code separates route pages from reusable components: `apps/web/src/pages`, `apps/web/src/components`.
- Game-specific server runtimes nest under game categories where useful: `apps/server/src/games/lights`, `apps/server/src/games/penalty`, `apps/server/src/games/race`.

## Where to Add New Code

**New Socket Event or Payload:**
- Contract: `packages/shared/src/contracts.ts`
- Server handler: `apps/server/src/socket/register.ts`
- Web emitter/listener hook: `apps/web/src/lib/`
- Tests: Add/update shared contract tests in `packages/shared/src/contracts.test.ts`, server socket tests in `apps/server/src/socket/register.test.ts`, and web hook/page tests near the consuming hook or page.

**New Lobby Rule or Field:**
- Shared type/constant: `packages/shared/src/lobby.ts`
- Server validation/mutation: `apps/server/src/lobby/service.ts`
- Store support if indexing changes: `apps/server/src/lobby/store.ts`
- Web controls: `apps/web/src/pages/LobbyPage.tsx` or a new extracted component under `apps/web/src/components/`
- Tests: `apps/server/src/lobby/service.test.ts` plus web tests for visible behavior.

**New Realtime Game:**
- Shared game types: `packages/shared/src/game.ts` and/or `packages/shared/src/contracts.ts`
- Runtime implementation: Create a directory/file under `apps/server/src/games/`, following `apps/server/src/games/lights/runtime.ts` or `apps/server/src/games/race/sprintCircuit.ts`.
- Runtime registration: Add an entry to `DEFAULT_GAME_REGISTRY` in `apps/server/src/games/registry.ts`.
- Session route mapping: Update `apps/web/src/lib/sessionRoutes.ts`.
- Page: Add a route-level page under `apps/web/src/pages/` and add the route in `apps/web/src/app/router.tsx`.
- Hook reuse: Use `apps/web/src/lib/useGameSessionSocket.ts` for generic state/input or add a specific hook under `apps/web/src/lib/` if the game needs continuous input handling like `apps/web/src/lib/useLiveRaceSocket.ts`.
- Tests: Add runtime tests beside the runtime file and page/hook tests beside the web files.

**New Web Page:**
- Primary code: `apps/web/src/pages/`
- Route registration: `apps/web/src/app/router.tsx`
- Shared visual component extraction: `apps/web/src/components/`
- Socket/data hook extraction: `apps/web/src/lib/`
- Tests: Co-locate as `apps/web/src/pages/NewPage.test.tsx` or near extracted hooks/components.

**New Server HTTP Endpoint:**
- Route module: `apps/server/src/http/`
- Registration: `apps/server/src/app.ts`
- Tests: Co-locate under `apps/server/src/http/` or extend `apps/server/src/server.test.ts`.

**New Server Domain Service:**
- Primary code: Add a domain directory under `apps/server/src/` only when it owns rules/state separate from existing `lobby` or `games`.
- Gateway wiring: Keep Socket.IO-specific code in `apps/server/src/socket/register.ts`.
- Shared contracts: Put cross-package request/response/event types in `packages/shared/src/`.

**New Shared Contract:**
- Primary code: `packages/shared/src/`
- Public export: `packages/shared/src/index.ts`
- Build behavior: `packages/shared/scripts/build.mjs`
- Tests: `packages/shared/src/*.test.ts`

**Utilities:**
- Browser-only helpers: `apps/web/src/lib/` or `apps/web/src/game/` depending on whether the helper is integration-related or game-rendering-related.
- Server-only helpers: The owning domain under `apps/server/src/`.
- Cross-package constants/types: `packages/shared/src/`.

## Package Responsibilities

**`@blitz/web`:**
- Package path: `apps/web/package.json`
- Responsibilities: Render UI, manage browser socket connection, store local recovery state, route users between lobby/session/results screens.
- External dependencies: `react`, `react-dom`, `react-router-dom`, `socket.io-client`, `@blitz/shared`.
- Build/test command locations: `apps/web/package.json`.

**`@blitz/server`:**
- Package path: `apps/server/package.json`
- Responsibilities: Serve health checks, accept Socket.IO connections, own lobby/session state, validate lobby/game actions, run game runtimes, broadcast state/results.
- External dependencies: `express`, `socket.io`, `@blitz/shared`.
- Build/test command locations: `apps/server/package.json`.

**`@blitz/shared`:**
- Package path: `packages/shared/package.json`
- Responsibilities: Publish contracts and domain types consumed by both web and server.
- External dependencies: None at runtime.
- Build/test command locations: `packages/shared/package.json`.

## Special Directories

**`apps/*/dist` and `packages/shared/dist`:**
- Purpose: Build outputs for workspace packages.
- Generated: Yes.
- Committed: Present in working tree; treat as generated output unless repository policy says otherwise.

**`apps/*/node_modules` and `packages/shared/node_modules`:**
- Purpose: Package dependency installs.
- Generated: Yes.
- Committed: No.

**`apps/web/public/legacy`:**
- Purpose: Static legacy HTML asset served by Vite.
- Generated: No.
- Committed: Yes.

**`docs/plans`:**
- Purpose: Planning history and implementation notes.
- Generated: No.
- Committed: Yes.

**`.planning/codebase`:**
- Purpose: GSD codebase intelligence documents for future planning/execution.
- Generated: Yes.
- Committed: Project-dependent.

---

*Structure analysis: 2026-04-25*
