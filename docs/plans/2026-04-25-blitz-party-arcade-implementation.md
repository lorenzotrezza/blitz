# Blitz Party Arcade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Blitz into a multiplayer-first party arcade where the lobby is game-agnostic, all three game families share a common session/results flow, and the current race prototype is replaced by a real Sprint Circuit foundation.

**Architecture:** Preserve the legacy home page, but refactor the React/Socket.IO app around a neutral `PartyLobby` domain and a pluggable `GameRuntimeRegistry`. Implement the rollout in layers: party shell, shared results flow, semaforo multiplayer, rigori multiplayer, then a rebuilt Sprint Circuit race runtime.

**Tech Stack:** React, Vite, TypeScript, Canvas 2D, Socket.IO, shared domain contracts, Vitest, Node test runner

---

### Task 1: Replace the current product navigation with a party-mode hub

**Files:**
- Modify: `apps/web/src/pages/HubPage.tsx`
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/app/router.test.tsx`
- Modify: `apps/web/src/styles.css`
- Create: `apps/web/src/pages/ModeSelectPage.tsx`

**Step 1: Write the failing test**

Add route assertions that `/hub` shows mode-first navigation and no longer exposes `Bot Race` / race-first language.

```tsx
test('renders party mode entrypoints at /hub', () => {
  renderRoute('/hub');
  expect(screen.getByRole('link', { name: /singolo/i })).toHaveAttribute('href', '/hub/single');
  expect(screen.getByRole('link', { name: /multiplayer/i })).toHaveAttribute('href', '/hub/multiplayer');
  expect(screen.queryByRole('link', { name: /bot race/i })).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- src/app/router.test.tsx`
Expected: FAIL because `/hub` still exposes legacy game cards directly.

**Step 3: Write minimal implementation**

- Create a mode selection page for:
  - `/hub`
  - `/hub/single`
  - `/hub/multiplayer`
- Update the hub copy and links.
- Remove bot mode from primary navigation.

```tsx
<Link to="/hub/single">Singolo</Link>
<Link to="/hub/multiplayer">Multiplayer</Link>
```

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- src/app/router.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/pages/HubPage.tsx apps/web/src/pages/ModeSelectPage.tsx apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx apps/web/src/styles.css
git commit -m "feat: add party mode hub navigation"
```

### Task 2: Refactor shared contracts from race lobby to party lobby

**Files:**
- Modify: `packages/shared/src/lobby.ts`
- Modify: `packages/shared/src/contracts.ts`
- Modify: `packages/shared/src/contracts.test.ts`
- Modify: `packages/shared/src/index.ts`

**Step 1: Write the failing test**

Add shared-contract tests for a neutral party lobby with selected game and variant.

```ts
test('exports a party lobby shape with selected game metadata', () => {
  const lobby: PartyLobbyState = {
    code: 'ABCD12',
    hostId: 'host',
    mode: 'multiplayer',
    selectedGame: 'lights',
    selectedVariant: null,
    status: 'waiting',
    players: [],
    settings: {},
  };
  assert.equal(lobby.selectedGame, 'lights');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/shared`
Expected: FAIL because the current contracts are race-lobby-specific.

**Step 3: Write minimal implementation**

- Extend shared types with:
  - `PartyMode`
  - `PartyGame`
  - `PartyGameVariant`
  - `PartyLobbyState`
  - neutral session/result contracts
- Add new socket event names:
  - `client:select-game`
  - `client:update-lobby-settings`
  - `client:start-session`
  - `client:post-game-action`
  - `server:session-started`
  - `server:session-state`
  - `server:session-finished`

```ts
export type PartyGame = 'lights' | 'penalty' | 'race';
export type PartyGameVariant = 'sprint-circuit' | 'traffic-survival' | 'drag-sprint' | null;
```

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/shared`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/shared/src/lobby.ts packages/shared/src/contracts.ts packages/shared/src/contracts.test.ts packages/shared/src/index.ts
git commit -m "feat: add party lobby shared contracts"
```

### Task 3: Rebuild the server lobby as a neutral party lobby service

**Files:**
- Modify: `apps/server/src/lobby/service.ts`
- Modify: `apps/server/src/lobby/service.test.ts`
- Modify: `apps/server/src/socket/register.ts`
- Modify: `apps/server/src/socket/register.test.ts`
- Create: `apps/server/src/games/registry.ts`

**Step 1: Write the failing test**

Add server tests for game selection and session start independent of race.

```ts
test('host can select a game before starting the session', async () => {
  await host.trigger(SOCKET_EVENTS.client.selectGame, {
    code: 'ABCD12',
    game: 'lights',
    variant: null,
  });
  assert.equal(snapshot.selectedGame, 'lights');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/server -- src/lobby/service.test.ts src/socket/register.test.ts`
Expected: FAIL because the server only understands race start.

**Step 3: Write minimal implementation**

- Extend `LobbyService` with:
  - `selectGame`
  - `updateSettings`
  - `setStatus`
- Replace race-specific start logic with neutral session start.
- Add a registry placeholder:
  - `lights`
  - `penalty`
  - `race:sprint-circuit`

```ts
selectGame({ code, hostId, game, variant }) {
  return store.saveLobby({ ...lobby, selectedGame: game, selectedVariant: variant });
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/server -- src/lobby/service.test.ts src/socket/register.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/lobby/service.ts apps/server/src/lobby/service.test.ts apps/server/src/socket/register.ts apps/server/src/socket/register.test.ts apps/server/src/games/registry.ts
git commit -m "feat: refactor server lobby into party lobby"
```

### Task 4: Replace the current lobby UI with game selection and shared post-game actions

**Files:**
- Modify: `apps/web/src/pages/LobbyPage.tsx`
- Modify: `apps/web/src/pages/LobbyPage.test.tsx`
- Modify: `apps/web/src/lib/useLobbySocket.ts`
- Modify: `apps/web/src/styles.css`

**Step 1: Write the failing test**

Extend the lobby page test to require:
- game selection
- race variant selection
- host-only start button
- post-game action buttons stubbed in UI state

```tsx
expect(screen.getByRole('button', { name: /semaforo/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /rigori/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /corse/i })).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- src/pages/LobbyPage.test.tsx`
Expected: FAIL because the lobby is still race-oriented.

**Step 3: Write minimal implementation**

- Update the lobby hook with:
  - `selectGame`
  - `updateSettings`
  - `postGameAction`
- Replace current race-only CTA copy.
- Add inline variant picker when `Corse` is selected.

```tsx
<button onClick={() => selectGame('lights', null)}>Semaforo</button>
<button onClick={() => selectGame('penalty', null)}>Rigori</button>
<button onClick={() => selectGame('race', 'sprint-circuit')}>Sprint Circuit</button>
```

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- src/pages/LobbyPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/pages/LobbyPage.tsx apps/web/src/pages/LobbyPage.test.tsx apps/web/src/lib/useLobbySocket.ts apps/web/src/styles.css
git commit -m "feat: add game selection to party lobby"
```

### Task 5: Implement multiplayer Semaforo as the first neutral game runtime

**Files:**
- Create: `apps/server/src/games/lights/runtime.ts`
- Create: `apps/server/src/games/lights/runtime.test.ts`
- Create: `apps/web/src/pages/LightsSessionPage.tsx`
- Create: `apps/web/src/pages/LightsSessionPage.test.tsx`
- Modify: `apps/server/src/games/registry.ts`
- Modify: `apps/web/src/app/router.tsx`

**Step 1: Write the failing test**

Add a runtime test for simultaneous countdown and ranked reactions.

```ts
test('ranks players by valid reaction time after the shared lights out event', () => {
  const runtime = createLightsRuntime(seedLobby());
  const state = runtime.start();
  const resolved = runtime.applyInput(state, 'p1', { reactionAtMs: 180 });
  assert.equal(resolved.results?.rankings[0]?.playerId, 'p1');
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/server -- src/games/lights/runtime.test.ts`
- `npm run test --workspace @blitz/web -- src/pages/LightsSessionPage.test.tsx`
Expected: FAIL because there is no multiplayer lights runtime.

**Step 3: Write minimal implementation**

- Build a live simultaneous runtime with:
  - shared countdown
  - randomized lights out
  - false start handling
  - 3 rounds
  - final ranking
- Add a dedicated session page bound to neutral session events.

```ts
if (input.reactionAtMs < state.goAtMs) markFalseStart(playerId);
else saveReaction(playerId, input.reactionAtMs - state.goAtMs);
```

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/server -- src/games/lights/runtime.test.ts`
- `npm run test --workspace @blitz/web -- src/pages/LightsSessionPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/games/lights apps/web/src/pages/LightsSessionPage.tsx apps/web/src/pages/LightsSessionPage.test.tsx apps/server/src/games/registry.ts apps/web/src/app/router.tsx
git commit -m "feat: add multiplayer lights session"
```

### Task 6: Implement multiplayer Rigori as a turn-based runtime

**Files:**
- Create: `apps/server/src/games/penalty/runtime.ts`
- Create: `apps/server/src/games/penalty/runtime.test.ts`
- Create: `apps/web/src/pages/PenaltySessionPage.tsx`
- Create: `apps/web/src/pages/PenaltySessionPage.test.tsx`
- Modify: `apps/server/src/games/registry.ts`
- Modify: `apps/web/src/app/router.tsx`

**Step 1: Write the failing test**

Add a runtime test for hidden choices and server-side resolution.

```ts
test('resolves a penalty turn from hidden kick and dive choices', () => {
  const runtime = createPenaltyRuntime(seedLobby());
  const afterKick = runtime.applyInput(state, 'kicker', { lane: 'left', shot: 'power' });
  const resolved = runtime.applyInput(afterKick, 'keeper', { dive: 'right' });
  assert.equal(resolved.state.score.kicker, 1);
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/server -- src/games/penalty/runtime.test.ts`
- `npm run test --workspace @blitz/web -- src/pages/PenaltySessionPage.test.tsx`
Expected: FAIL because rigori is still local-only.

**Step 3: Write minimal implementation**

- Build a turn-based runtime with:
  - hidden inputs
  - reveal phase
  - alternating roles
  - scoreboard
  - final ranking
- Add the UI page for action selection and reveal.

```ts
if (kick.lane === dive.direction) save = true;
else goal = true;
```

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/server -- src/games/penalty/runtime.test.ts`
- `npm run test --workspace @blitz/web -- src/pages/PenaltySessionPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/games/penalty apps/web/src/pages/PenaltySessionPage.tsx apps/web/src/pages/PenaltySessionPage.test.tsx apps/server/src/games/registry.ts apps/web/src/app/router.tsx
git commit -m "feat: add multiplayer penalty session"
```

### Task 7: Replace the current race prototype with a Sprint Circuit runtime

**Files:**
- Create: `apps/server/src/games/race/sprintCircuit.ts`
- Create: `apps/server/src/games/race/sprintCircuit.test.ts`
- Create: `apps/web/src/game/sprintCircuitTrack.ts`
- Create: `apps/web/src/pages/SprintCircuitPage.tsx`
- Create: `apps/web/src/pages/SprintCircuitPage.test.tsx`
- Modify: `apps/server/src/games/registry.ts`
- Modify: `apps/web/src/lib/useLiveRaceSocket.ts`
- Modify: `apps/web/src/app/router.tsx`
- Remove or retire: `apps/server/src/race/session.ts`
- Remove or retire: `apps/server/src/race/runtime.ts`

**Step 1: Write the failing test**

Add a runtime test for real lap progress on a checkpoint-based track.

```ts
test('advances players through checkpoints on a sprint circuit track', () => {
  const runtime = createSprintCircuitRuntime(seedLobby());
  const next = runtime.applyInput(state, 'p1', { steer: 1, accelerate: true, brake: false });
  assert.equal(next.snapshot.trackId, 'sprint-circuit');
  assert.ok(next.snapshot.playersState[0].checkpoint >= 0);
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/server -- src/games/race/sprintCircuit.test.ts`
- `npm run test --workspace @blitz/web -- src/pages/SprintCircuitPage.test.tsx`
Expected: FAIL because the current race model is only the oval prototype.

**Step 3: Write minimal implementation**

- Build a new race runtime with:
  - explicit track geometry
  - checkpoint progression
  - lap completion
  - arcade acceleration/brake/steer
  - soft collisions
- Render a real top-down circuit on canvas.
- Route race sessions through the new runtime only when variant is `sprint-circuit`.

```ts
const checkpoints = [{ x: 120, y: 80 }, { x: 300, y: 80 }, { x: 300, y: 420 }, { x: 120, y: 420 }];
```

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/server -- src/games/race/sprintCircuit.test.ts`
- `npm run test --workspace @blitz/web -- src/pages/SprintCircuitPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/games/race apps/web/src/game/sprintCircuitTrack.ts apps/web/src/pages/SprintCircuitPage.tsx apps/web/src/pages/SprintCircuitPage.test.tsx apps/server/src/games/registry.ts apps/web/src/lib/useLiveRaceSocket.ts apps/web/src/app/router.tsx
git rm apps/server/src/race/session.ts apps/server/src/race/runtime.ts
git commit -m "feat: replace prototype race with sprint circuit runtime"
```

### Task 8: Introduce a shared results flow with host decisions

**Files:**
- Modify: `apps/web/src/pages/ResultsPage.tsx`
- Modify: `apps/web/src/pages/ResultsPage.test.tsx`
- Create: `apps/web/src/lib/usePostGameActions.ts`
- Modify: `apps/web/src/lib/useLobbySocket.ts`
- Modify: `apps/server/src/socket/register.ts`
- Modify: `apps/server/src/socket/register.test.ts`

**Step 1: Write the failing test**

Require the results page to render host-only post-game actions.

```tsx
expect(screen.getByRole('button', { name: /rigioca/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /torna alla lobby/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /cambia gioco/i })).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/web -- src/pages/ResultsPage.test.tsx`
- `npm run test --workspace @blitz/server -- src/socket/register.test.ts`
Expected: FAIL because results do not yet control the shared lobby flow.

**Step 3: Write minimal implementation**

- Add post-game socket actions:
  - `rematch`
  - `return-to-lobby`
  - `change-game`
- Make the results page branch on host/non-host.
- Return players to the party lobby without destroying the room.

```ts
socket.emit(SOCKET_EVENTS.client.postGameAction, { action: 'return-to-lobby' });
```

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/web -- src/pages/ResultsPage.test.tsx`
- `npm run test --workspace @blitz/server -- src/socket/register.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/pages/ResultsPage.tsx apps/web/src/pages/ResultsPage.test.tsx apps/web/src/lib/usePostGameActions.ts apps/web/src/lib/useLobbySocket.ts apps/server/src/socket/register.ts apps/server/src/socket/register.test.ts
git commit -m "feat: add shared post-game host actions"
```

### Task 9: Remove obsolete single-purpose routes and verify the party platform flow

**Files:**
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/app/router.test.tsx`
- Modify: `apps/web/src/legacy/legacyDocument.test.ts`
- Modify: `docs/plans/2026-04-24-task5-router-tdd-log.md`

**Step 1: Write the failing test**

Add integration assertions for:
- `/` legacy home preserved
- `/hub` mode selection
- `/hub/single` game selection
- `/hub/multiplayer` lobby entry
- results returning to lobby
- no primary bot route

```tsx
expect(screen.queryByRole('link', { name: /bot race/i })).not.toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web`
Expected: FAIL until old route assumptions are removed.

**Step 3: Write minimal implementation**

- Remove or redirect obsolete routes:
  - `/practice`
  - `/race/bot`
- Keep compatibility only where useful.
- Update regression docs/tests to reflect the new party architecture.

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/web`
- `npm run test --workspace @blitz/server`
- `npm run lint`
- `npm run build`
- `node --test tests/tooling-smoke.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web apps/server docs/plans
git commit -m "test: verify party arcade platform flow"
```
