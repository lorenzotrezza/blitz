# Blitz Hybrid Pixel App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the current mixed legacy/new app into a coherent hybrid pixel app with a 10bit hub, reusable legacy minigames, native practice/bot race pages, and a real lobby UI wired to the existing Socket.IO backend.

**Architecture:** Preserve the legacy `index.html` as the home flow and source of existing minigames, but build the rest of the experience as native React routes inside `apps/web`. Use a shared retro shell, a shared native race canvas component for practice/bot, and a web socket client layer for live lobby interactions against the current server.

**Tech Stack:** React, Vite, TypeScript, Canvas 2D, Socket.IO client, Vitest, Testing Library

---

### Task 1: Apply the 10bit visual system to the new app

**Files:**
- Modify: `apps/web/index.html`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/pages/HubPage.tsx`
- Test: `apps/web/src/app/router.test.tsx`

**Step 1: Write the failing test**

Extend router tests to assert the hub exposes the real game entries and uses the 10bit copy language instead of the temporary generic shell.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- src/app/router.test.tsx`
Expected: FAIL because the current hub styling/content is still generic.

**Step 3: Write minimal implementation**

Replace the glossy shell styling with legacy-inspired palette, font, and panel language.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- src/app/router.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/index.html apps/web/src/styles.css apps/web/src/app/router.tsx apps/web/src/pages/HubPage.tsx apps/web/src/app/router.test.tsx
git commit -m "style: apply pixel theme to the new app"
```

### Task 2: Build a shared native retro race surface

**Files:**
- Create: `apps/web/src/game/raceData.ts`
- Create: `apps/web/src/game/useRetroRace.ts`
- Create: `apps/web/src/components/RetroRaceView.tsx`
- Create: `apps/web/src/components/RetroHud.tsx`
- Create: `apps/web/src/game/useRetroRace.test.ts`
- Modify: `apps/web/src/styles.css`

**Step 1: Write the failing test**

Add a focused test for the shared race hook covering slower steering and state reset behavior.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- src/game/useRetroRace.test.ts`
Expected: FAIL because the shared race system does not exist yet.

**Step 3: Write minimal implementation**

Create a reusable retro race engine and render layer for practice and bot race.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- src/game/useRetroRace.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/game apps/web/src/components apps/web/src/styles.css
git commit -m "feat: add shared retro race surface"
```

### Task 3: Turn practice and bot race into real pages

**Files:**
- Modify: `apps/web/src/pages/PracticePage.tsx`
- Modify: `apps/web/src/pages/BotRacePage.tsx`
- Modify: `apps/web/src/app/router.test.tsx`

**Step 1: Write the failing test**

Extend route tests to verify `/practice` and `/race/bot` render the native race HUD/canvas experience.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- src/app/router.test.tsx`
Expected: FAIL because both routes are placeholders.

**Step 3: Write minimal implementation**

Use the shared retro race surface to provide:
- solo practice
- bot race with AI entrants

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- src/app/router.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/pages/PracticePage.tsx apps/web/src/pages/BotRacePage.tsx apps/web/src/app/router.test.tsx
git commit -m "feat: add native practice and bot race pages"
```

### Task 4: Wire the lobby page to the live server

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/socket.ts`
- Create: `apps/web/src/lib/useLobbySocket.ts`
- Modify: `apps/web/src/pages/LobbyPage.tsx`
- Create: `apps/web/src/pages/LobbyPage.test.tsx`

**Step 1: Write the failing test**

Add a lobby page test for displaying the route code, nickname entry, and a ready/leave interaction contract.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web -- src/pages/LobbyPage.test.tsx`
Expected: FAIL because the lobby page is static.

**Step 3: Write minimal implementation**

Add a socket client and wire create/join/ready/leave flows to the existing backend lobby events.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @blitz/web -- src/pages/LobbyPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/package.json apps/web/src/lib apps/web/src/pages/LobbyPage.tsx apps/web/src/pages/LobbyPage.test.tsx package-lock.json
git commit -m "feat: connect live lobby page to sockets"
```

### Task 5: Verify the hybrid app end-to-end

**Files:**
- Modify: `apps/web/src/legacy/legacyDocument.test.ts`
- Modify: `docs/plans/2026-04-24-task5-router-tdd-log.md`

**Step 1: Write the failing test**

Add or extend assertions for:
- legacy home preserved
- minigames launched through hub
- practice and bot routes native
- lobby route remains live

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @blitz/web`
Expected: FAIL until all pages are wired.

**Step 3: Write minimal implementation**

Tighten docs/test expectations without expanding scope beyond the approved hybrid model.

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @blitz/web`
- `npm run lint --workspace @blitz/web`
- `npm run build --workspace @blitz/web`
- `npm run build`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web docs/plans package-lock.json
git commit -m "test: verify hybrid pixel app integration"
```
