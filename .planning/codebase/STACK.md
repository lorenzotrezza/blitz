# Technology Stack

**Analysis Date:** 2026-04-25

## Languages

**Primary:**
- TypeScript - Used across `apps/server/src/`, `apps/web/src/`, and `packages/shared/src/`.
- JavaScript - Used for repository smoke tests in `tests/*.test.js` and the shared build script at `packages/shared/scripts/build.mjs`.

**Secondary:**
- TSX - Used for React UI components and page tests in `apps/web/src/**/*.tsx`.
- Markdown - Planning and implementation notes live in `docs/plans/*.md`.

## Runtime

**Environment:**
- Node.js - Server runtime for `apps/server/src/index.ts`, test runner for `node --test`, and build runtime for `packages/shared/scripts/build.mjs`.
- Browser - Client runtime for the Vite React app in `apps/web/src/main.tsx`.
- Node version: Not pinned. `@types/node` is declared as `^20.17.6` in `apps/server/package.json` and `packages/shared/package.json`, and the lockfile resolves it to `20.19.39` in `pnpm-lock.yaml`.

**Package Manager:**
- Primary: pnpm workspace, evidenced by `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and root scripts in `package.json` that invoke `pnpm --filter`.
- Secondary lockfile: `package-lock.json` is also present. Treat pnpm as canonical unless the team explicitly standardizes on npm.
- Lockfile: `pnpm-lock.yaml` present with lockfile version `9.0`.

## Workspace Layout

**Apps:**
- `apps/web` (`@blitz/web`) - Vite, React 19, React Router 7, Socket.IO client.
- `apps/server` (`@blitz/server`) - Node HTTP server, Express 5 health route, Socket.IO realtime server.

**Packages:**
- `packages/shared` (`@blitz/shared`) - Shared TypeScript contracts, lobby/game types, and Socket.IO event names exported through `packages/shared/src/index.ts`.

## Scripts

**Root scripts in `package.json`:**
- `pnpm run dev` - Runs `@blitz/server` and `@blitz/web` dev servers in parallel.
- `pnpm run build` - Builds `@blitz/shared`, then `@blitz/server`, then `@blitz/web`.
- `pnpm run lint` - Builds shared package, then runs TypeScript no-emit checks in all workspace packages.
- `pnpm test` - Runs all workspace tests and root `node --test tests/*.test.js`.
- `pnpm run verify:bootstrap` - Runs lint, build, then `node tests/bootstrap-smoke.mjs`.

**Package scripts:**
- `apps/server/package.json`: `dev` uses `tsx watch src/index.ts`; `build` uses `tsc -p tsconfig.json`; `test` runs `tsc --noEmit` and Node's test runner with `tsx`.
- `apps/web/package.json`: `dev` uses `vite`; `build` uses `vite build`; `test` uses `vitest run`; `lint` uses `tsc --noEmit`.
- `packages/shared/package.json`: `build` uses `node ./scripts/build.mjs`; `test` runs `tsc --noEmit` and `node --import tsx --test src/contracts.test.ts`.

## Frameworks

**Core:**
- React `^19.2.0` - Frontend UI in `apps/web/src/`.
- React DOM `^19.2.0` - Browser rendering from `apps/web/src/main.tsx`.
- React Router DOM `^7.9.4` - Client routing in `apps/web/src/app/router.tsx`.
- Express `^5.2.1` - HTTP app and health route in `apps/server/src/app.ts` and `apps/server/src/http/health.ts`.
- Socket.IO `^4.8.3` - Realtime backend in `apps/server/src/socket/register.ts`.
- Socket.IO Client `^4.8.3` - Browser realtime client in `apps/web/src/lib/socket.ts`.

**Testing:**
- Node built-in test runner - Server and shared tests use `node:test` in `apps/server/src/**/*.test.ts`, `packages/shared/src/contracts.test.ts`, and `tests/*.test.js`.
- Vitest `^3.2.4` - Web tests in `apps/web/src/**/*.test.tsx` and `apps/web/src/**/*.test.ts`.
- Testing Library React `^16.3.0` and `@testing-library/jest-dom` `^6.9.1` - React component and route tests in `apps/web/src/`.
- jsdom `^26.1.0` - Vitest browser-like environment configured in `apps/web/vite.config.ts`.
- node-mocks-http `^1.17.2` - Server HTTP test helpers in `apps/server/src/server.test.ts`.

**Build/Dev:**
- TypeScript `^5.6.3` - Type checking and package builds via `tsc`.
- Vite `^5.4.11` - Web app development and production build in `apps/web`.
- `@vitejs/plugin-react` `^5.1.0` - React transform plugin in `apps/web/vite.config.ts`.
- tsx `^4.19.2` - TypeScript execution for server dev and Node tests.
- concurrently `^8.2.2` - Declared in root `package.json`, though the root `dev` script currently uses pnpm parallel filtering instead.

## Key Dependencies

**Critical:**
- `@blitz/shared` (`workspace:*`) - Shared contracts consumed by both `apps/server` and `apps/web`; Socket.IO event names and payload types are defined in `packages/shared/src/contracts.ts`.
- `socket.io` / `socket.io-client` - Core realtime transport for lobby creation, joining, game inputs, session state, and post-game actions.
- `express` - Hosts the server HTTP surface and `/health` route.
- `react`, `react-dom`, `react-router-dom` - Core frontend app and route system.

**Infrastructure:**
- `vite` - Web dev server and static bundle generator.
- `typescript` - Main compile and lint gate across all packages.
- `tsx` - Runtime bridge for TypeScript tests and watched server development.

## Configuration

**Environment:**
- Server config is loaded in `apps/server/src/config.ts`.
- `PORT` controls the HTTP server port and defaults to `3004`.
- `SOCKET_IO_CORS_ORIGIN` controls Socket.IO CORS origin and defaults to `*`.
- `VITE_SOCKET_URL` optionally overrides the browser Socket.IO URL in `apps/web/src/lib/socket.ts`.
- No `.env` files detected in the repository scan.

**Build:**
- Shared TypeScript base config: `tsconfig.base.json`.
- Server TypeScript config: `apps/server/tsconfig.json` using `module: NodeNext`, `moduleResolution: NodeNext`, `outDir: dist`, and `rootDir: src`.
- Web TypeScript config: `apps/web/tsconfig.json` using `jsx: react-jsx`, `module: ESNext`, and `moduleResolution: Bundler`.
- Shared package TypeScript config: `packages/shared/tsconfig.json` with declarations and `outDir: dist`.
- Vite and Vitest config: `apps/web/vite.config.ts`.

## Runtime Behavior

**Server:**
- `apps/server/src/index.ts` creates an Express app, wraps it in a Node HTTP server, registers Socket.IO, and listens on configured `PORT`.
- `apps/server/src/http/health.ts` exposes `GET /health` returning JSON `{ status: 'ok' }`.
- `apps/server/src/lobby/store.ts` provides in-memory lobby state using `Map`.
- `apps/server/src/socket/register.ts` handles Socket.IO room membership, lobby mutations, session starts, game inputs, disconnects, and post-game actions.

**Web:**
- `apps/web/src/main.tsx` mounts the React app.
- `apps/web/src/app/router.tsx` defines browser and memory routers.
- `apps/web/src/lib/socket.ts` creates a shared Socket.IO client using `VITE_SOCKET_URL`, `window.location.origin`, or `http://127.0.0.1:3004`.
- `apps/web/vite.config.ts` proxies `/socket.io` to `http://127.0.0.1:3004` during local development.

## Platform Requirements

**Development:**
- Node.js compatible with TypeScript, Vite, Vitest, tsx, and Node's built-in test runner. Use Node 20 as the practical baseline because `@types/node` targets Node 20 and tests use modern Node APIs such as `fetch`.
- pnpm workspace installation from the root with `pnpm-lock.yaml`.

**Production:**
- Deployment target is not configured in repository files. No `Dockerfile`, `railway.json`, `vercel.json`, `netlify.toml`, or CI workflow files were detected.
- Current build produces `apps/server/dist`, `apps/web/dist`, and `packages/shared/dist`.
- Current server code does not serve `apps/web/dist`; production hosting needs either a static asset host for `apps/web/dist` or server middleware added to serve the built frontend.

## Notable Dependency Risks

**Package manager drift:**
- Both `pnpm-lock.yaml` and `package-lock.json` are present. The scripts and workspace config use pnpm, so npm installs can produce divergent dependency trees.

**Unpinned runtime:**
- No `engines.node`, `.nvmrc`, or `.node-version` file was detected. CI and deployment runtimes can drift away from the Node 20-compatible assumptions in `apps/server/package.json`, `packages/shared/package.json`, and `tests/bootstrap-smoke.mjs`.

**Open Socket.IO CORS default:**
- `apps/server/src/config.ts` defaults `SOCKET_IO_CORS_ORIGIN` to `*`. This is convenient for development but should be explicitly scoped in production.

**In-memory state:**
- `apps/server/src/lobby/store.ts` stores lobbies only in process memory. Server restarts, redeploys, horizontal scaling, or multiple instances lose or split active lobbies and sessions.

**Production web serving gap:**
- `apps/server/src/app.ts` registers only the health route. The Vite build output in `apps/web/dist` is not wired into the server runtime.

---

*Stack analysis: 2026-04-25*
