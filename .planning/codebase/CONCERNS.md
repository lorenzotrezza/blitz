# Codebase Concerns

**Analysis Date:** 2026-04-25

## Tech Debt

**Duplicate runtime/build artifacts at the repository root:**
- Issue: The root `index.html` is a 75K standalone legacy app while the current Vite app lives under `apps/web/`. The repo also contains generated `dist/` directories under `apps/server/dist/`, `apps/web/dist/`, and `packages/shared/dist/`.
- Files: `index.html`, `apps/web/public/legacy/index.html`, `apps/web/dist/`, `apps/server/dist/`, `packages/shared/dist/`
- Impact: Future changes can land in the wrong app surface, generated output can be mistaken for source, and search results are noisy because source and build output coexist.
- Fix approach: Treat `apps/**/src/` and `packages/shared/src/` as source of truth. Keep generated folders ignored or untracked, and document whether `index.html` is retained as an intentional legacy artifact or moved fully into `apps/web/public/legacy/index.html`.

**Socket event surface includes stale/parallel race events:**
- Issue: `SOCKET_EVENTS` exposes both generic session events and older race-specific events, but `apps/server/src/socket/register.ts` only emits generic `server:session-*` events.
- Files: `packages/shared/src/contracts.ts`, `apps/server/src/socket/register.ts`, `apps/web/src/lib/useLiveRaceSocket.ts`
- Impact: New clients can accidentally build against `raceStarted`, `raceSnapshot`, `raceFinished`, or `playerInput` even though the active server path uses `sessionStarted`, `sessionState`, `sessionFinished`, and `gameInput`.
- Fix approach: Consolidate on one event family. Remove unused race-specific events or add explicit compatibility handlers/tests if they are public API.

**Game runtime logic is concentrated in large stateful modules:**
- Issue: The largest source files combine rules, timer orchestration, input parsing, physics, ranking, and result emission in one module.
- Files: `apps/server/src/games/race/dragSprint.ts` (827 lines), `apps/server/src/games/race/sprintCircuit.ts` (492 lines), `apps/server/src/games/lights/runtime.ts` (462 lines), `apps/server/src/games/penalty/runtime.ts` (401 lines)
- Impact: Feature changes in race or minigame rules have high regression risk because there are many mutable variables and nested timing transitions per file.
- Fix approach: Extract pure reducers/helpers for input normalization, scoring, ranking, collision/track math, and timer phase transitions. Keep runtime classes/functions focused on lifecycle and callback wiring.

**Lobby settings accept arbitrary keys:**
- Issue: `LobbySettings` includes an index signature that allows any string key/value, and `LobbyService.updateSettings()` merges client-provided settings directly into lobby state.
- Files: `packages/shared/src/lobby.ts`, `apps/server/src/lobby/service.ts`, `apps/server/src/socket/register.ts`
- Impact: Clients can persist unsupported keys in server state, creating unclear behavior and making future settings migrations harder.
- Fix approach: Replace the broad index signature with explicit fields or validate/normalize `UpdateLobbySettingsPayload` on the server before saving.

## Known Bugs

**Disconnect removes players instead of preserving reconnect state:**
- Symptoms: A transient disconnect calls `gameManager.removePlayer(socket.id)` and `lobbyService.disconnectPlayer(socket.id)`, which removes the player and may transfer host.
- Files: `apps/server/src/socket/register.ts`, `apps/server/src/lobby/service.ts`, `packages/shared/src/lobby.ts`
- Trigger: Browser refresh, mobile backgrounding, Wi-Fi transition, or Socket.IO reconnect with a new socket id.
- Workaround: Users rejoin the lobby manually and may lose host/session position.
- Fix approach: Use stable player/session identity separate from `socket.id`, mark `connectionState: disconnected`, and allow reconnect within a timeout before removal.

**Local lobby persistence can show stale lobby state:**
- Symptoms: `readStoredActiveLobby()` trusts localStorage and returns the parsed lobby without freshness or server confirmation.
- Files: `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/pages/HubPage.tsx`, `apps/web/src/pages/ResultsPage.tsx`
- Trigger: Server restart, lobby deletion, host disconnect, or client opening an old browser tab.
- Workaround: Server errors eventually clear some flows, but the initial UI can render obsolete lobby state.
- Fix approach: Add a server-side lobby lookup/sync event or a freshness timestamp, then clear persisted lobby state when the server rejects or cannot find the lobby.

**Clipboard invite action lacks failure handling:**
- Symptoms: `copyInviteLink()` awaits `navigator.clipboard.writeText()` without catching permission, insecure context, or unsupported API failures.
- Files: `apps/web/src/lib/useLobbySocket.ts`, `apps/web/src/pages/LobbyPage.tsx`
- Trigger: Non-HTTPS deployments, browsers denying clipboard permission, embedded contexts, or older browsers.
- Workaround: None in UI.
- Fix approach: Catch clipboard errors, expose a user-facing fallback state, and render the invite URL in a selectable control.

## Security & Privacy Risks

**Socket.IO CORS defaults to wildcard:**
- Risk: The default `SOCKET_IO_CORS_ORIGIN` is `*`, and `registerSockets()` applies it directly to Socket.IO CORS.
- Files: `apps/server/src/config.ts`, `apps/server/src/socket/register.ts`, `apps/server/src/config.test.ts`
- Current mitigation: `SOCKET_IO_CORS_ORIGIN` can be configured explicitly.
- Recommendations: Require an explicit origin outside development, support an allowlist, and fail startup when production config leaves CORS open.

**No authentication or authorization beyond socket id host checks:**
- Risk: Lobby control depends on transient `socket.id`; anyone who joins as host or obtains a host socket context can start sessions, change settings, kick players, or trigger post-game actions.
- Files: `apps/server/src/socket/register.ts`, `apps/server/src/lobby/service.ts`
- Current mitigation: Host-only checks exist for `startSession`, `selectGame`, `updateSettings`, `kickPlayer`, and post-game actions.
- Recommendations: Add signed player tokens or lobby membership secrets. Validate every mutating event against stable membership identity, not only the current socket id.

**Lobby codes use non-cryptographic randomness:**
- Risk: `generateLobbyCode()` defaults to `Math.random()` for six-character lobby codes.
- Files: `apps/server/src/lobby/code.ts`, `apps/server/src/lobby/service.ts`
- Current mitigation: Codes are short-lived in memory and avoid ambiguous characters.
- Recommendations: Use `crypto.randomInt()` or `crypto.getRandomValues()` for production lobby codes. Add rate limits for join attempts to reduce guessing risk.

**Unbounded user-provided text is stored and broadcast:**
- Risk: Nicknames, car ids, lobby codes, and settings are accepted from Socket.IO payloads without length or schema validation before storage/broadcast.
- Files: `apps/server/src/socket/register.ts`, `apps/server/src/lobby/service.ts`, `packages/shared/src/contracts.ts`
- Current mitigation: React escapes rendered text by default.
- Recommendations: Validate payloads at the socket boundary. Enforce nickname length, allowed car ids, lobby code format, and settings ranges before entering service code.

**No rate limiting or abuse protection on socket events:**
- Risk: High-frequency `gameInput`, create/join, and settings events can be emitted by any connected client.
- Files: `apps/server/src/socket/register.ts`, `apps/server/src/games/manager.ts`, `apps/web/src/lib/useLiveRaceSocket.ts`
- Current mitigation: Game clients emit race input every 50ms, and runtime parsers clamp some values.
- Recommendations: Add per-socket throttling, payload-size limits, and event-specific cooldowns for lobby creation, join attempts, and game inputs.

## Performance Bottlenecks

**Every race input can emit full session state:**
- Problem: `gameInput` is accepted for every socket and forwarded to runtime logic; runtime callbacks emit full `GameSessionEnvelope` payloads to the lobby room.
- Files: `apps/server/src/socket/register.ts`, `apps/server/src/games/manager.ts`, `apps/server/src/games/race/sprintCircuit.ts`, `apps/web/src/lib/useLiveRaceSocket.ts`
- Cause: The client interval emits every 50ms while racing, and state emission is room-wide.
- Improvement path: Coalesce inputs on a fixed server tick, emit snapshots at a capped rate, and send deltas or compact race snapshots for larger lobbies.

**In-memory lobby/session store has no capacity or TTL policy:**
- Problem: Lobbies and runtime maps stay in process memory until all players leave or a session finishes.
- Files: `apps/server/src/lobby/store.ts`, `apps/server/src/games/manager.ts`
- Cause: There is no expiry for abandoned waiting/result lobbies and no global cap on active lobbies/sessions.
- Improvement path: Add lobby TTLs, session TTLs, max lobby count, and periodic cleanup. Emit explicit expiry events to clients.

**Canvas rendering redraws all track/player graphics on every snapshot render:**
- Problem: `SprintCircuitPage` redraws the entire track and all cars whenever `snapshot` changes.
- Files: `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/game/sprintCircuitTrack.ts`
- Cause: Rendering is tied directly to React state updates from socket snapshots.
- Improvement path: Cache static track drawing to an offscreen canvas or background layer, and render moving entities in `requestAnimationFrame`.

## Accessibility & User-Facing Risks

**Canvas-only game views lack equivalent live text/status semantics:**
- Risk: Race visuals are primarily drawn to canvas with only an `aria-label`; detailed positions, hazards, and motion are not exposed as live accessible state.
- Files: `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/components/RetroRaceView.tsx`
- Current mitigation: Some roster/HUD information is rendered as text.
- Recommendations: Add `aria-live` updates for countdown, status, position, lap/checkpoint, and results. Provide keyboard-first controls with visible focus states.

**Controls rely on mouse/touch press handlers without full keyboard parity:**
- Risk: Race buttons use `onMouseDown`, `onMouseUp`, `onTouchStart`, and `onTouchEnd`; keyboard users activating buttons with Space/Enter do not get equivalent press-and-hold behavior.
- Files: `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/components/RetroRaceView.tsx`, `apps/web/src/lib/useLiveRaceSocket.ts`
- Current mitigation: `useLiveRaceSocket()` listens for ArrowLeft, ArrowRight, and ArrowDown globally in live race sessions.
- Recommendations: Add `onKeyDown`/`onKeyUp` handlers on controls, document/control focus order visually, and avoid relying only on global keyboard listeners.

**CSS lacks explicit focus-visible styling:**
- Risk: Buttons, links, inputs, and selects have hover styling but no clear `:focus-visible` rules.
- Files: `apps/web/src/styles.css`
- Current mitigation: Browser default focus outlines may appear depending on user agent and reset behavior.
- Recommendations: Add high-contrast `:focus-visible` styles for `.button`, `.btn`, `.topnav a`, `.card-link`, `.lobby-input`, and canvas control surfaces.

**Pixel font and muted color palette may reduce readability:**
- Risk: UI text uses `'Press Start 2P'` globally with small sizes such as `0.48rem` to `0.62rem`, and muted text uses low-saturation blue-gray on dark panels.
- Files: `apps/web/src/styles.css`, `apps/web/src/pages/LobbyPage.tsx`, `apps/web/src/pages/ResultsPage.tsx`
- Current mitigation: Large headings and accent colors are high contrast.
- Recommendations: Verify WCAG contrast and minimum readable text sizes on mobile. Use larger body text for status, errors, and controls.

## Testing Gaps

**No browser-level or real Socket.IO integration tests:**
- What's not tested: Multi-client behavior over actual Socket.IO transport, reconnects, CORS behavior, room membership, and browser navigation across live sessions.
- Files: `apps/server/src/socket/register.test.ts`, `apps/web/src/lib/useLobbySocket.test.ts`, `tests/bootstrap-smoke.mjs`
- Risk: Unit-style fake sockets can miss transport lifecycle, reconnection, and cross-tab issues.
- Priority: High
- Fix approach: Add an integration test that starts `apps/server/src/index.ts` or `createServer()`, connects real `socket.io-client` instances, and drives create/join/start/disconnect flows.

**Accessibility tests are not detected:**
- What's not tested: Focus order, visible focus, keyboard-only game controls, ARIA live regions, and color contrast.
- Files: `apps/web/src/pages/*.test.tsx`, `apps/web/src/components/RetroRaceView.tsx`, `apps/web/src/styles.css`
- Risk: Interactive gameplay can be inaccessible even when component tests pass.
- Priority: Medium
- Fix approach: Add Testing Library keyboard tests for controls and an axe-based smoke test for core routes.

**Runtime edge cases around invalid settings and payloads are thin:**
- What's not tested: Malformed lobby settings, invalid car ids, oversized nicknames, unexpected socket payload shapes, and malicious high-rate inputs.
- Files: `apps/server/src/lobby/service.test.ts`, `apps/server/src/socket/register.test.ts`, `packages/shared/src/contracts.test.ts`
- Risk: Invalid state can enter in-memory stores and later break UI or game runtime assumptions.
- Priority: High
- Fix approach: Add server boundary validation tests and reject invalid payloads before service calls.

## Dependency & Configuration Concerns

**Package manager state is mixed between npm and pnpm:**
- Issue: The root contains both `package-lock.json` and `pnpm-lock.yaml`, while scripts use `pnpm` workspace filters.
- Files: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- Impact: `npm ls --all --depth=0` reports unmet workspace dependencies for `@blitz/server`, `@blitz/shared`, and `@blitz/web`, which can confuse tooling and CI setup.
- Fix approach: Standardize on pnpm for workspace installs and remove or stop updating npm lockfile unless npm is explicitly supported.

**No lint/format tool beyond TypeScript checking is configured:**
- Issue: Package `lint` scripts run `tsc --noEmit`, and no ESLint, Prettier, or Biome config is detected.
- Files: `package.json`, `apps/server/package.json`, `apps/web/package.json`, `packages/shared/package.json`
- Impact: Style, accessibility linting, React hook rules, unused code patterns, and unsafe browser APIs rely on manual review.
- Fix approach: Add a single workspace lint/format stack and enable React, accessibility, import, and TypeScript-aware rules.

**Production deployment configuration is not detected:**
- Issue: No Dockerfile, CI workflow, deployment config, or environment example is detected in the repository scan.
- Files: `apps/server/src/config.ts`, `apps/web/vite.config.ts`, `package.json`
- Impact: Runtime assumptions such as port, CORS origin, static asset hosting, and Socket.IO URL resolution can diverge per environment.
- Fix approach: Add deployment documentation/config, an `.env.example` without secrets, and CI commands for `pnpm install --frozen-lockfile`, build, lint, and tests.

## Migration & Refactor Opportunities

**Introduce socket payload validation at the boundary:**
- Opportunity: Use schemas for `CreateLobbyPayload`, `JoinLobbyPayload`, `UpdateLobbySettingsPayload`, `GameInputPayload`, and post-game actions.
- Files: `packages/shared/src/contracts.ts`, `apps/server/src/socket/register.ts`, `apps/server/src/lobby/service.ts`
- Benefit: Narrows service assumptions, improves client error messages, and blocks malformed state before persistence.

**Separate stable identity from socket connection identity:**
- Opportunity: Add player tokens or lobby membership secrets and map active sockets to stable player ids.
- Files: `apps/server/src/socket/register.ts`, `apps/server/src/lobby/store.ts`, `packages/shared/src/lobby.ts`, `apps/web/src/lib/useLobbySocket.ts`
- Benefit: Enables reconnect, prevents accidental host loss, and prepares the app for persistence or horizontal scaling.

**Move in-memory stores behind replaceable interfaces with lifecycle policy:**
- Opportunity: `LobbyStore` already exists; extend it with TTL, capacity, and query/cleanup APIs, then make `GameManager` similarly replaceable.
- Files: `apps/server/src/lobby/store.ts`, `apps/server/src/games/manager.ts`
- Benefit: Creates a path to Redis/database-backed sessions without rewriting socket handlers.

**Refactor gameplay runtimes into pure reducer plus scheduler shell:**
- Opportunity: Keep runtime interfaces in `apps/server/src/games/runtime.ts`, but move pure game rules into smaller modules per game.
- Files: `apps/server/src/games/race/dragSprint.ts`, `apps/server/src/games/race/sprintCircuit.ts`, `apps/server/src/games/lights/runtime.ts`, `apps/server/src/games/penalty/runtime.ts`
- Benefit: Makes physics/scoring deterministic, easier to fuzz, and easier to reuse in client previews or simulations.

---

*Concerns audit: 2026-04-25*
