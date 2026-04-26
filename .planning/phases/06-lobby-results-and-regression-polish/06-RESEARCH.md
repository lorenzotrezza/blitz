# Phase 06: Lobby, Results, And Regression Polish - Research

**Researched:** 2026-04-26
**Domain:** React/Vite lobby UI, Socket.IO session routing, shared race variant contracts, results rendering, regression verification
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

Source for this section: [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

### Locked Decisions

## Implementation Decisions

### Race Catalog Presentation
- **D-01:** Replace the old user-facing race labels with the final four race modes: Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track.
- **D-02:** Lobby race selection should make each mode mechanically distinct at a glance. Each option should show a short objective, primary control method, and skill focus.
- **D-03:** Recommended order is skill progression: Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track.
- **D-04:** Do not keep old duplicate-feeling labels such as generic Sprint Circuit or Drag Sprint as the primary catalog experience. Legacy ids may remain as compatibility aliases only if needed during migration.
- **D-05:** Semaforo and Rigori should remain visible and startable. Phase 6 should not make the app feel race-only outside the race catalog section.
- **D-06:** Race catalog copy should be concise enough for phone lobby use. Avoid long instructional paragraphs in the lobby; detailed feedback belongs in gameplay HUD and results.

### Variant Routing Shape
- **D-07:** Use one canonical shared variant identity per final race mode so lobby selection, runtime registry, session routing, HUD mode, and results agree.
- **D-08:** A single fullscreen race route can remain acceptable if it is mode-aware, but it must not hardcode every race session to the old circle/sprint-circuit behavior.
- **D-09:** Prefer a route/page structure with small per-mode adapters for HUD mapping, controls, canvas/track rendering, and result storage rather than growing one large `SprintCircuitPage` with all mode logic inline.
- **D-10:** `resolveSessionRoute()` must route race sessions in a way that preserves the selected variant and opens the correct fullscreen game screen for that variant.
- **D-11:** Server runtime registry and shared startability rules must expose all four final race variants as startable through the lobby flow.
- **D-12:** Existing session events remain the active contract family: `client:game-input`, `server:session-state`, and `server:session-finished`.

### Mode-Specific Results
- **D-13:** Results should keep the shared ranking list, then add a concise mode-specific summary for each player or ranking row when data exists.
- **D-14:** Drag Gear results should show finish time plus shift performance summary: perfect, good, early, late, and total shifts.
- **D-15:** Straight Obstacle results should show finish time plus obstacle hit count and, if available, slowdown or penalty count.
- **D-16:** Circle Track results should show finish time, laps completed, and penalty count.
- **D-17:** Figure-Eight Track results should show finish time, laps or checkpoint completion, and penalty count, with crossing-specific penalties included only if the runtime exposes them.
- **D-18:** Results rendering should degrade gracefully when older or partial payloads lack mode-specific fields. The page should still show rankings rather than breaking.
- **D-19:** Post-game host actions remain unchanged in scope: rematch, return to lobby, and change game should still work after mode-specific result rendering.

### Regression Gate Depth
- **D-20:** Phase 6 should include web tests for lobby catalog rendering, variant selection/startability, route resolution, and mode-specific result copy.
- **D-21:** Phase 6 should include shared/server tests that prove all four race variants are registered and startable through the authoritative server flow.
- **D-22:** Existing Semaforo, Rigori, lobby invite/join, ready/start, result navigation, rematch, return-to-lobby, and change-game flows must continue to pass.
- **D-23:** Root `pnpm test` and `pnpm run build` are required before the milestone can be considered complete.
- **D-24:** Manual mobile viewport verification is required before completion because this phase owns the whole phone party flow, not only individual components.
- **D-25:** Do not let regression polish expand into reconnect identity, persistence, leaderboards, or broad socket hardening unless a defect directly blocks the Phase 6 party flow.

### Claude's Discretion
- Exact visual form of lobby race options: compact cards, segmented controls with details, or another mobile-readable pattern consistent with existing app styling.
- Exact shared variant id names, provided they map one-to-one to the final four modes and avoid user-facing legacy labels.
- Whether results summaries are implemented inline in `ResultsPage` or through extracted mode-summary helpers.
- Exact test split across shared, server, web, and root smoke tests, provided the Phase 6 regression gate covers the stated party flows.

### Deferred Ideas (OUT OF SCOPE)
- Persistent leaderboards, accounts, high scores, and shareable recap cards remain v2 scope.
- Reconnect identity, socket hardening, payload schema validation, CORS hardening, and lobby TTL/capacity policy remain outside Phase 6 unless they directly block the party flow.
- Sound, haptics, camera effects, advanced visual juice, car-specific handling, and powerups remain polish or later gameplay scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-01 | Host can choose distinct race variants for Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track from the lobby. | Update `PARTY_GAME_VARIANTS`, `isLobbySelectionStartable()`, `LobbyPage` race catalog, and registry tests so the four final race variants are selectable/startable. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/web/src/pages/LobbyPage.tsx] |
| FLOW-02 | Lobby UI explains each race variant's objective and primary control method. | Add concise objective/control/skill-focus copy in the race catalog UI; current `LobbyPage` only shows two button labels. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: apps/web/src/pages/LobbyPage.tsx] |
| FLOW-03 | Session routing opens the correct fullscreen game screen for each selected race variant. | Extend `resolveSessionRoute()` and router tests; current route resolver special-cases `drag-sprint` and sends other race variants to `/race/live/:sessionId`. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: apps/web/src/app/router.tsx] |
| FLOW-04 | Results page can display mode-specific summaries for timing, shifts, obstacle hits, laps, and penalties. | Keep shared rankings and add mode-specific summary helpers that tolerate missing `results.summary` fields. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: packages/shared/src/contracts.ts] |
| FLOW-05 | Existing non-race minigames and lobby post-game actions keep working after race rebuild. | Preserve Semaforo/Rigori buttons, `usePostGameActions()`, and host actions `rematch`, `return-to-lobby`, `change-game`. [VERIFIED: apps/web/src/pages/LobbyPage.tsx; VERIFIED: apps/web/src/lib/usePostGameActions.ts; VERIFIED: apps/server/src/socket/register.ts] |
| ARCH-03 | Web tests cover core route rendering, control availability, and mode-specific HUD copy. | Extend existing Vitest/Testing Library page/router tests; the test suite already covers `LobbyPage`, `ResultsPage`, `router`, race pages, and gameplay controls. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/codebase/TESTING.md; VERIFIED: find apps packages tests -name '*.test.*'] |
| ARCH-04 | Root build/test commands pass before the milestone is considered complete. | Final phase gate must run `pnpm test` and `pnpm run build`; these commands are root scripts. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: package.json; VERIFIED: AGENTS.md] |
</phase_requirements>

## Summary

Phase 06 should be planned as an integration and regression phase, not a mechanics phase. The four race mechanics should already exist or be gated as prerequisites; this phase makes the canonical catalog, route resolver, registry/startability rules, result summaries, and regression tests agree on the final four modes. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: .planning/ROADMAP.md]

The highest-risk current integration mismatch is identity drift. The source tree currently exposes `sprint-circuit`, `drag-sprint`, and an unused `traffic-survival` shared variant, while Phase 06 requires final user-facing modes Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/games/registry.ts; VERIFIED: apps/web/src/pages/LobbyPage.tsx; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

**Primary recommendation:** Use `packages/shared/src/lobby.ts` as the canonical race catalog source, add one final variant id per final race mode, update registry/startability/session routing/results off those ids, and put tests at each boundary before running the root gate. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/games/registry.ts; VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: apps/web/src/pages/ResultsPage.tsx]

## Project Constraints (from AGENTS.md)

- Keep the current pnpm workspace architecture. [VERIFIED: AGENTS.md; VERIFIED: pnpm-workspace.yaml]
- Source of truth is `apps/**/src` and `packages/shared/src`. [VERIFIED: AGENTS.md]
- Server gameplay state is authoritative. [VERIFIED: AGENTS.md; VERIFIED: .planning/codebase/ARCHITECTURE.md]
- Put shared socket/input/snapshot contracts in `packages/shared`. [VERIFIED: AGENTS.md; VERIFIED: packages/shared/src/contracts.ts; VERIFIED: packages/shared/src/game.ts]
- Prefer deterministic rule helpers with tests over adding more logic to large runtime files. [VERIFIED: AGENTS.md; VERIFIED: .planning/codebase/CONCERNS.md]
- Gameplay screens must be mobile-first and fullscreen. [VERIFIED: AGENTS.md; VERIFIED: apps/web/src/components/game/FullscreenGameShell.tsx]
- Required completion checks are `pnpm run build`, `pnpm test`, and focused tests for changed packages when useful. [VERIFIED: AGENTS.md; VERIFIED: package.json]
- Render Free deployment remains the low-cost target with build command `corepack enable && pnpm install --frozen-lockfile && pnpm run build`, start command `pnpm start`, and health check `/health`. [VERIFIED: AGENTS.md; VERIFIED: render.yaml]
- No `CLAUDE.md` exists in the project root. [VERIFIED: test -f CLAUDE.md]
- No project-local `.agents/skills` or `.claude/skills` directory exists. [VERIFIED: find .agents .claude -maxdepth 3 -name SKILL.md -print]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Canonical race variant ids | Shared Contracts | Server/Web | Variant ids must be shared by lobby selection, registry resolution, routing, HUD, and results. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/games/registry.ts; VERIFIED: apps/web/src/lib/sessionRoutes.ts] |
| Lobby catalog copy and mobile selection UI | Browser / Client | Shared Contracts | The browser renders objective/control/skill-focus copy, but the allowed ids must come from shared constants. [VERIFIED: apps/web/src/pages/LobbyPage.tsx; VERIFIED: packages/shared/src/lobby.ts] |
| Startability enforcement | Shared Contracts | API / Backend | Shared `isLobbySelectionStartable()` is checked by the web for button state and by the server before session start. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/socket/register.ts] |
| Authoritative session start and registry resolution | API / Backend | Shared Contracts | `registerSockets()` validates startability and resolves the selected game/variant through `createGameRuntimeRegistry()`. [VERIFIED: apps/server/src/socket/register.ts; VERIFIED: apps/server/src/games/registry.ts] |
| Fullscreen race screen routing | Browser / Client | Shared Contracts | `resolveSessionRoute()` maps `SessionStartedPayload` to route paths, and the router keeps race routes outside `AppLayout`. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: apps/web/src/app/router.tsx] |
| Mode-specific results display | Browser / Client | Shared Contracts / API | Results render from `SessionFinishedPayload.results`; server runtimes own summary data, browser helpers format it. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: apps/server/src/games/manager.ts] |
| Regression verification | Workspace Orchestration | Package tests | Root scripts compose shared, server, web, and root smoke tests. [VERIFIED: package.json; VERIFIED: .planning/codebase/TESTING.md] |

## Standard Stack

### Core

| Library | Project Version | Registry Check | Purpose | Why Standard |
|---------|-----------------|----------------|---------|--------------|
| React | `^19.2.0` in `@blitz/web` | latest `19.2.5` as of `npm view react version` on 2026-04-26; installed range should remain unchanged for this phase. [VERIFIED: apps/web/package.json; VERIFIED: npm registry] | Route/page UI and component rendering. | Existing app is React page/component based. [VERIFIED: apps/web/src/app/router.tsx; VERIFIED: apps/web/src/pages/LobbyPage.tsx] |
| React Router DOM | `^7.9.4` in `@blitz/web` | latest `7.14.2` as of `npm view react-router-dom version` on 2026-04-26; installed range should remain unchanged for this phase. [VERIFIED: apps/web/package.json; VERIFIED: npm registry] | Browser and memory routing. | Existing app centralizes routes in `createAppRouter()`. [VERIFIED: apps/web/src/app/router.tsx; VERIFIED: apps/web/src/app/router.test.tsx] |
| Socket.IO / socket.io-client | `^4.8.3` in server/web | latest `4.8.3` as of `npm view socket.io version` and `npm view socket.io-client version` on 2026-04-26. [VERIFIED: apps/server/package.json; VERIFIED: apps/web/package.json; VERIFIED: npm registry] | Realtime lobby/session/results events. | Existing active contract family is Socket.IO `client:game-input`, `server:session-state`, and `server:session-finished`. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/server/src/socket/register.ts] |
| Express | `^5.2.1` in `@blitz/server` | latest `5.2.1` as of `npm view express version` on 2026-04-26. [VERIFIED: apps/server/package.json; VERIFIED: npm registry] | Server HTTP app and `/health`. | Existing Render target and bootstrap smoke use Express health. [VERIFIED: apps/server/src/app.ts; VERIFIED: render.yaml; VERIFIED: tests/bootstrap-smoke.mjs] |
| TypeScript | `^5.6.3` in all packages | latest `6.0.3` as of `npm view typescript version` on 2026-04-26; do not upgrade in Phase 06. [VERIFIED: apps/web/package.json; VERIFIED: apps/server/package.json; VERIFIED: packages/shared/package.json; VERIFIED: npm registry] | Strict shared contracts and package type checks. | Existing lint scripts are `tsc --noEmit`. [VERIFIED: package.json; VERIFIED: .planning/codebase/CONVENTIONS.md] |

### Supporting

| Library | Project Version | Registry Check | Purpose | When to Use |
|---------|-----------------|----------------|---------|-------------|
| Vite | `^5.4.11` in `@blitz/web` | latest `8.0.10` as of `npm view vite version` on 2026-04-26; do not upgrade in Phase 06. [VERIFIED: apps/web/package.json; VERIFIED: npm registry] | Web dev/build and Vitest config host. | Use existing Vite build; avoid bundler migration during regression polish. [VERIFIED: apps/web/vite.config.ts; VERIFIED: package.json] |
| Vitest | `^3.2.4` in `@blitz/web` | latest `4.1.5` as of `npm view vitest version` on 2026-04-26; do not upgrade in Phase 06. [VERIFIED: apps/web/package.json; VERIFIED: npm registry] | Web component/page/router tests. | Use existing Testing Library patterns for lobby, route, race page, and results tests. [VERIFIED: .planning/codebase/TESTING.md] |
| Node built-in test runner | Node `v24.14.1` installed locally | available via `node --version`. [VERIFIED: node --version] | Server/shared/root tests. | Use for shared contract, registry, socket, root smoke, and flow tests. [VERIFIED: apps/server/package.json; VERIFIED: packages/shared/package.json; VERIFIED: package.json] |
| pnpm | `10.33.2` installed locally and declared in root | available via `pnpm --version`; root declares `pnpm@10.33.2`. [VERIFIED: pnpm --version; VERIFIED: package.json] | Workspace scripts and Render build. | Required for all package checks. [VERIFIED: package.json; VERIFIED: render.yaml] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing React/Vite/Router stack | Upgrade Vite/Vitest/Router/TypeScript first | Adds dependency migration risk unrelated to Phase 06 success criteria. [VERIFIED: package.json; VERIFIED: npm registry; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md] |
| Shared constants in `packages/shared/src/lobby.ts` | Hardcoded web-only race cards | Would let lobby copy drift from server startability and registry ids. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/socket/register.ts] |
| Existing Socket.IO session events | Add race-specific event family | Stale race-specific events already exist but active server flow uses generic session events. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/server/src/socket/register.ts; VERIFIED: .planning/codebase/CONCERNS.md] |

**Installation:**
```bash
# No new runtime packages required for Phase 06.
pnpm install --frozen-lockfile
```

**Version verification:** Package versions were checked with `npm view` on 2026-04-26 and local availability was checked with `node --version`, `pnpm --version`, and `npm --version`. [VERIFIED: npm registry; VERIFIED: node --version; VERIFIED: pnpm --version; VERIFIED: npm --version]

## Architecture Patterns

### System Architecture Diagram

```text
Host taps final race card in LobbyPage
  -> selectGame(code, 'race', finalVariant)
  -> client:select-game
  -> registerSockets()
  -> LobbyService.selectGame()
  -> server:lobby-updated
  -> LobbyPage recalculates canStart via isLobbySelectionStartable()
  -> host taps Avvia Sessione
  -> client:start-session
  -> registerSockets() validates readiness + startability
  -> createGameRuntimeRegistry().resolve('race', finalVariant)
  -> GameManager.startLobbySession()
  -> runtime emits server:session-state
  -> server:session-started
  -> resolveSessionRoute(payload)
  -> fullscreen race route outside AppLayout
  -> runtime emits server:session-finished
  -> live page stores blitz-results:{sessionId}
  -> ResultsPage reads payload and renders ranking + mode summary
  -> usePostGameActions handles rematch / return-to-lobby / change-game
```

The current flow already follows this shape for existing games and race variants. [VERIFIED: .planning/codebase/ARCHITECTURE.md; VERIFIED: apps/server/src/socket/register.ts; VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: apps/web/src/pages/ResultsPage.tsx]

### Recommended Project Structure

```text
packages/shared/src/
├── lobby.ts              # canonical final race variants and startability
├── game.ts               # shared race summary/input/snapshot types if missing
└── contracts.ts          # SessionFinishedPayload and GameResults shape

apps/server/src/games/
├── registry.ts           # runtime entries for all four final race variants
└── registry.test.ts      # registration/startability regression coverage

apps/web/src/lib/
├── sessionRoutes.ts      # variant-to-fullscreen-route mapping
└── sessionRoutes.test.ts # add if route helper tests stay separate from router tests

apps/web/src/pages/
├── LobbyPage.tsx         # final race catalog cards/copy
├── ResultsPage.tsx       # shared rankings plus mode-summary mount point
└── *RacePage.tsx         # existing/dedicated fullscreen race pages

apps/web/src/components/game/
└── *ResultsSummary.tsx   # small mode-specific result helpers if extracted
```

This structure matches existing package responsibilities and file naming conventions. [VERIFIED: .planning/codebase/STRUCTURE.md; VERIFIED: .planning/codebase/CONVENTIONS.md]

### Pattern 1: Canonical Variant Metadata in Shared Code

**What:** Define one final id per race mode and optionally a typed metadata table that gives the web catalog its labels/objective/control/skill text. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

**When to use:** Use this when the same variant ids must drive lobby UI, startability, registry resolution, route resolution, HUD mode selection, and result summary branching. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/games/registry.ts; VERIFIED: apps/web/src/lib/sessionRoutes.ts]

**Example:**
```typescript
// Source: packages/shared/src/lobby.ts and Phase 06 context.
export const PARTY_GAME_VARIANTS = {
  dragGear: 'drag-gear',
  straightObstacle: 'straight-obstacle',
  circleTrack: 'circle-track',
  figureEightTrack: 'figure-eight-track',
} as const;
```

If prior phases already introduced `straight-obstacle`, `circle-track`, or `figure-eight-track`, Phase 06 should normalize around those existing ids instead of creating aliases. [VERIFIED: .planning/phases/03-straight-obstacle-race/03-RESEARCH.md; VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; VERIFIED: .planning/phases/05-figure-eight-analog-track-race/05-RESEARCH.md]

### Pattern 2: Small Route Adapters per Race Mode

**What:** Keep the top-level fullscreen route property, but route each variant to either a dedicated page or a mode-aware adapter that selects HUD, controls, viewport, and result storage by variant. [VERIFIED: apps/web/src/app/router.tsx; VERIFIED: apps/web/src/pages/DragGearRacePage.tsx; VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx]

**When to use:** Use this for FLOW-03 so `resolveSessionRoute()` cannot accidentally send all future race modes to old `SprintCircuitPage` behavior. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

**Example:**
```typescript
// Source: apps/web/src/lib/sessionRoutes.ts pattern.
if (payload.game === 'race' && payload.variant === PARTY_GAME_VARIANTS.dragGear) {
  return `/race/drag/${payload.sessionId}`;
}
```

### Pattern 3: Result Summary Helpers That Render Nothing When Data Is Missing

**What:** Keep `ResultsPage` responsible for rankings and post-game actions, but delegate mode-specific details to narrow helpers that accept `payload.results.summary` and ranking context. [VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

**When to use:** Use this for FLOW-04 because old or partial results may not include mode-specific fields. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: packages/shared/src/contracts.ts]

**Example:**
```typescript
// Source: ResultsPage summary extension pattern.
function DragGearResultsSummary({ summary }: { summary?: GameResults['summary'] }) {
  if (
    typeof summary?.perfectShifts !== 'number' ||
    typeof summary?.totalShifts !== 'number'
  ) {
    return null;
  }

  return <section aria-label="Drag Gear summary">...</section>;
}
```

### Anti-Patterns to Avoid

- **Hardcoding all race sessions to `/race/live/:sessionId`:** This preserves the old sprint/circle behavior and violates variant-aware routing. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]
- **Renaming labels only:** The lobby currently only exposes two race buttons; Phase 06 requires all four final variants with distinct objective/control/skill copy. [VERIFIED: apps/web/src/pages/LobbyPage.tsx; VERIFIED: .planning/REQUIREMENTS.md]
- **Computing authoritative results in the browser:** Server runtimes own final outcomes; the browser should only format payload data. [VERIFIED: AGENTS.md; VERIFIED: apps/server/src/games/manager.ts; VERIFIED: packages/shared/src/contracts.ts]
- **Breaking Semaforo/Rigori visibility:** Phase 06 explicitly preserves non-race minigames in the party flow. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: apps/web/src/pages/LobbyPage.tsx]
- **Expanding into reconnect or persistence:** Existing reconnect/persistence gaps are known but out of scope unless they block the Phase 06 party flow. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: .planning/codebase/CONCERNS.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Realtime contract names | A new event family for race catalog/results | Existing `client:game-input`, `server:session-state`, `server:session-finished` | These are the active events used by the server gateway and web hooks. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/server/src/socket/register.ts] |
| Routing state management | Custom global state/router outside React Router | Existing `resolveSessionRoute()` and `createAppRouter()` | Existing tests already exercise memory-router route rendering. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: apps/web/src/app/router.test.tsx] |
| Result persistence during navigation | New browser storage scheme | Existing `sessionStorage` key `blitz-results:{sessionId}` | All live session pages already use this pattern. [VERIFIED: grep blitz-results; VERIFIED: apps/web/src/pages/ResultsPage.tsx] |
| Lobby active state | New client persistence key | Existing `localStorage` key `blitz-active-lobby` | Hub and Results already read this key. [VERIFIED: apps/web/src/lib/useLobbySocket.ts; VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: apps/web/src/pages/HubPage.tsx] |
| Runtime registry | Ad hoc variant switch in socket handler | `createGameRuntimeRegistry().resolve(game, variant)` | Server already centralizes runtime resolution there. [VERIFIED: apps/server/src/socket/register.ts; VERIFIED: apps/server/src/games/registry.ts] |
| Web tests | New browser E2E framework for this phase | Existing Vitest/Testing Library and Node smoke tests | Phase 06 success criteria require regression confidence, but no E2E framework exists and adding one is not necessary to satisfy current checks. [VERIFIED: .planning/codebase/TESTING.md; VERIFIED: package.json] |

**Key insight:** Phase 06 is about keeping existing contracts aligned across tiers; custom parallel catalogs, routes, storage, or event families would create exactly the drift this phase is meant to remove. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: .planning/codebase/CONCERNS.md]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Server lobby/session state is process-local in memory maps; browser stores active lobby in `localStorage` under `blitz-active-lobby` and results in `sessionStorage` under `blitz-results:{sessionId}`. [VERIFIED: apps/server/src/lobby/store.ts; VERIFIED: apps/server/src/games/manager.ts; VERIFIED: grep blitz-results/blitz-active-lobby] | Do not migrate server data; add graceful result rendering for older/partial browser payloads. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: apps/web/src/pages/ResultsPage.tsx] |
| Live service config | `render.yaml` exists and contains service/build/start/health config but no race variant labels. [VERIFIED: render.yaml; VERIFIED: grep render.yaml] | No race-label config migration required; keep build/start/health checks intact. [VERIFIED: render.yaml; VERIFIED: AGENTS.md] |
| OS-registered state | No OS-level registration files were found in the repo scan. [VERIFIED: find . -maxdepth 4 -name '.env*' -o -name '*sqlite*' -o -name '*.db' -o -name '*.sqlite'] | None. [VERIFIED: local filesystem scan] |
| Secrets/env vars | No `.env*` files were found; `render.yaml` has only `NODE_ENV=production`. [VERIFIED: find . -maxdepth 4 -name '.env*'; VERIFIED: render.yaml] | No secret/env var rename required. [VERIFIED: render.yaml] |
| Build artifacts | `apps/**/dist` and `packages/shared/dist` exist and should be treated as generated; root also has both `pnpm-lock.yaml` and `package-lock.json`. [VERIFIED: find apps packages tests -maxdepth 4 -type f; VERIFIED: .planning/codebase/CONCERNS.md] | Edit only source in `apps/**/src` and `packages/shared/src`; run build to refresh generated output only if build scripts do so. [VERIFIED: AGENTS.md; VERIFIED: package.json] |

## Common Pitfalls

### Pitfall 1: Variant Identity Drift

**What goes wrong:** Lobby labels, shared ids, registry keys, route paths, HUD modes, and result branches use different names for the same final mode. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/games/registry.ts; VERIFIED: apps/web/src/lib/sessionRoutes.ts]

**Why it happens:** Current code still has old ids and labels such as `sprint-circuit`, `drag-sprint`, and unused `traffic-survival`. [VERIFIED: grep Sprint Circuit/Drag Sprint/sprint-circuit/drag-sprint/traffic-survival]

**How to avoid:** Choose one canonical id per final mode in shared code, then update every branch from shared constants rather than string literals. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

**Warning signs:** Tests still assert `Sprint Circuit` or `Drag Sprint` as primary catalog labels after Phase 06. [VERIFIED: apps/web/src/pages/LobbyPage.test.tsx]

### Pitfall 2: `SprintCircuitPage` Becomes the New Monolith

**What goes wrong:** A single page accumulates all race-specific HUD/control/canvas/result logic. [VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

**Why it happens:** Current non-drag race routing falls back to `/race/live/:sessionId`. [VERIFIED: apps/web/src/lib/sessionRoutes.ts]

**How to avoid:** Use dedicated pages or small per-mode adapters with shared fullscreen shell primitives. [VERIFIED: apps/web/src/components/game/FullscreenGameShell.tsx; VERIFIED: apps/web/src/pages/DragGearRacePage.tsx]

**Warning signs:** `useLiveRaceSocket` still filters only `PARTY_GAME_VARIANTS.sprintCircuit` after new variants are registered. [VERIFIED: apps/web/src/lib/useLiveRaceSocket.ts]

### Pitfall 3: Results Break on Older Payloads

**What goes wrong:** Mode-specific summaries assume fields exist and prevent rankings from rendering. [VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

**Why it happens:** `GameResults.summary` is optional and generic. [VERIFIED: packages/shared/src/contracts.ts]

**How to avoid:** Keep ranking rendering independent and make each summary helper return `null` when required fields are absent. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/web/src/pages/ResultsPage.tsx]

**Warning signs:** Tests only cover happy-path full summaries and not partial or missing summaries. [VERIFIED: apps/web/src/pages/ResultsPage.test.tsx]

### Pitfall 4: Regression Gate Skips Non-Race Flow

**What goes wrong:** Race catalog tests pass, but Semaforo, Rigori, invite, ready, rematch, return-to-lobby, or change-game regress. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

**Why it happens:** Phase 06 touches shared lobby selection and results surfaces used by every game. [VERIFIED: apps/web/src/pages/LobbyPage.tsx; VERIFIED: apps/web/src/pages/ResultsPage.tsx]

**How to avoid:** Add focused tests for race catalog changes, then run root `pnpm test` and `pnpm run build`. [VERIFIED: AGENTS.md; VERIFIED: package.json]

**Warning signs:** Only `@blitz/web` tests are run after changing shared/server variant policy. [VERIFIED: .planning/codebase/TESTING.md]

## Code Examples

### Variant-Aware Route Resolver

```typescript
// Source: apps/web/src/lib/sessionRoutes.ts
export function resolveSessionRoute(payload: SessionStartedPayload): string {
  if (payload.game === 'lights') return `/session/lights/${payload.sessionId}`;
  if (payload.game === 'penalty') return `/session/penalty/${payload.sessionId}`;
  if (payload.game === 'race' && payload.variant === PARTY_GAME_VARIANTS.dragGear) {
    return `/race/drag/${payload.sessionId}`;
  }
  if (payload.game === 'race' && payload.variant === PARTY_GAME_VARIANTS.straightObstacle) {
    return `/race/dodge/${payload.sessionId}`;
  }
  if (payload.game === 'race' && payload.variant === PARTY_GAME_VARIANTS.circleTrack) {
    return `/race/circle/${payload.sessionId}`;
  }
  if (payload.game === 'race' && payload.variant === PARTY_GAME_VARIANTS.figureEightTrack) {
    return `/race/figure-eight/${payload.sessionId}`;
  }
  return `/results/${payload.sessionId}`;
}
```

The exact fallback should be chosen during planning, but silent fallback to the wrong race page should be avoided. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

### Graceful Result Summary Mount Point

```typescript
// Source: apps/web/src/pages/ResultsPage.tsx and packages/shared/src/contracts.ts
{payload ? (
  <>
    <RankingsList payload={payload} roster={roster} />
    <ModeResultsSummary payload={payload} />
  </>
) : (
  <NoResultsState />
)}
```

The existing page currently renders rankings inline and host actions after rankings, so extracted helpers should preserve that order. [VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

### Registry Regression Test Shape

```typescript
// Source: apps/server/src/games/registry.test.ts pattern.
const registry = createGameRuntimeRegistry();
assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.dragGear) !== null, true);
assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.straightObstacle) !== null, true);
assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.circleTrack) !== null, true);
assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.figureEightTrack) !== null, true);
```

Registry tests should stay paired with shared startability tests because server start uses both. [VERIFIED: apps/server/src/games/registry.test.ts; VERIFIED: apps/server/src/socket/register.ts]

## State of the Art

| Old Approach | Current Phase 06 Approach | When Changed | Impact |
|--------------|---------------------------|--------------|--------|
| Two race labels: `Sprint Circuit` and `Drag Sprint` | Four final user-facing modes with objective/control/skill copy | Phase 06 locked context on 2026-04-25 | Lobby must make modes distinct and phone-readable. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: apps/web/src/pages/LobbyPage.tsx] |
| Race-specific/stale socket event names | Generic session events for all games | Existing architecture before Phase 06 | Do not add new race event branches for catalog polish. [VERIFIED: packages/shared/src/contracts.ts; VERIFIED: apps/server/src/socket/register.ts; VERIFIED: .planning/codebase/CONCERNS.md] |
| Old `sprint-circuit` fallback route for race sessions | Variant-aware fullscreen pages or adapters | Phase 06 target | Prevents wrong HUD/controls for rebuilt modes. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md] |
| Generic rankings only | Rankings plus optional mode summaries | Phase 06 target | Results explain why a run went well or poorly without becoming analytics. [VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md] |

**Deprecated/outdated:**
- `Sprint Circuit` and `Drag Sprint` as primary catalog labels are outdated for the final catalog. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: apps/web/src/pages/LobbyPage.tsx]
- `traffic-survival` exists in shared variants but is not startable or registered in current source. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/games/registry.ts]
- `useLiveRaceSocket` is old-sprint specific because it filters only `PARTY_GAME_VARIANTS.sprintCircuit`. [VERIFIED: apps/web/src/lib/useLiveRaceSocket.ts]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Final canonical ids can be `drag-gear`, `straight-obstacle`, `circle-track`, and `figure-eight-track` if prior phases have not already locked different ids. [ASSUMED] | Architecture Patterns / Code Examples | Planner may need to preserve existing ids from Phases 2-5 and only change labels/copy. |
| A2 | Adding small result-summary components is preferred over keeping all summary rendering inline in `ResultsPage`. [ASSUMED] | Architecture Patterns | Inline implementation may be acceptable for small scope, but helpers reduce future branching risk. |

## Open Questions (RESOLVED)

1. **Which variant ids exist after Phases 3-5 execute?**
   - Resolution: Phase 06 plans use these canonical final ids from shared constants: `drag-gear`, `straight-obstacle`, `circle-track`, and `figure-eight-track`. Before production source edits, Plan 06-01 now performs a Wave 0 prerequisite audit of `PARTY_GAME_VARIANTS`, server registry runtime factories, route mappings, and fullscreen page files. If any Phase 3-5 runtime or page is missing, execution stops and final variants are not made startable. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-01-PLAN.md; VERIFIED: .planning/phases/03-straight-obstacle-race/03-05-PLAN.md; VERIFIED: .planning/phases/04-circular-analog-track-race/04-04-PLAN.md; VERIFIED: .planning/phases/05-figure-eight-analog-track-race/05-04-PLAN.md]

2. **Should legacy ids remain as compatibility aliases?**
   - Resolution: Legacy ids may remain exported only as source-compatibility aliases when current code still imports them, but they must not be primary lobby labels, final startability examples, or final route/result branches. Results rendering remains tolerant of old or partial stored payloads through existing `GameResults.summary`, ranking `label`, and ranking `value` fields, with no new entry-level details contract field. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-04-PLAN.md; VERIFIED: packages/shared/src/contracts.ts]

3. **Should `useLiveRaceSocket` be removed, generalized, or left only for compatibility?**
   - Resolution: Final race pages should use the generic `useGameSessionSocket()` path and the active session event family (`client:game-input`, `server:session-state`, `server:session-finished`). `useLiveRaceSocket` should be left only for legacy compatibility if a legacy sprint page still needs it; Phase 06 should not broaden it unless an existing final page still depends on it after the Wave 0 prerequisite audit. [VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; VERIFIED: apps/web/src/lib/useLiveRaceSocket.ts; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Root/server/shared/web tests and builds | yes | `v24.14.1` | None needed. [VERIFIED: node --version] |
| pnpm | Workspace scripts and Render-equivalent build | yes | `10.33.2` | None needed. [VERIFIED: pnpm --version; VERIFIED: package.json] |
| npm registry access | Version research only | yes | npm CLI `11.11.0` | If unavailable later, use lockfile/package manifests for implementation. [VERIFIED: npm --version; VERIFIED: npm registry] |
| Render config | Deployment regression | yes | `render.yaml` present | Manual deployment docs if Render config changes. [VERIFIED: render.yaml] |

**Missing dependencies with no fallback:**
- None found for Phase 06 planning and implementation. [VERIFIED: environment probes]

**Missing dependencies with fallback:**
- No browser E2E tool is configured; use existing Vitest/Testing Library plus manual mobile viewport verification required by Phase 06. [VERIFIED: .planning/codebase/TESTING.md; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Web: Vitest `^3.2.4`; server/shared/root: Node built-in test runner. [VERIFIED: apps/web/package.json; VERIFIED: apps/server/package.json; VERIFIED: packages/shared/package.json; VERIFIED: package.json] |
| Config file | Web: `apps/web/vite.config.ts`; server/shared/root use package scripts. [VERIFIED: apps/web/vite.config.ts; VERIFIED: package.json] |
| Quick run command | `pnpm --filter @blitz/web test` for web-only UI/routing/results; `pnpm --filter @blitz/server test` for registry/socket flow; `pnpm --filter @blitz/shared test` for shared contracts. [VERIFIED: .planning/codebase/TESTING.md; VERIFIED: package.json] |
| Full suite command | `pnpm test` then `pnpm run build`. [VERIFIED: AGENTS.md; VERIFIED: package.json] |

### Phase Requirements - Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FLOW-01 | Four final race variants render/select/start from lobby. | Web component + shared/server unit | `pnpm --filter @blitz/web test`; `pnpm --filter @blitz/shared test`; `pnpm --filter @blitz/server test` | Existing files yes, assertions need update. [VERIFIED: apps/web/src/pages/LobbyPage.test.tsx; VERIFIED: packages/shared/src/contracts.test.ts; VERIFIED: apps/server/src/games/registry.test.ts] |
| FLOW-02 | Lobby shows objective/control/skill focus copy. | Web component | `pnpm --filter @blitz/web test` | Existing `LobbyPage.test.tsx`; add copy assertions. [VERIFIED: apps/web/src/pages/LobbyPage.test.tsx] |
| FLOW-03 | Each selected race variant routes to correct fullscreen page. | Web unit/router | `pnpm --filter @blitz/web test` | Existing `router.test.tsx`; no separate `sessionRoutes.test.ts` currently. [VERIFIED: apps/web/src/app/router.test.tsx; VERIFIED: apps/web/src/lib/sessionRoutes.ts] |
| FLOW-04 | Results render mode summaries and degrade on missing fields. | Web component | `pnpm --filter @blitz/web test` | Existing `ResultsPage.test.tsx`; add mode summary and partial payload tests. [VERIFIED: apps/web/src/pages/ResultsPage.test.tsx] |
| FLOW-05 | Semaforo, Rigori, invite, ready, post-game actions continue. | Web/server/root regression | `pnpm test` | Existing page/socket/root tests cover pieces; add focused assertions if modified. [VERIFIED: apps/web/src/pages/LobbyPage.test.tsx; VERIFIED: apps/server/src/socket/register.test.ts; VERIFIED: tests/blitz-flow.test.js] |
| ARCH-03 | Web route/control/HUD copy coverage exists. | Web component/router | `pnpm --filter @blitz/web test` | Existing web test files yes. [VERIFIED: find apps/web/src -name '*.test.*'] |
| ARCH-04 | Root build/test pass. | Full gate | `pnpm test`; `pnpm run build` | Root scripts exist. [VERIFIED: package.json] |

### Sampling Rate

- **Per task commit:** Run the focused package test for the touched boundary, for example `pnpm --filter @blitz/web test` after lobby/results/routing edits or `pnpm --filter @blitz/server test` after registry/socket edits. [VERIFIED: .planning/codebase/TESTING.md]
- **Per wave merge:** Run `pnpm test` after shared/server/web integration waves. [VERIFIED: package.json]
- **Phase gate:** Run `pnpm test`, `pnpm run build`, and manual mobile viewport verification before `/gsd-verify-work`. [VERIFIED: AGENTS.md; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md]

### Wave 0 Gaps

- [ ] `apps/web/src/lib/sessionRoutes.test.ts` or equivalent route-helper coverage in `apps/web/src/app/router.test.tsx` for all four final race variants. [VERIFIED: apps/web/src/lib/sessionRoutes.ts; VERIFIED: apps/web/src/app/router.test.tsx]
- [ ] Additional `apps/web/src/pages/ResultsPage.test.tsx` cases for drag, dodge, circle, figure-eight, and missing summary fields. [VERIFIED: apps/web/src/pages/ResultsPage.test.tsx]
- [ ] Additional `apps/web/src/pages/LobbyPage.test.tsx` cases for objective/control/skill copy and four final race cards. [VERIFIED: apps/web/src/pages/LobbyPage.test.tsx]
- [ ] Shared/server startability and registry assertions for final variants. [VERIFIED: packages/shared/src/contracts.test.ts; VERIFIED: apps/server/src/games/registry.test.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no new auth in this phase | Existing host checks compare `socket.id` to lobby host; do not broaden scope into identity redesign. [VERIFIED: apps/server/src/socket/register.ts; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md] |
| V3 Session Management | limited | Existing sessions are in-memory and Socket.IO based; preserve generic session events. [VERIFIED: apps/server/src/games/manager.ts; VERIFIED: packages/shared/src/contracts.ts] |
| V4 Access Control | yes | Keep server-side host-only checks for start session and post-game actions. [VERIFIED: apps/server/src/socket/register.ts] |
| V5 Input Validation | yes | Use shared startability and runtime input parsers; do not trust browser-only disabled states. [VERIFIED: packages/shared/src/lobby.ts; VERIFIED: apps/server/src/socket/register.ts; VERIFIED: apps/server/src/games/race/dragGearRules.ts] |
| V6 Cryptography | no new crypto | Phase 06 should not add cryptographic behavior. [VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client selects unsupported or stale variant id | Tampering | Server rechecks `isLobbySelectionStartable()` and registry resolution before starting a session. [VERIFIED: apps/server/src/socket/register.ts; VERIFIED: packages/shared/src/lobby.ts] |
| Client sends arbitrary lobby settings | Tampering | Keep Phase 06 settings changes minimal; broader schema validation is deferred unless blocking. [VERIFIED: .planning/codebase/CONCERNS.md; VERIFIED: .planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md] |
| Browser result payload missing or stale | Repudiation / Reliability | Treat browser-stored result payloads as display data only and degrade to rankings/no-data states. [VERIFIED: apps/web/src/pages/ResultsPage.tsx; VERIFIED: packages/shared/src/contracts.ts] |
| Host action triggered by non-host | Elevation of Privilege | Server `applyPostGameAction()` checks current host before rematch/return/change-game. [VERIFIED: apps/server/src/socket/register.ts] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/06-lobby-results-and-regression-polish/06-CONTEXT.md` - locked decisions, phase boundary, deferred ideas. [VERIFIED: local file read]
- `.planning/REQUIREMENTS.md` - FLOW-01 through FLOW-05 and ARCH-03/ARCH-04 requirement text. [VERIFIED: local file read]
- `.planning/STATE.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md` - project state, goals, and Phase 06 scope. [VERIFIED: local file read]
- `AGENTS.md` - project constraints, verification, and deployment commands. [VERIFIED: local file read]
- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md` - codebase maps and known risks. [VERIFIED: local file read]
- `packages/shared/src/lobby.ts`, `packages/shared/src/contracts.ts`, `packages/shared/src/game.ts` - shared variant, startability, event, and result contracts. [VERIFIED: local file read]
- `apps/server/src/socket/register.ts`, `apps/server/src/games/registry.ts`, `apps/server/src/games/manager.ts` - authoritative session/start/result flow. [VERIFIED: local file read]
- `apps/web/src/pages/LobbyPage.tsx`, `ResultsPage.tsx`, `SprintCircuitPage.tsx`, `DragGearRacePage.tsx`, `apps/web/src/lib/sessionRoutes.ts`, `useGameSessionSocket.ts`, `useLiveRaceSocket.ts`, `usePostGameActions.ts` - web integration boundaries. [VERIFIED: local file read]
- `package.json`, package manifests, `render.yaml` - scripts, dependencies, and deployment config. [VERIFIED: local file read]
- npm registry queries for `react`, `react-router-dom`, `socket.io`, `socket.io-client`, `express`, `vite`, `vitest`, and `typescript`. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- Prior phase contexts and research for Phase 2-5 variant direction and result expectations. [VERIFIED: .planning/phases/02-drag-gear-race/02-CONTEXT.md; VERIFIED: .planning/phases/03-straight-obstacle-race/03-RESEARCH.md; VERIFIED: .planning/phases/04-circular-analog-track-race/04-CONTEXT.md; VERIFIED: .planning/phases/05-figure-eight-analog-track-race/05-RESEARCH.md]

### Tertiary (LOW confidence)

- None. [VERIFIED: assumptions log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package manifests, local tool probes, and npm registry current versions were checked. [VERIFIED: package.json; VERIFIED: npm registry; VERIFIED: environment probes]
- Architecture: HIGH - phase touches existing shared/server/web boundaries documented in code and codebase maps. [VERIFIED: .planning/codebase/ARCHITECTURE.md; VERIFIED: local source reads]
- Pitfalls: HIGH - each pitfall maps to current code or locked context. [VERIFIED: grep/code reads; VERIFIED: 06-CONTEXT.md]
- Variant final ids: MEDIUM - final user-facing names are locked, but exact ids may already be chosen by prior/future phase implementation before Phase 06 runs. [VERIFIED: 06-CONTEXT.md; VERIFIED: current worktree audit; ASSUMED: exact ids if not already present]

**Research date:** 2026-04-26
**Valid until:** 2026-05-03, because package versions and current worktree state can change quickly during active phase execution. [ASSUMED]
