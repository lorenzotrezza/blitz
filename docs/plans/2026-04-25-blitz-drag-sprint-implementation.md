# Blitz Drag Sprint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the `Drag Sprint` race variant with host-selectable `finish-line`, `best-of-3`, and `survival` modes while keeping the shared lobby/session/results architecture intact.

**Architecture:** Extend the shared race contracts with `Drag Sprint` state types, expose variant/mode selection in the neutral lobby, and add a new authoritative race runtime plus dedicated client session page. Reuse the common session/results flow already established for party arcade instead of creating a race-only branch.

**Tech Stack:** TypeScript, React, Vite, Socket.IO, Node test runner, Vitest

---

### Task 1: Add shared `Drag Sprint` contracts and shape tests

**Files:**
- Modify: `packages/shared/src/game.ts`
- Modify: `packages/shared/src/contracts.test.ts`

**Step 1: Write the failing test**

Add a contract test that requires explicit `Drag Sprint` mode and snapshot types.

```ts
test('exports the expected drag sprint snapshot shape', () => {
  const snapshot: DragSprintSnapshot = {
    sessionId: 'session-drag',
    lobbyCode: 'ABCD12',
    trackId: 'drag-strip',
    mode: 'finish-line',
    status: RACE_STATUS.racing,
    tick: 12,
    countdown: 0,
    startedAt: 1_713_980_000_000,
    distanceTarget: 1200,
    playersState: [],
    obstacles: [],
    pickups: [],
  };

  assert.equal(snapshot.mode, 'finish-line');
  assert.equal(snapshot.trackId, 'drag-strip');
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/shared`

Expected: FAIL because `DragSprintSnapshot` and related mode types do not exist yet.

**Step 3: Write minimal implementation**

Add shared types in `packages/shared/src/game.ts`:

- `DragSprintMode = 'finish-line' | 'best-of-3' | 'survival'`
- `DragSprintPowerUpType`
- `DragSprintObstacleType`
- `DragSprintPlayerState`
- `DragSprintObstacleState`
- `DragSprintPickupState`
- `DragSprintSnapshot`

Keep them separate from `Sprint Circuit` types instead of overloading the top-down race snapshot.

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/shared`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/shared/src/game.ts packages/shared/src/contracts.test.ts
git commit -m "feat: add shared drag sprint contracts"
```

### Task 2: Expose `Drag Sprint` and its rulesets in the neutral lobby

**Files:**
- Modify: `apps/web/src/lib/useLobbySocket.ts`
- Modify: `apps/web/src/pages/LobbyPage.tsx`
- Modify: `apps/web/src/pages/LobbyPage.test.tsx`
- Modify: `apps/server/src/lobby/service.test.ts`

**Step 1: Write the failing test**

Extend the lobby page test so the host can pick both race variants and the three `Drag Sprint` modes.

```tsx
expect(screen.getByRole('button', { name: /sprint circuit/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /drag sprint/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /finish line/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /best of 3/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /survival/i })).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/web -- src/pages/LobbyPage.test.tsx`
- `npm run test --workspace @blitz/server -- src/lobby/service.test.ts`

Expected: FAIL because the lobby only exposes `Sprint Circuit` and the client cannot send race mode settings.

**Step 3: Write minimal implementation**

- Add `updateSettings(settings)` to `useLobbySocket`
- Render race variant buttons:
  - `Sprint Circuit`
  - `Drag Sprint`
- When `Drag Sprint` is selected, render mode buttons:
  - `Finish Line`
  - `Best of 3`
  - `Survival`
- Store the selected mode under a lobby setting key such as `raceMode`
- Keep the flow host-only and reuse `client:update-lobby-settings`

```ts
socket.emit(SOCKET_EVENTS.client.updateLobbySettings, {
  code: joinedLobby.code,
  settings: { raceMode: 'best-of-3' },
});
```

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/web -- src/pages/LobbyPage.test.tsx`
- `npm run test --workspace @blitz/server -- src/lobby/service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/lib/useLobbySocket.ts apps/web/src/pages/LobbyPage.tsx apps/web/src/pages/LobbyPage.test.tsx apps/server/src/lobby/service.test.ts
git commit -m "feat: add drag sprint lobby selection"
```

### Task 3: Add the base server runtime for `Drag Sprint` finish-line play

**Files:**
- Create: `apps/server/src/games/race/dragSprint.ts`
- Create: `apps/server/src/games/race/dragSprint.test.ts`
- Modify: `apps/server/src/games/registry.ts`

**Step 1: Write the failing test**

Add a runtime test for the fixed-road, lane-based model.

```ts
test('advances players on a fixed three-lane drag strip with finish-line rules', () => {
  const runtime = createDragSprintRuntime(createLobby({ raceMode: 'finish-line' }), 'session-drag');
  const started = runtime.start();
  const next = runtime.applyInput('p1', { action: 'boost' });

  assert.equal(started.state.trackId, 'drag-strip');
  assert.equal(next.state.playersState[0]?.lane, 1);
  assert.equal(next.state.mode, 'finish-line');
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/server -- src/games/race/dragSprint.test.ts`

Expected: FAIL because the runtime and registry entry do not exist yet.

**Step 3: Write minimal implementation**

Implement `createDragSprintRuntime(...)` with:

- fixed `drag-strip` track id
- three lanes
- lane-change cooldown
- boost/brake handling
- deterministic obstacle and pickup spawn stream
- finish-line resolution against a fixed distance target

Wire `race:drag-sprint` into `apps/server/src/games/registry.ts`.

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/server -- src/games/race/dragSprint.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/games/race/dragSprint.ts apps/server/src/games/race/dragSprint.test.ts apps/server/src/games/registry.ts
git commit -m "feat: add drag sprint finish-line runtime"
```

### Task 4: Extend the runtime with `Best of 3`

**Files:**
- Modify: `apps/server/src/games/race/dragSprint.ts`
- Modify: `apps/server/src/games/race/dragSprint.test.ts`

**Step 1: Write the failing test**

Require the runtime to reset the strip and accumulate points across three manches.

```ts
test('tracks round wins and cumulative points in best-of-3 mode', () => {
  const runtime = createDragSprintRuntime(createLobby({ raceMode: 'best-of-3' }), 'session-drag');
  const finished = finishThreeRounds(runtime);

  assert.equal(finished.results.summary?.mode, 'best-of-3');
  assert.equal(finished.results.summary?.roundsPlayed, 3);
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/server -- src/games/race/dragSprint.test.ts`

Expected: FAIL because the runtime only knows about a single sprint.

**Step 3: Write minimal implementation**

Add round orchestration:

- reset player lanes between manches
- keep points and round wins in session state
- finish after three completed manches
- emit rankings ordered by total points, then tiebreak by cumulative time

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/server -- src/games/race/dragSprint.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/games/race/dragSprint.ts apps/server/src/games/race/dragSprint.test.ts
git commit -m "feat: add drag sprint best-of-3 mode"
```

### Task 5: Extend the runtime with `Survival`

**Files:**
- Modify: `apps/server/src/games/race/dragSprint.ts`
- Modify: `apps/server/src/games/race/dragSprint.test.ts`

**Step 1: Write the failing test**

Require elimination/survival scoring.

```ts
test('finishes survival mode when one driver remains active', () => {
  const runtime = createDragSprintRuntime(createLobby({ raceMode: 'survival' }), 'session-drag');
  const finished = eliminateToLastDriver(runtime);

  assert.equal(finished.results.summary?.mode, 'survival');
  assert.equal(finished.results.rankings[0]?.rank, 1);
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/server -- src/games/race/dragSprint.test.ts`

Expected: FAIL because there is no elimination logic.

**Step 3: Write minimal implementation**

Add survival-specific rules:

- player elimination after lethal hit/timeout state
- last active driver wins
- fallback ranking by survival time or covered distance

Keep the underlying strip and obstacle model shared with the other modes.

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/server -- src/games/race/dragSprint.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/server/src/games/race/dragSprint.ts apps/server/src/games/race/dragSprint.test.ts
git commit -m "feat: add drag sprint survival mode"
```

### Task 6: Build the `Drag Sprint` session page and route wiring

**Files:**
- Create: `apps/web/src/game/dragSprintRoad.ts`
- Create: `apps/web/src/pages/DragSprintPage.tsx`
- Create: `apps/web/src/pages/DragSprintPage.test.tsx`
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/lib/sessionRoutes.ts`

**Step 1: Write the failing test**

Add a page test that requires a fixed road, mode label, and lane-based controls.

```tsx
test('renders the drag sprint session with fixed-road controls', () => {
  renderRoute('/session/race/drag/session-1');

  expect(screen.getByRole('heading', { name: /drag sprint/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/drag sprint canvas/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /corsia sx/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /boost/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/web -- src/pages/DragSprintPage.test.tsx`

Expected: FAIL because the route and page do not exist.

**Step 3: Write minimal implementation**

- Create a fixed-road canvas renderer with three lanes
- Render obstacles, pickups, player cars, and active effects
- Add buttons for lane changes, boost, and brake
- Route `variant: drag-sprint` to a dedicated page such as `/session/race/drag/:sessionId`

```ts
if (payload.game === 'race' && payload.variant === 'drag-sprint') {
  return `/session/race/drag/${payload.sessionId}`;
}
```

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/web -- src/pages/DragSprintPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/game/dragSprintRoad.ts apps/web/src/pages/DragSprintPage.tsx apps/web/src/pages/DragSprintPage.test.tsx apps/web/src/app/router.tsx apps/web/src/lib/sessionRoutes.ts
git commit -m "feat: add drag sprint session page"
```

### Task 7: Show drag-sprint summaries in the shared results page

**Files:**
- Modify: `apps/web/src/pages/ResultsPage.tsx`
- Modify: `apps/web/src/pages/ResultsPage.test.tsx`

**Step 1: Write the failing test**

Require the shared results page to render mode-specific summary rows.

```tsx
expect(screen.getByText(/mode: best-of-3/i)).toBeInTheDocument();
expect(screen.getByText(/rounds played: 3/i)).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/web -- src/pages/ResultsPage.test.tsx`

Expected: FAIL because the page only renders rankings.

**Step 3: Write minimal implementation**

- Read `payload.results.summary`
- Render a compact summary block above rankings
- Keep legacy race payload normalization intact

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/web -- src/pages/ResultsPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/pages/ResultsPage.tsx apps/web/src/pages/ResultsPage.test.tsx
git commit -m "feat: show drag sprint summaries in shared results"
```

### Task 8: Verify the full party arcade flow with the new race variant

**Files:**
- Modify: `apps/web/src/app/router.test.tsx`
- Modify: `apps/server/src/socket/register.test.ts`

**Step 1: Write the failing test**

Add flow assertions for:

- `Drag Sprint` visible in lobby race selection
- mode-specific route resolution
- session start for `race:drag-sprint`
- results still returning through common post-game flow

```tsx
expect(screen.getByRole('button', { name: /drag sprint/i })).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @blitz/server -- src/socket/register.test.ts`
- `npm run test --workspace @blitz/web -- src/app/router.test.tsx`

Expected: FAIL until the full flow is wired.

**Step 3: Write minimal implementation**

Fill the last glue code:

- socket tests for drag sprint session start
- router/session route tests for drag sprint page
- any missing payload shape or lobby settings defaults

**Step 4: Run test to verify it passes**

Run:
- `npm run build --workspace @blitz/shared`
- `npm run test --workspace @blitz/server`
- `npm run test --workspace @blitz/web`
- `npm run lint`
- `npm run build`
- `node --test tests/tooling-smoke.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/router.test.tsx apps/server/src/socket/register.test.ts
git commit -m "test: verify drag sprint party flow"
```
