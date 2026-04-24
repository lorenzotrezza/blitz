# Blitz Railway Multiplayer App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `blitz` as a Railway-deployable TypeScript app with a React/Phaser frontend, a Node/Socket.IO backend, a minigames hub, bot races, and live multiplayer races with soft collisions for up to 8 players.

**Architecture:** Convert the single-file HTML app into a small monorepo with `apps/web`, `apps/server`, and `packages/shared`. The backend remains authoritative for lobby and race state; the frontend handles routing, UI, and Phaser rendering with interpolation against server snapshots.

**Tech Stack:** Node.js, npm, TypeScript, React, Vite, Phaser, Express, Socket.IO, Vitest, Testing Library

---

### Task 1: Bootstrap the Monorepo and Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Modify: `.gitignore`

**Step 1: Write the failing test**

Create `tests/tooling-smoke.test.js` asserting the repo has a root `package.json` with workspaces and scripts for `dev`, `build`, and `test`.

**Step 2: Run test to verify it fails**

Run: `node --test tests/tooling-smoke.test.js`
Expected: FAIL because the monorepo files do not exist yet.

**Step 3: Write minimal implementation**

Add npm workspaces for:

- `apps/web`
- `apps/server`
- `packages/shared`

Add root scripts:

- `dev`
- `build`
- `test`
- `lint` if needed later

Ignore build artifacts:

- `node_modules/`
- `dist/`
- `.turbo/` only if introduced later

**Step 4: Run test to verify it passes**

Run: `node --test tests/tooling-smoke.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json tsconfig.base.json apps/web apps/server packages/shared .gitignore tests/tooling-smoke.test.js
git commit -m "build: bootstrap blitz monorepo"
```

### Task 2: Define Shared Realtime Contracts

**Files:**
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/contracts.ts`
- Create: `packages/shared/src/game.ts`
- Create: `packages/shared/src/lobby.ts`
- Create: `packages/shared/src/contracts.test.ts`

**Step 1: Write the failing test**

Write tests for:

- valid lobby status values
- socket event names
- race snapshot shape
- input packet shape

Example assertions:

```ts
expect(SOCKET_EVENTS.client.joinLobby).toBe("client:join-lobby");
expect(RACE_STATUS.racing).toBe("racing");
```

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/shared`
Expected: FAIL because contracts are missing.

**Step 3: Write minimal implementation**

Export:

- socket event constants
- `LobbyState`, `PlayerInfo`, `RaceSnapshot`, `PlayerInput`
- enums/unions for lobby and race status
- soft-collision related constants

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/shared`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared multiplayer contracts"
```

### Task 3: Stand Up the Server Skeleton

**Files:**
- Create: `apps/server/src/index.ts`
- Create: `apps/server/src/app.ts`
- Create: `apps/server/src/config.ts`
- Create: `apps/server/src/http/health.ts`
- Create: `apps/server/src/socket/register.ts`
- Create: `apps/server/src/server.test.ts`

**Step 1: Write the failing test**

Write a server test that expects:

- `GET /health` returns `200`
- the app boots with an HTTP server instance

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/server`
Expected: FAIL because no server exists.

**Step 3: Write minimal implementation**

Implement:

- Express app
- Node HTTP server
- Socket.IO attached to the HTTP server
- health route
- config loader for `PORT`

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/server`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/server
git commit -m "feat: add blitz realtime server skeleton"
```

### Task 4: Build the Lobby Domain

**Files:**
- Create: `apps/server/src/lobby/store.ts`
- Create: `apps/server/src/lobby/code.ts`
- Create: `apps/server/src/lobby/service.ts`
- Create: `apps/server/src/lobby/service.test.ts`
- Modify: `apps/server/src/socket/register.ts`

**Step 1: Write the failing test**

Write tests for:

- create lobby
- join lobby with nickname
- reject join when full
- reassign host when host leaves
- toggle ready state

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/server -- lobby`
Expected: FAIL because lobby domain is missing.

**Step 3: Write minimal implementation**

Implement an in-memory lobby store with:

- lobby code generation
- max 8 players
- host tracking
- player ready state
- broadcast-friendly lobby snapshots

Wire socket handlers:

- `client:create-lobby`
- `client:join-lobby`
- `client:leave-lobby`
- `client:set-ready`

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/server -- lobby`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/lobby apps/server/src/socket/register.ts
git commit -m "feat: implement lobby lifecycle"
```

### Task 5: Build the Web App Shell and Real Routing

**Files:**
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/router.tsx`
- Create: `apps/web/src/styles.css`
- Create: `apps/web/src/pages/LandingPage.tsx`
- Create: `apps/web/src/pages/HubPage.tsx`
- Create: `apps/web/src/pages/LobbyPage.tsx`
- Create: `apps/web/src/pages/PracticePage.tsx`
- Create: `apps/web/src/pages/BotRacePage.tsx`
- Create: `apps/web/src/pages/RacePage.tsx`
- Create: `apps/web/src/pages/ResultsPage.tsx`
- Create: `apps/web/src/pages/MinigameLightsPage.tsx`
- Create: `apps/web/src/pages/MinigamePenaltyPage.tsx`
- Create: `apps/web/src/app/router.test.tsx`

**Step 1: Write the failing test**

Write router tests asserting the app renders the right page for:

- `/`
- `/hub`
- `/lobby/ABCD12`
- `/hub/minigames/lights`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web`
Expected: FAIL because the React app does not exist.

**Step 3: Write minimal implementation**

Implement React Router with path-based pages and a shared layout.
Keep the retro tone, but move away from the single-file screen toggling model.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: add web app shell and routing"
```

### Task 6: Add the Minigames Hub and Retryable Semaforo

**Files:**
- Create: `apps/web/src/features/minigames/lights/LightsGame.tsx`
- Create: `apps/web/src/features/minigames/lights/lightsMachine.ts`
- Create: `apps/web/src/features/minigames/lights/lightsMachine.test.ts`
- Create: `apps/web/src/features/minigames/penalty/PenaltyGame.tsx`
- Modify: `apps/web/src/pages/HubPage.tsx`
- Modify: `apps/web/src/pages/ResultsPage.tsx`

**Step 1: Write the failing test**

Write tests for:

- semaforo sequence enters `go`
- retry resets state after finish
- early start re-arms the minigame
- results page links back to hub

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- lights`
Expected: FAIL because the minigame state machine does not exist.

**Step 3: Write minimal implementation**

Extract the existing semaforo logic into a typed state machine with:

- idle
- sequence
- wait
- go
- done
- early

Add explicit `Retry` action.
Mount hub entry points from landing and results pages.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- lights`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/features/minigames apps/web/src/pages/HubPage.tsx apps/web/src/pages/ResultsPage.tsx
git commit -m "feat: add minigames hub and retryable lights game"
```

### Task 7: Build Race V2 in Phaser for Practice Mode

**Files:**
- Create: `apps/web/src/game/phaser/createGame.ts`
- Create: `apps/web/src/game/phaser/scenes/PracticeScene.ts`
- Create: `apps/web/src/game/phaser/scenes/HudScene.ts`
- Create: `apps/web/src/game/track/trackData.ts`
- Create: `apps/web/src/game/physics/carController.ts`
- Create: `apps/web/src/game/physics/carController.test.ts`
- Modify: `apps/web/src/pages/PracticePage.tsx`

**Step 1: Write the failing test**

Write tests for:

- steering is damped at high speed
- left/right input is less twitchy than the legacy version
- off-track causes slowdown

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- carController`
Expected: FAIL because the controller does not exist.

**Step 3: Write minimal implementation**

Implement a reusable car controller with:

- acceleration
- brake
- max speed
- steering dampening
- lateral grip
- off-track slowdown

Mount a Phaser practice scene using one simple track and placeholder art.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- carController`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/game apps/web/src/pages/PracticePage.tsx
git commit -m "feat: add phaser practice race v2"
```

### Task 8: Implement the Authoritative Race Engine and Bots

**Files:**
- Create: `apps/server/src/game/engine.ts`
- Create: `apps/server/src/game/progress.ts`
- Create: `apps/server/src/game/collisions.ts`
- Create: `apps/server/src/game/bots.ts`
- Create: `apps/server/src/game/engine.test.ts`
- Modify: `apps/server/src/socket/register.ts`

**Step 1: Write the failing test**

Write tests for:

- tick updates player state from input
- soft collision slows and separates cars
- progress/lap updates after checkpoints
- bots complete valid movement ticks

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/server -- engine`
Expected: FAIL because no race engine exists.

**Step 3: Write minimal implementation**

Implement an authoritative engine with:

- fixed tick loop
- player input ingestion
- bot drivers
- checkpoint progress
- soft collision response
- race session lifecycle

Wire socket handlers:

- `client:start-race`
- `client:player-input`
- `client:rematch`

Broadcast race snapshots at a stable interval.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/server -- engine`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/game apps/server/src/socket/register.ts
git commit -m "feat: add authoritative race engine"
```

### Task 9: Connect Multiplayer Race Rendering

**Files:**
- Create: `apps/web/src/realtime/socket.ts`
- Create: `apps/web/src/realtime/useLobby.ts`
- Create: `apps/web/src/realtime/useRace.ts`
- Create: `apps/web/src/game/phaser/scenes/MultiplayerRaceScene.ts`
- Create: `apps/web/src/game/interpolation.ts`
- Create: `apps/web/src/game/interpolation.test.ts`
- Modify: `apps/web/src/pages/LobbyPage.tsx`
- Modify: `apps/web/src/pages/RacePage.tsx`

**Step 1: Write the failing test**

Write tests for:

- interpolation smooths remote snapshots
- lobby page transitions to race when session starts
- local input packets are throttled and emitted

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- realtime`
Expected: FAIL because the realtime layer does not exist.

**Step 3: Write minimal implementation**

Implement:

- Socket.IO client wrapper
- lobby hooks
- race hooks
- multiplayer Phaser scene
- local player prediction and remote player interpolation

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- realtime`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/realtime apps/web/src/game/phaser/scenes/MultiplayerRaceScene.ts apps/web/src/pages/LobbyPage.tsx apps/web/src/pages/RacePage.tsx
git commit -m "feat: connect multiplayer race client"
```

### Task 10: Add Results, Rematch, and Bot Race Mode

**Files:**
- Create: `apps/server/src/game/results.ts`
- Create: `apps/server/src/game/results.test.ts`
- Modify: `apps/web/src/pages/BotRacePage.tsx`
- Modify: `apps/web/src/pages/ResultsPage.tsx`
- Modify: `apps/server/src/game/engine.ts`

**Step 1: Write the failing test**

Write tests for:

- finishing order is sorted correctly
- bot race mode can start without a lobby full of humans
- rematch returns players to a fresh ready state

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/server -- results`
Expected: FAIL because the result aggregator is missing.

**Step 3: Write minimal implementation**

Implement:

- final standings
- finish timestamps
- rematch/reset flow
- bot-only race bootstrap from the UI

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/server -- results`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/game/results.ts apps/server/src/game/results.test.ts apps/web/src/pages/BotRacePage.tsx apps/web/src/pages/ResultsPage.tsx apps/server/src/game/engine.ts
git commit -m "feat: add results and bot race mode"
```

### Task 11: Replace the Legacy Entry and Serve the Built App

**Files:**
- Modify: `index.html`
- Modify: `apps/server/src/app.ts`
- Create: `apps/server/src/http/static.ts`
- Create: `apps/server/src/http/static.test.ts`

**Step 1: Write the failing test**

Write tests for:

- server serves built frontend assets
- unknown frontend paths return the app shell

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/server -- static`
Expected: FAIL because static serving is not wired.

**Step 3: Write minimal implementation**

Implement static serving for the built web app.
Either:

- replace root `index.html` with a compatibility stub/documentation page

or

- keep it as a redirect note while the new build owns `/`

Prefer removing the old single-file gameplay from the main route once the new app is ready.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/server -- static`
Expected: PASS

**Step 5: Commit**

```bash
git add index.html apps/server/src/http/static.ts apps/server/src/http/static.test.ts apps/server/src/app.ts
git commit -m "feat: serve blitz app from railway server"
```

### Task 12: Railway Readiness and End-to-End Verification

**Files:**
- Create: `railway.json`
- Create: `README.md`
- Create: `docs/plans/railway-runbook.md`
- Modify: `package.json`

**Step 1: Write the failing test**

Write a small smoke test script verifying:

- root build script exists
- root start script exists
- required env vars are documented

**Step 2: Run test to verify it fails**

Run: `node --test tests/deploy-smoke.test.js`
Expected: FAIL until Railway config and scripts are complete.

**Step 3: Write minimal implementation**

Add:

- Railway start/build commands
- README local run instructions
- deploy runbook

Then run:

- full test suite
- local build
- local server start

**Step 4: Run test to verify it passes**

Run:

- `npm test`
- `npm run build`
- `npm run start`

Expected: PASS

**Step 5: Commit**

```bash
git add railway.json README.md docs/plans/railway-runbook.md package.json tests/deploy-smoke.test.js
git commit -m "docs: prepare railway deployment and runbook"
```

---

## Execution Notes

- Keep the first track simple and stable.
- Do not add accounts, chat, or persistence during MVP execution.
- Do not reintroduce single-file DOM screen toggling in the new app.
- Reuse minigame writing, jokes, and tone from the current HTML where it helps, but move behavior into typed modules.
- Prefer placeholder art and clean abstractions over waiting for perfect assets.

## Verification Checklist

- Two browsers can create/join the same lobby locally
- Host can start a race
- Practice mode works without server race state
- Bot race starts from the hub
- Multiplayer race broadcasts live positions
- Collisioni soft visibly slow/push cars without hard-locking
- Results screen supports rematch and return to hub
- Railway build/start commands are documented and runnable

Plan complete and saved to `docs/plans/2026-04-24-blitz-railway-multiplayer-app.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
