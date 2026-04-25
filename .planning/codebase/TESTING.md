# Testing Patterns

**Analysis Date:** 2026-04-25

## Test Framework

**Runner:**
- Web: Vitest `^3.2.4`, configured in `apps/web/vite.config.ts`.
- Server: Node built-in test runner via `node --import tsx --test`, configured by scripts in `apps/server/package.json`.
- Shared: Node built-in test runner via `node --import tsx --test`, configured by scripts in `packages/shared/package.json`.
- Root smoke tests: Node built-in test runner via `node --test tests/*.test.js`, configured in root `package.json`.

**Assertion Library:**
- Server/shared/root tests use `node:assert/strict`: `apps/server/src/lobby/service.test.ts`, `packages/shared/src/contracts.test.ts`, `tests/tooling-smoke.test.js`.
- Web tests use Vitest `expect` plus `@testing-library/jest-dom/vitest`: `apps/web/src/app/router.test.tsx`, `apps/web/src/pages/LobbyPage.test.tsx`.
- Web component tests use Testing Library queries and events from `@testing-library/react`: `apps/web/src/pages/LobbyPage.test.tsx`.

**Run Commands:**
```bash
pnpm run test              # Full test path from root package.json
pnpm run lint              # Type-check all workspaces; root lint builds shared first
pnpm run build             # Build shared, server, and web workspaces
pnpm run verify:bootstrap  # Lint, build, then run tests/bootstrap-smoke.mjs
pnpm --filter @blitz/web test      # Web Vitest suite
pnpm --filter @blitz/server test   # Server tsc plus Node test suite
pnpm --filter @blitz/shared test   # Shared tsc plus Node test suite
```

**Watch Mode:**
- Not configured in package scripts.
- Vitest watch mode can be run ad hoc from `apps/web` if needed, but no repository script exposes it.

**Coverage:**
- Not configured. No coverage command is present in root `package.json`, `apps/web/package.json`, `apps/server/package.json`, or `packages/shared/package.json`.

## Test File Organization

**Location:**
- Tests are generally co-located with implementation files:
  - `apps/server/src/lobby/service.ts` and `apps/server/src/lobby/service.test.ts`
  - `apps/server/src/socket/register.ts` and `apps/server/src/socket/register.test.ts`
  - `apps/web/src/app/router.tsx` and `apps/web/src/app/router.test.tsx`
  - `apps/web/src/lib/useLobbySocket.ts` and `apps/web/src/lib/useLobbySocket.test.ts`
  - `packages/shared/src/contracts.ts` and `packages/shared/src/contracts.test.ts`
- Root smoke/integration checks live in `tests/`: `tests/tooling-smoke.test.js`, `tests/blitz-flow.test.js`, `tests/bootstrap-smoke.mjs`.

**Naming:**
- Use `*.test.ts` for TypeScript unit and server tests.
- Use `*.test.tsx` for React component/router/page tests.
- Use `*.test.js` for root Node smoke tests.
- `tests/bootstrap-smoke.mjs` is an executable ESM smoke script, not a `node:test` file.

**Current Source Test Files:**
```text
apps/server/src/config.test.ts
apps/server/src/games/lights/runtime.test.ts
apps/server/src/games/penalty/runtime.test.ts
apps/server/src/games/race/dragSprint.test.ts
apps/server/src/games/race/sprintCircuit.test.ts
apps/server/src/games/registry.test.ts
apps/server/src/lobby/service.test.ts
apps/server/src/server.test.ts
apps/server/src/socket/register.test.ts
apps/web/src/app/router.test.tsx
apps/web/src/game/useRetroRace.test.ts
apps/web/src/legacy/legacyDocument.test.ts
apps/web/src/lib/socket.test.ts
apps/web/src/lib/useLobbySocket.test.ts
apps/web/src/pages/LightsSessionPage.test.tsx
apps/web/src/pages/LobbyPage.test.tsx
apps/web/src/pages/PenaltySessionPage.test.tsx
apps/web/src/pages/ResultsPage.test.tsx
apps/web/src/pages/SprintCircuitPage.test.tsx
packages/shared/src/contracts.test.ts
tests/blitz-flow.test.js
tests/tooling-smoke.test.js
```

## Test Structure

**Node Test Pattern:**
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

import { createLobbyService } from './service.js';

test('createLobby creates a lobby with the caller as host', () => {
  const service = createLobbyService({ generateLobbyCode: () => 'ABCD12' });

  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  assert.equal(lobby.code, 'ABCD12');
});
```
- Source example: `apps/server/src/lobby/service.test.ts`.
- Use `assert.equal`, `assert.deepEqual`, `assert.ok`, `assert.match`, and `assert.throws`.
- Prefer deterministic factory helpers such as `createServiceHarness`, `createLobby`, and `createPlayer`.

**Vitest Component Pattern:**
```typescript
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { createAppRouter } from './router';

function renderRoute(initialEntry: string) {
  const router = createAppRouter({ initialEntries: [initialEntry] });

  return render(<RouterProvider router={router} />);
}
```
- Source example: `apps/web/src/app/router.test.tsx`.
- Use accessible queries first: `getByRole`, `getByLabelText`, `getByTitle`, `queryByRole`.
- Assert user-visible behavior and route attributes rather than component internals.

**Vitest Hook Pattern:**
```typescript
const { mockGetBlitzSocket } = vi.hoisted(() => ({
  mockGetBlitzSocket: vi.fn(),
}));

vi.mock('./socket', () => ({
  getBlitzSocket: mockGetBlitzSocket,
}));
```
- Source example: `apps/web/src/lib/useLobbySocket.test.ts`.
- Use `vi.hoisted` when the mock function must exist before the mocked module is imported.
- Use `renderHook` and `act` from `@testing-library/react` for hook commands.

## Mocking

**Frameworks:**
- Web: Vitest `vi.mock`, `vi.fn`, `vi.hoisted`.
- Server/shared: hand-written fakes and dependency injection rather than a mocking framework.

**Web Mocking Pattern:**
```typescript
const { mockUseLobbySocket } = vi.hoisted(() => ({
  mockUseLobbySocket: vi.fn(),
}));

vi.mock('../lib/useLobbySocket', () => ({
  useLobbySocket: mockUseLobbySocket,
}));
```
- Source example: `apps/web/src/pages/LobbyPage.test.tsx`.
- Mock hooks at module boundaries for page tests, then render real route/component trees.

**Server Fake Pattern:**
```typescript
function createFakeSocket(id: string) {
  const handlers = new Map<string, RegisteredHandler>();
  const emitted: FakeSocketEmit[] = [];

  return {
    socket: {
      id,
      on(event: string, handler: RegisteredHandler) {
        handlers.set(event, handler);
        return this;
      },
      emit(event: string, payload: unknown) {
        emitted.push({ event, payload });
        return true;
      },
    },
    emitted,
    async trigger(event: string, payload?: unknown) {
      const handler = handlers.get(event);
      assert.ok(handler, `Expected socket handler for ${event}`);
      await handler(payload);
    },
  };
}
```
- Source example: `apps/server/src/socket/register.test.ts`.
- Use fakes for Socket.IO connections and room broadcasts instead of opening real socket clients for unit coverage.

**What to Mock:**
- Browser sockets in hook/page tests: `apps/web/src/lib/useLobbySocket.test.ts`, `apps/web/src/pages/LobbyPage.test.tsx`.
- Socket.IO room broadcasts and sockets in server socket registration tests: `apps/server/src/socket/register.test.ts`.
- Lobby code generation for deterministic service tests: `apps/server/src/lobby/service.test.ts`.
- Time, distance, countdown, and callbacks through runtime options when game rules need deterministic assertions: `apps/server/src/games/race/dragSprint.test.ts`.

**What Not to Mock:**
- Shared contracts from `@blitz/shared`; tests use real constants and types in `apps/web/src/pages/LobbyPage.test.tsx`, `apps/server/src/lobby/service.test.ts`, and `apps/server/src/socket/register.test.ts`.
- Router rendering in page tests; use `createAppRouter({ initialEntries })` and `RouterProvider` to exercise actual routes.
- Pure domain services when testing transport behavior; inject the real `createLobbyService` into `registerSockets` tests.

## Fixtures and Factories

**Test Data:**
```typescript
function createLobbySnapshot(overrides: LobbySnapshotOverrides = {}): LobbyState {
  const { settings: settingsOverrides, ...restOverrides } = overrides;

  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'drag-sprint',
    status: 'waiting',
    settings: {
      ...settingsOverrides,
      maxPlayers: settingsOverrides?.maxPlayers ?? 8,
      rounds: settingsOverrides?.rounds ?? 3,
    },
    players: [],
    ...restOverrides,
  };
}
```
- Source examples: `apps/web/src/pages/LobbyPage.test.tsx`, `apps/web/src/lib/useLobbySocket.test.ts`.
- Keep factories local to the test file when the shape is specific to that suite.
- Use override objects for scenario-specific changes while preserving complete valid state.

**Location:**
- No shared fixture directory exists.
- Test factories are defined inside each test file.

## Coverage

**Requirements:** None enforced.

**View Coverage:**
```bash
# Not configured
```

**Observed Coverage Strengths:**
- Shared contract stability is tested in `packages/shared/src/contracts.test.ts`.
- Lobby service behavior and errors are covered in `apps/server/src/lobby/service.test.ts`.
- Socket registration behavior is covered with fakes in `apps/server/src/socket/register.test.ts`.
- Game runtimes have focused tests in `apps/server/src/games/lights/runtime.test.ts`, `apps/server/src/games/penalty/runtime.test.ts`, `apps/server/src/games/race/sprintCircuit.test.ts`, and `apps/server/src/games/race/dragSprint.test.ts`.
- Router and major pages have Testing Library tests in `apps/web/src/app/router.test.tsx` and `apps/web/src/pages/*.test.tsx`.

**Coverage Gaps:**
- No automated coverage threshold exists.
- No browser E2E framework is configured.
- No accessibility audit test suite is configured.
- No visual regression or screenshot tests are configured.
- CSS in `apps/web/src/styles.css` is not directly verified except through component rendering.

## Test Types

**Unit Tests:**
- Shared constants, types, and helper policy: `packages/shared/src/contracts.test.ts`.
- Domain services and stores: `apps/server/src/lobby/service.test.ts`, `apps/server/src/games/registry.test.ts`.
- Pure game/runtime behavior: `apps/server/src/games/race/dragSprint.test.ts`, `apps/web/src/game/useRetroRace.test.ts`.
- Socket URL resolution: `apps/web/src/lib/socket.test.ts`.

**Component and Page Tests:**
- Use Vitest, jsdom, React Testing Library, and jest-dom.
- Route through `createAppRouter({ initialEntries })` when testing pages tied to URLs.
- Examples: `apps/web/src/app/router.test.tsx`, `apps/web/src/pages/LobbyPage.test.tsx`, `apps/web/src/pages/SprintCircuitPage.test.tsx`.

**Integration and Smoke Tests:**
- `apps/server/src/server.test.ts` boots the server module and verifies `/health`, falling back to simulated HTTP when TCP listen is restricted.
- `tests/bootstrap-smoke.mjs` imports built server output from `apps/server/dist/index.js` and verifies `/health`.
- `tests/tooling-smoke.test.js` verifies workspace and script structure in root `package.json`.
- `tests/blitz-flow.test.js` is a root flow test.

**E2E Tests:**
- Not used. No Playwright, Cypress, or browser automation config is present.

## Async Testing

**Server Async Pattern:**
```typescript
test('createServer serves GET /health with 200', async () => {
  const serverModule = await import('./index.js');
  const { io, server } = serverModule.createServer();
  const response = await requestHealthOverServer(server);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });

  io.close();
  await close(server);
});
```
- Source example: `apps/server/src/server.test.ts`.
- Close Socket.IO and HTTP servers in `finally` blocks or explicit cleanup paths.
- Include TCP fallback logic where sandboxed environments may reject listening on ports.

**Hook Async/Effect Pattern:**
- Use Testing Library `act` around hook commands that trigger React state or effects.
- Reset browser state in `beforeEach`/`afterEach`; `apps/web/src/lib/useLobbySocket.test.ts` clears `window.localStorage` and resets mocks.

## Error Testing

**Domain Error Pattern:**
```typescript
assert.throws(
  () => service.joinLobby({ code: lobby.code, playerId: 'socket-9', nickname: 'Player 9', carId: 'car-9' }),
  (error: unknown) => {
    assert.notEqual(error, null);
    assert.equal(typeof error, 'object');
    assert.equal((error as { code: string }).code, 'lobby-full');
    return true;
  },
);
```
- Source example: `apps/server/src/lobby/service.test.ts`.
- Assert stable error codes, not only thrown messages.

**Transport Error Pattern:**
- Trigger fake socket events and assert emitted error payloads instead of broadcasts.
- Source example: `apps/server/src/socket/register.test.ts` verifies `SOCKET_EVENTS.server.lobbyError` for a non-member leaving a lobby.

## Verification Guidance

**Before changing shared contracts:**
```bash
pnpm --filter @blitz/shared test
pnpm --filter @blitz/server test
pnpm --filter @blitz/web test
```

**Before changing server socket or lobby behavior:**
```bash
pnpm --filter @blitz/server test
pnpm run verify:bootstrap
```

**Before changing React pages, hooks, or routing:**
```bash
pnpm --filter @blitz/web test
pnpm --filter @blitz/web lint
```

**Before merging broad changes:**
```bash
pnpm run test
pnpm run build
```

## Recommendations

**Add Coverage Reporting:**
- Add coverage commands to `apps/web/package.json`, `apps/server/package.json`, and `packages/shared/package.json`.
- Start with reporting-only coverage, then add thresholds after measuring the current baseline.

**Add Formatter/Linter:**
- Add one style tool for TypeScript/React formatting enforcement. Current linting only runs TypeScript type checks.
- Keep existing `tsc --noEmit` lint scripts as a separate correctness gate.

**Keep Test Discovery Source-Only:**
- Exclude `apps/server/dist/` when using ad hoc `find` commands because compiled `.test.js` files can exist there.
- Use package scripts for authoritative test discovery.

**Add E2E Coverage for Multiplayer Flows:**
- Add browser-level coverage for create/join lobby, ready state, start session, and results navigation.
- Keep current unit tests for socket and service rules; use E2E only for cross-browser workflow confidence.

---

*Testing analysis: 2026-04-25*
