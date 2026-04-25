# External Integrations

**Analysis Date:** 2026-04-25

## APIs & External Services

**Realtime API:**
- Socket.IO - Primary app-level API for multiplayer lobbies and game sessions.
  - SDK/Client: `socket.io` in `apps/server/package.json`; `socket.io-client` in `apps/web/package.json`.
  - Server implementation: `apps/server/src/socket/register.ts`.
  - Browser client: `apps/web/src/lib/socket.ts`.
  - Shared contract: `packages/shared/src/contracts.ts`.
  - Auth: None detected. Socket identity currently relies on Socket.IO connection `socket.id`.

**HTTP API:**
- Express health endpoint - `GET /health` returns service health.
  - SDK/Client: `express` in `apps/server/package.json`.
  - Implementation: `apps/server/src/http/health.ts`.
  - Server wiring: `apps/server/src/app.ts`.
  - Auth: None.

**Third-party service APIs:**
- Not detected. No Stripe, Supabase, Firebase, AWS, OAuth, external REST clients, GraphQL clients, database clients, or queue clients were found in `apps/`, `packages/`, or `tests/`.

## Data Storage

**Databases:**
- Not detected.
  - Connection: Not applicable.
  - Client: Not applicable.

**Server State:**
- In-memory lobby store.
  - Implementation: `apps/server/src/lobby/store.ts`.
  - Data structure: `Map<string, LobbyState>` for lobbies and `Map<string, string>` for player-to-lobby lookup.
  - Lifecycle: Process-local and lost on server restart.

**Browser Storage:**
- `localStorage` stores active lobby metadata.
  - Implementation: `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/pages/HubPage.tsx`, and `apps/web/src/pages/ResultsPage.tsx`.
  - Key evidence: `blitz-active-lobby` appears in `apps/web/src/lib/useLobbySocket.ts`.
- `sessionStorage` stores finished session results for navigation recovery.
  - Implementation: `apps/web/src/pages/LightsSessionPage.tsx`, `apps/web/src/pages/PenaltySessionPage.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`, and `apps/web/src/pages/ResultsPage.tsx`.
  - Key pattern: `blitz-results:${sessionId}`.

**File Storage:**
- Local filesystem only for source, tests, and build artifacts.
- No runtime upload, object storage, or persistent file storage integration detected.

**Caching:**
- None detected.
- No Redis, Memcached, CDN cache integration, service worker, or app-level cache layer was found.

## Authentication & Identity

**Auth Provider:**
- Not detected.
  - Implementation: Lobby identity is based on Socket.IO `socket.id` in `apps/server/src/socket/register.ts`.
  - User-supplied display identity uses nickname and car ID payloads defined in `packages/shared/src/contracts.ts`.

**Authorization:**
- Host-only lobby actions are enforced in application code.
  - `apps/server/src/lobby/service.ts` checks host permissions for game selection, settings updates, kicks, and status changes.
  - `apps/server/src/socket/register.ts` checks the socket/player is host before session start and post-game actions.

## Monitoring & Observability

**Error Tracking:**
- None detected.
- No Sentry, Datadog, OpenTelemetry, New Relic, Honeycomb, or similar package/config was found.

**Logs:**
- Console logging only.
  - `apps/server/src/index.ts` logs successful startup and startup failure.
  - Structured logging is not detected.

**Health Checks:**
- `GET /health` is available from `apps/server/src/http/health.ts`.
- `tests/bootstrap-smoke.mjs` verifies the built server can respond to `/health`.

## CI/CD & Deployment

**Hosting:**
- Not configured in repository files.
- No `Dockerfile`, `railway.json`, `vercel.json`, `netlify.toml`, `fly.toml`, `render.yaml`, or CI workflow files were detected.

**CI Pipeline:**
- None detected.
- No `.github/workflows` files were detected by the repository scan.

**Production Runtime:**
- `apps/server/src/index.ts` starts a Node HTTP server on `PORT`.
- `apps/web` builds static assets via `vite build`, but no production server integration currently serves `apps/web/dist`.
- `apps/web/src/lib/socket.ts` expects the Socket.IO server at `VITE_SOCKET_URL`, `window.location.origin`, or `http://127.0.0.1:3004`.

## Environment Configuration

**Required env vars:**
- `PORT` - Optional server port, defaults to `3004` in `apps/server/src/config.ts`.
- `SOCKET_IO_CORS_ORIGIN` - Optional Socket.IO CORS origin, defaults to `*` in `apps/server/src/config.ts`.
- `VITE_SOCKET_URL` - Optional browser Socket.IO endpoint override used by `apps/web/src/lib/socket.ts`.

**Secrets location:**
- Not detected.
- No `.env*` files were found, and no secret manager integration is configured.

**Environment validation:**
- `apps/server/src/config.ts` validates `PORT` syntax and numeric range.
- `apps/server/src/config.test.ts` covers malformed `PORT`, explicit `PORT`, and `SOCKET_IO_CORS_ORIGIN`.
- `VITE_SOCKET_URL` is not schema-validated; it is passed directly to `socket.io-client` from `apps/web/src/lib/socket.ts`.

## Webhooks & Callbacks

**Incoming:**
- Socket.IO event handlers in `apps/server/src/socket/register.ts`:
  - `client:create-lobby`
  - `client:join-lobby`
  - `client:leave-lobby`
  - `client:set-ready`
  - `client:kick-player`
  - `client:select-game`
  - `client:update-lobby-settings`
  - `client:start-session`
  - `client:post-game-action`
  - `client:game-input`
  - `client:start-race`
- HTTP endpoint:
  - `GET /health` in `apps/server/src/http/health.ts`.
- Third-party webhooks: None detected.

**Outgoing:**
- Socket.IO server emits events defined in `packages/shared/src/contracts.ts`:
  - `server:lobby-updated`
  - `server:lobby-error`
  - `server:session-started`
  - `server:session-state`
  - `server:session-finished`
  - `server:post-game-updated`
  - `server:race-started`
  - `server:race-snapshot`
  - `server:race-finished`
- External outbound HTTP/API calls: None detected.

## Integration Risks

**Realtime API has no authenticated identity:**
- Files: `apps/server/src/socket/register.ts`, `packages/shared/src/contracts.ts`.
- Risk: Socket identity resets on reconnect and is not bound to a durable user/session token.
- Current mitigation: Host checks use `socket.id` and lobby membership tracked by `apps/server/src/lobby/store.ts`.

**Process-local storage limits deployments:**
- Files: `apps/server/src/lobby/store.ts`, `apps/server/src/lobby/service.ts`.
- Risk: Multiple server instances cannot share lobbies; redeploys clear active games.
- Current mitigation: None beyond in-memory state isolation.

**Permissive default CORS:**
- Files: `apps/server/src/config.ts`, `apps/server/src/socket/register.ts`.
- Risk: Socket.IO accepts all origins unless `SOCKET_IO_CORS_ORIGIN` is set.
- Current mitigation: Environment override exists.

**Deployment target is not represented as code:**
- Files: `package.json`, `apps/server/src/index.ts`, `apps/web/vite.config.ts`.
- Risk: Production behavior depends on out-of-repo platform setup, especially how `apps/web/dist` is hosted and how Socket.IO is routed.
- Current mitigation: `tests/bootstrap-smoke.mjs` verifies built server startup and health response.

---

*Integration audit: 2026-04-25*
