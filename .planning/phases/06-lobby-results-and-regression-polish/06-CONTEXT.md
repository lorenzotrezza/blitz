# Phase 6: Lobby, Results, And Regression Polish - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 exposes the rebuilt race catalog clearly in the existing party flow, routes every selected mode to the correct fullscreen gameplay experience, renders mode-specific result summaries, and verifies that existing lobby, post-game, Semaforo, Rigori, mobile viewport, build, and test flows still work.

This phase does not add new race mechanics, retune physics, add persistence, add leaderboards, or introduce new non-race minigames. Drag, dodge, circle, and figure-eight gameplay rules belong to Phases 2 through 5. Phase 6 makes those modes understandable, startable, reviewable after play, and regression-tested as a complete party flow.

</domain>

<decisions>
## Implementation Decisions

### Race Catalog Presentation
- **D-01:** Replace the old user-facing race labels with the final four race modes: Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track.
- **D-02:** Lobby race selection should make each mode mechanically distinct at a glance. Each option should show a short objective, primary control method, and skill focus.
- **D-03:** Recommended order is skill progression: Drag Gear, Straight Obstacle, Circle Track, Figure-Eight Track.
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

### the agent's Discretion
- Exact visual form of lobby race options: compact cards, segmented controls with details, or another mobile-readable pattern consistent with existing app styling.
- Exact shared variant id names, provided they map one-to-one to the final four modes and avoid user-facing legacy labels.
- Whether results summaries are implemented inline in `ResultsPage` or through extracted mode-summary helpers.
- Exact test split across shared, server, web, and root smoke tests, provided the Phase 6 regression gate covers the stated party flows.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/PROJECT.md` - Product vision, mobile-first playability goal, active race catalog requirements, and server-authoritative constraint.
- `.planning/REQUIREMENTS.md` - Phase 6 requirements: FLOW-01 through FLOW-05, ARCH-03, and ARCH-04.
- `.planning/ROADMAP.md` - Phase 6 boundary, success criteria, and implementation notes.
- `.planning/STATE.md` - Current milestone state and preserved decisions.

### Prior phase decisions
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md` - Fullscreen gameplay shell, two-thumb controls, readable HUD, desktop fallback, and shared contract direction.
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md` - Approved mobile gameplay UI contract, control sizing, HUD rules, typography, safe areas, and shared input expectations.
- `.planning/phases/02-drag-gear-race/02-CONTEXT.md` - Drag Gear mechanics, HUD, and result summary expectations.
- `.planning/phases/03-straight-obstacle-race/03-CONTEXT.md` - Straight Obstacle control, obstacle, penalty, HUD, and result summary expectations.
- `.planning/phases/04-circular-analog-track-race/04-CONTEXT.md` - Circle Track analog controls, checkpoint/lap rules, penalties, integration shape, and result expectations.
- `.planning/phases/05-figure-eight-analog-track-race/05-CONTEXT.md` - Figure-Eight route, crossing readability, checkpoint order, penalties, and integration expectations.

### Codebase map
- `.planning/codebase/ARCHITECTURE.md` - Lobby lifecycle, session routing, runtime registry, socket flow, and results lifecycle.
- `.planning/codebase/CONCERNS.md` - Stale race event risk, large runtime risk, canvas-only state risk, and regression/test gaps.
- `.planning/codebase/STRUCTURE.md` - Where to update lobby variants, registry, route mapping, pages, hooks, and tests.
- `.planning/codebase/CONVENTIONS.md` - TypeScript, React, socket, runtime, and test conventions.
- `.planning/codebase/TESTING.md` - Current web/server/shared/root test patterns and verification commands.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shared/src/lobby.ts`: Current source for `PARTY_GAME_VARIANTS`, startability, lobby settings, and selected variant types. Phase 6 needs this to expose all final race variants.
- `apps/server/src/games/registry.ts`: Runtime registry currently exposes `race:sprint-circuit` and `race:drag-sprint`. Phase 6 should verify all final race variants are registered and resolvable.
- `apps/web/src/pages/LobbyPage.tsx`: Current lobby game selector only exposes `Sprint Circuit` and `Drag Sprint`. This is the main catalog polish target.
- `apps/web/src/lib/sessionRoutes.ts`: Currently sends all race sessions to `/race/live/:sessionId`; Phase 6 must make route resolution variant-aware or make the race live page genuinely mode-aware.
- `apps/web/src/pages/SprintCircuitPage.tsx`: Existing fullscreen race route uses Phase 1 shell components but hardcodes circle mode in several places. Useful as a migration point, not the final all-mode implementation as-is.
- `apps/web/src/components/game/GameHud.tsx`: Already knows labels for `drag`, `dodge`, `circle`, and `figure-eight`; useful for consistent HUD/result naming.
- `apps/web/src/pages/ResultsPage.tsx`: Current results page renders generic rankings and post-game actions. Phase 6 should add graceful mode-specific summaries here or via extracted helpers.
- `apps/web/src/app/router.tsx`: Route tree keeps live race outside `AppLayout`, preserving fullscreen gameplay. Phase 6 should preserve that fullscreen property.

### Established Patterns
- Shared contracts live in `packages/shared/src` and are consumed by both web and server.
- Server runtime state remains authoritative. Client controls emit intent only.
- Lobby startability is shared through `isLobbySelectionStartable()` and enforced before session start.
- Session routing uses `SessionStartedPayload` and `resolveSessionRoute()`.
- Results use `SessionFinishedPayload`, session storage under `blitz-results:{sessionId}`, and post-game actions through `usePostGameActions()`.
- Tests are co-located with source files, with root `pnpm test` and `pnpm run build` as final gates.

### Integration Points
- Final variant catalog connects through `packages/shared/src/lobby.ts`, `apps/server/src/games/registry.ts`, `apps/web/src/pages/LobbyPage.tsx`, and tests in all three packages.
- Variant-aware route resolution connects through `apps/web/src/lib/sessionRoutes.ts`, `apps/web/src/app/router.tsx`, and the live race page or per-mode pages.
- Mode-specific results connect through `packages/shared/src/game.ts` result/summary payloads, server runtime finish payloads, `apps/web/src/pages/ResultsPage.tsx`, and results tests.
- Regression verification should cover `apps/web/src/pages/LobbyPage.test.tsx`, `apps/web/src/pages/ResultsPage.test.tsx`, `apps/web/src/app/router.test.tsx`, `apps/server/src/games/registry.test.ts`, `packages/shared/src/contracts.test.ts`, and root smoke tests where useful.

</code_context>

<specifics>
## Specific Ideas

- User approved the recommended discussion path with "ok va bene".
- Phase 6 should make the final catalog feel like four distinct playable race choices, not a renamed version of the old two-option race selector.
- Keep lobby copy short and practical: objective, control, and skill focus are enough.
- Results should explain why the run went well or poorly without becoming a separate analytics dashboard.
- The final gate must prove the whole party loop still works, not only individual race mechanics.

</specifics>

<deferred>
## Deferred Ideas

- Persistent leaderboards, accounts, high scores, and shareable recap cards remain v2 scope.
- Reconnect identity, socket hardening, payload schema validation, CORS hardening, and lobby TTL/capacity policy remain outside Phase 6 unless they directly block the party flow.
- Sound, haptics, camera effects, advanced visual juice, car-specific handling, and powerups remain polish or later gameplay scope.

</deferred>

---

*Phase: 06-lobby-results-and-regression-polish*
*Context gathered: 2026-04-25*
