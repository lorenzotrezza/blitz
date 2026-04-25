# Phase 1: Fullscreen Game Shell And Input Foundation - Research

**Researched:** 2026-04-25 [VERIFIED: date/current prompt]  
**Domain:** Mobile-first realtime browser game UI, pointer/keyboard input normalization, shared TypeScript contracts [VERIFIED: .planning/ROADMAP.md; .planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md]  
**Confidence:** HIGH for local architecture and browser input patterns; MEDIUM for future per-mode contract fields because later phases intentionally defer detailed physics [VERIFIED: .planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Layout schermo telefono
- **D-01:** Use a true fullscreen game route layout for live race sessions, separate from the normal card/panel app page feel.
- **D-02:** Prioritize landscape phone play for racing because it gives room for track visibility and two-thumb controls; still support portrait with stacked/compact controls rather than breaking.
- **D-03:** Track/canvas is the main visual surface and should occupy the center/full available viewport. HUD and controls overlay around it without pushing the track below the fold.
- **D-04:** Hide or minimize normal app chrome during gameplay. The game screen should feel like entering a mode, not like a dashboard page.
- **D-05:** Respect mobile safe areas using CSS env values and avoid controls at the extreme OS gesture edges.

### Schema controlli touch
- **D-06:** Build a reusable control system with three primitives: analog pad, primary action button, and secondary action button.
- **D-07:** Analog pad is required now because circular and figure-eight phases depend on it. It should output continuous x/y direction and magnitude, not only left/right.
- **D-08:** Primary action button changes meaning by mode: accelerate for straight race, shift for drag race if acceleration is held/automatic, or throttle/action if planner chooses that split.
- **D-09:** Secondary action button should support brake/cancel/boost style actions depending on mode, but Phase 1 only needs the primitive and contract shape.
- **D-10:** Controls should use pointer events where possible, with touch fallback if needed, and set `touch-action: none` on gameplay controls.

### Ergonomia mani/pollici
- **D-11:** Design for two-thumb play as the default: left thumb controls direction/analog movement, right thumb controls action/shift/brake.
- **D-12:** Bottom-left is the default analog zone; bottom-right is the default action zone.
- **D-13:** Controls must be large enough for fast play on a phone and stable enough that labels/icons do not shift layout during input.
- **D-14:** One-handed play is not a Phase 1 target. Do not compromise two-thumb racing comfort to support it.
- **D-15:** Visual feedback on press/drag is required: active analog vector, pressed action state, and disabled/unavailable state.

### HUD minimo durante gara
- **D-16:** Keep HUD minimal during active play: mode objective, speed/progress, current penalty/status, and the one mode-critical metric.
- **D-17:** Mode-critical metric examples: RPM/gear/shift window for drag, obstacle hit/slowdown state for straight dodge, lap/checkpoint/direction for analog tracks.
- **D-18:** HUD should live mostly top/side, not over the bottom controls.
- **D-19:** HUD text must be readable on small screens; avoid tiny pixel-font body text for critical gameplay feedback.
- **D-20:** Canvas visuals should not be the only source of gameplay state. Key status needs React-rendered text for testing and accessibility.

### Desktop fallback
- **D-21:** Provide keyboard fallback for every control primitive.
- **D-22:** Recommended default mapping: WASD or arrow keys for analog/directional input, Space/Enter for primary action, Shift or Control for secondary action.
- **D-23:** Desktop fallback is for testing and casual desktop play; phone touch ergonomics remain the primary design target.
- **D-24:** Mouse drag should be allowed on the analog pad for local testing.

### Contratti input/snapshot
- **D-25:** Add shared contract foundations now, not only local UI state. Later runtime phases should not invent incompatible input payloads.
- **D-26:** Use discriminated input shapes by control mode or race mode so server and client can validate intent clearly.
- **D-27:** Include at least these input concepts: analog vector, button pressed/released state, action event, sequence/tick/timestamp.
- **D-28:** Include snapshot concepts that support the common shell: session id, mode id, status, countdown, players, progress, speed, HUD fields, and mode-specific detail payload.
- **D-29:** Contracts should be flexible enough for all four planned modes, but Phase 1 should avoid finalizing detailed physics fields that belong to later phases.

### Claude's Discretion
- Exact CSS class names and component boundaries.
- Whether to create a new generic hook or extend `useLiveRaceSocket`, as long as downstream race modes can use it cleanly.
- Exact visual styling of the HUD and controls, provided the result is fullscreen, readable, and mobile-first.
- Whether initial Phase 1 demo uses placeholder track visuals or adapts the existing `SprintCircuitPage` canvas.

### Deferred Ideas (OUT OF SCOPE)
- One-handed accessibility mode — useful later, but not required for Phase 1.
- Sound, haptics, camera shake, and advanced visual juice — valuable polish, but gameplay controls and shell come first.
- Final per-mode physics details — belong to Phases 2-5.
- Leaderboards and persistent stats — out of scope for this milestone.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CTRL-01 | Player can play race sessions in a fullscreen mobile-first game screen where the track, HUD, and controls are visible without scrolling. | Use a route-level fullscreen shell outside the current `.panel` and `.viewport` layout; size with `100dvh`, fixed containment, and safe-area padding. [VERIFIED: .planning/REQUIREMENTS.md; apps/web/src/app/router.tsx; apps/web/src/styles.css] [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length] |
| CTRL-02 | Player can use touch controls that stay in fixed thumb-friendly zones and do not trigger browser scrolling during gameplay. | Use pointer events, pointer capture, `touch-action: none`, fixed bottom-left/bottom-right control zones, and reset on cancel/blur/unmount. [VERIFIED: 01-UI-SPEC.md] [CITED: developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture; developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action] |
| CTRL-03 | Player can see mode-specific HUD feedback for objective, progress, speed, penalty, and current input state. | Keep HUD in React text, not canvas-only drawing; expose common fields plus a mode-critical slot. [VERIFIED: 01-UI-SPEC.md; apps/web/src/pages/SprintCircuitPage.tsx] |
| CTRL-04 | Keyboard or desktop users have a usable fallback for every required gameplay input. | Map WASD/Arrow keys to analog, Space/Enter to primary action, Shift/Control to secondary action; support mouse drag on analog pad. [VERIFIED: 1-CONTEXT.md; 01-UI-SPEC.md] |
| ARCH-01 | Shared contracts define explicit input and snapshot shapes for each rebuilt race mode. | Extend `packages/shared/src/game.ts` and exports with discriminated input/snapshot foundations instead of leaving `GameInputPayload` as only `Record<string, unknown>`. [VERIFIED: packages/shared/src/game.ts; packages/shared/src/contracts.ts; packages/shared/src/index.ts] |
</phase_requirements>

## Summary

Phase 1 should not implement a complete race mode; it should create the reusable fullscreen gameplay surface, input primitives, normalized input hook, and shared contract vocabulary that Phases 2-5 plug into. [VERIFIED: .planning/ROADMAP.md; 1-CONTEXT.md] The current live race page is a panel/card route with canvas plus separate cards, touch handlers on buttons, and a simple `steer/accelerate/brake` loop; that is useful reference code but does not satisfy fullscreen/no-scroll/two-thumb requirements. [VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx; apps/web/src/lib/useLiveRaceSocket.ts]

The standard implementation should stay inside the existing pnpm workspace and use the current React/Vite/Socket.IO/shared-contract architecture. [VERIFIED: AGENTS.md; .planning/codebase/ARCHITECTURE.md; package.json] No gameplay authority should move to the browser; the client should emit compact typed intents and render server snapshots. [VERIFIED: AGENTS.md; apps/server/src/games/runtime.ts; apps/server/src/socket/register.ts]

**Primary recommendation:** Build `FullscreenGameShell`, `GameViewport`, `GameHud`, `AnalogPad`, `ActionButton`, and `useGameControls`, then extend `@blitz/shared` with discriminated `RaceGameInput` and `RaceShellSnapshot` types before touching detailed race physics. [VERIFIED: 01-UI-SPEC.md; packages/shared/src/game.ts]

## Project Constraints (from AGENTS.md)

- Read and honor `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/codebase/ARCHITECTURE.md`, and `.planning/codebase/CONCERNS.md` before planning or implementation. [VERIFIED: AGENTS.md]
- Phase 1 implementation must remain mapped to CTRL-01, CTRL-02, CTRL-03, CTRL-04, and ARCH-01. [VERIFIED: AGENTS.md; .planning/REQUIREMENTS.md]
- Use `$gsd-discuss-phase 1` and `$gsd-ui-phase 1` before implementation; both outputs already exist for this research phase. [VERIFIED: AGENTS.md; 1-CONTEXT.md; 01-UI-SPEC.md]
- Keep the current pnpm workspace architecture. [VERIFIED: AGENTS.md; pnpm-workspace.yaml; package.json]
- Treat `apps/**/src` and `packages/shared/src` as source of truth. [VERIFIED: AGENTS.md; .planning/codebase/CONCERNS.md]
- Server gameplay state is authoritative. [VERIFIED: AGENTS.md; .planning/codebase/ARCHITECTURE.md]
- Shared socket/input/snapshot contracts belong in `packages/shared`. [VERIFIED: AGENTS.md; packages/shared/src/index.ts]
- Prefer deterministic rule helpers with tests over adding logic to large runtime files. [VERIFIED: AGENTS.md; .planning/codebase/CONCERNS.md]
- Gameplay screens must be mobile-first and fullscreen. [VERIFIED: AGENTS.md; 01-UI-SPEC.md]
- Completion verification uses `pnpm run build`, `pnpm test`, and focused tests for changed packages when useful. [VERIFIED: AGENTS.md; package.json]
- Render Free is the current deployment target, with build command `corepack enable && pnpm install --frozen-lockfile && pnpm run build`, start command `pnpm start`, and health check `/health`. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Fullscreen route containment and chrome hiding | Browser / Client | Frontend routing | Route elements currently live in `apps/web/src/app/router.tsx`, and the gameplay shell is a visual/layout concern. [VERIFIED: apps/web/src/app/router.tsx; 01-UI-SPEC.md] |
| Canvas/track viewport host | Browser / Client | API / Backend for snapshot data | Canvas rendering is client presentation; authoritative positions arrive through session state. [VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx; apps/server/src/games/runtime.ts] |
| HUD text and live status | Browser / Client | API / Backend for values | React must render inspectable HUD text, but values come from snapshots. [VERIFIED: 01-UI-SPEC.md; apps/web/src/pages/SprintCircuitPage.tsx] |
| Pointer, touch, mouse, and keyboard normalization | Browser / Client | Shared contracts | Browser APIs own physical input; shared types define emitted intent shape. [CITED: developer.mozilla.org/en-US/docs/Web/API/Pointer_events] [VERIFIED: packages/shared/src/game.ts] |
| Input payload transport | Browser / Client | API / Backend | `useGameSessionSocket` and `useLiveRaceSocket` emit `client:game-input`; server `GameManager.applyInput()` dispatches to runtimes. [VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; apps/web/src/lib/useLiveRaceSocket.ts; apps/server/src/games/manager.ts] |
| Authoritative gameplay state | API / Backend | Database / Storage is none | Server runtimes implement `GameRuntimeInstance`; current stores are in memory only. [VERIFIED: apps/server/src/games/runtime.ts; .planning/codebase/ARCHITECTURE.md] |
| Shared input/snapshot schema | Shared package | Browser / Client and API / Backend | `@blitz/shared` is imported by both web and server and exports game/contracts/lobby types. [VERIFIED: packages/shared/src/index.ts; .planning/codebase/ARCHITECTURE.md] |
| Shell and contract tests | Browser / Client and Shared package | Root workspace | Web uses Vitest/jsdom and shared uses Node test runner. [VERIFIED: apps/web/package.json; packages/shared/package.json] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@blitz/shared` | workspace package | Shared socket, lobby, game, input, and snapshot contracts. | Existing contract boundary used by web and server. [VERIFIED: packages/shared/src/index.ts; .planning/codebase/ARCHITECTURE.md] |
| React / React DOM | installed `19.2.5`; registry current `19.2.5`, modified 2026-04-24 | Build shell, HUD, and controls as React components. | Existing web app uses React; effects are the standard React hook for synchronizing event listeners and sockets with cleanup. [VERIFIED: pnpm-lock.yaml; npm registry via `npm view react`; npm registry via `npm view react-dom`] [CITED: react.dev/reference/react/useEffect] |
| React Router DOM | installed `7.14.2`; registry current `7.14.2`, modified 2026-04-22 | Add or adjust route boundaries for fullscreen session rendering. | Existing router already uses `createBrowserRouter`/`createMemoryRouter`; memory router supports route tests. [VERIFIED: apps/web/src/app/router.tsx; pnpm-lock.yaml; npm registry via `npm view react-router-dom`] [CITED: reactrouter.com/api/data-routers/createMemoryRouter] |
| Socket.IO / Socket.IO Client | installed and registry current `4.8.3`, modified 2025-12-23 | Realtime input and session snapshot transport. | Existing server/client socket stack and official TypeScript event typing match the project’s contract pattern. [VERIFIED: apps/server/package.json; apps/web/package.json; npm registry via `npm view socket.io`; npm registry via `npm view socket.io-client`] [CITED: socket.io/docs/v4/typescript/] |
| TypeScript | lockfile `5.9.3`; registry current `6.0.3`, modified 2026-04-16 | Compile-time contract safety across web/server/shared. | Existing package scripts use `tsc`; do not upgrade TypeScript inside this phase because it is unrelated to shell/input scope. [VERIFIED: pnpm-lock.yaml; npm registry via `npm view typescript`; package.json] |

### Supporting

| Library / API | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| Vite | lockfile `5.4.21`; registry current `8.0.10`, modified 2026-04-23 | Web build and dev server. | Keep existing Vite 5 line for this phase; upgrading build tooling is out of scope. [VERIFIED: apps/web/package.json; pnpm-lock.yaml; npm registry via `npm view vite`] |
| Vitest | installed `3.2.4`; registry current `4.1.5`, modified 2026-04-23 | Web component and hook tests. | Use existing test runner for shell rendering, control presence, keyboard fallback, and route tests. [VERIFIED: apps/web/package.json; pnpm-lock.yaml; npm registry via `npm view vitest`] |
| Testing Library React | installed `16.3.2`; registry current `16.3.2`, modified 2026-01-19 | Render React shell/control components in jsdom. | Existing web tests already use it. [VERIFIED: apps/web/package.json; apps/web/src/pages/SprintCircuitPage.test.tsx; npm registry via `npm view @testing-library/react`] |
| `@testing-library/user-event` | registry current `14.6.1`, modified 2025-12-13; not currently installed | Simulate pointer and keyboard sequences closer to user behavior. | Add as a dev dependency if the planner wants pointer-drag tests beyond basic `fireEvent` coverage. [VERIFIED: npm registry via `npm view @testing-library/user-event`] [CITED: testing-library.com/docs/user-event/pointer/] |
| Browser Pointer Events | Web platform API | Unified mouse, pen, and touch input; pointer capture keeps drag updates routed to the pad. | Use for `AnalogPad` and press/hold buttons. [CITED: developer.mozilla.org/en-US/docs/Web/API/Pointer_events; developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture] |
| CSS `touch-action`, `env()`, and dynamic viewport units | Web platform CSS | Prevent browser panning on controls, respect safe areas, and handle mobile browser UI height. | Use in fullscreen game shell and control surfaces. [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action; developer.mozilla.org/en-US/docs/Web/CSS/env; developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing React components and CSS | A canvas/game engine or UI framework | Out of scope and unnecessary for shell/input foundation; current app is React/Vite with custom CSS and no component library. [VERIFIED: 01-UI-SPEC.md; apps/web/package.json] |
| Pointer Events | Separate mouse and touch handlers everywhere | Existing code does this, but it duplicates lifecycle paths and misses pointer capture/cancel behavior. [VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx] [CITED: developer.mozilla.org/en-US/docs/Web/API/Pointer_events] |
| Shared discriminated contracts | Continue `GameInputPayload = Record<string, unknown>` | Flexible but weak for ARCH-01; planner should replace generic race inputs with explicit discriminated payloads. [VERIFIED: packages/shared/src/contracts.ts; .planning/REQUIREMENTS.md] |
| Route inside `AppLayout` | Top-level fullscreen route outside chrome | Current app layout includes topbar/glow/viewport; active gameplay needs chrome removed or bypassed. [VERIFIED: apps/web/src/app/router.tsx; 01-UI-SPEC.md] |

**Installation:**
```bash
# Core phase can use existing dependencies.
# Optional, if pointer/keyboard tests need user-event:
pnpm --filter @blitz/web add -D @testing-library/user-event@14.6.1
```
[VERIFIED: apps/web/package.json; npm registry via `npm view @testing-library/user-event`]

**Version verification:** `npm view` checks were run for React, React DOM, React Router DOM, Socket.IO, Socket.IO Client, Vitest, Vite, TypeScript, Testing Library React, jsdom, and `@testing-library/user-event`. [VERIFIED: npm registry via `npm view`] Registry DNS failed inside the sandbox first and succeeded after approved network escalation. [VERIFIED: tool output]

## Architecture Patterns

### System Architecture Diagram

```text
Phone/Desktop input
  -> AnalogPad / ActionButton / keyboard listeners
  -> useGameControls normalizes physical input
  -> discriminated RaceGameInput payload
  -> Socket.IO client: client:game-input
  -> server socket gateway
  -> GameManager.applyInput()
  -> authoritative runtime updates state
  -> GameSessionEnvelope<RaceShellSnapshot>
  -> Socket.IO server: server:session-state
  -> useGameSessionSocket/useLiveRaceSocket adapter
  -> FullscreenGameShell
       -> GameViewport canvas/track presentation
       -> GameHud React text status
       -> fixed controls with visual feedback
```
[VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; apps/server/src/games/manager.ts; apps/server/src/games/runtime.ts; 01-UI-SPEC.md]

### Recommended Project Structure

```text
apps/web/src/components/game/
├── FullscreenGameShell.tsx  # viewport containment, safe areas, no-scroll layout
├── GameViewport.tsx         # canvas/track slot with stable sizing
├── GameHud.tsx              # React-rendered common HUD and live status
├── AnalogPad.tsx            # normalized pointer/mouse/touch analog primitive
├── ActionButton.tsx         # primary/secondary fixed-size press primitive
├── GameStates.tsx           # empty/error states using UI-SPEC copy
└── useGameControls.ts       # keyboard, pointer reset, and emitted input state

packages/shared/src/
├── game.ts                  # race shell input/snapshot discriminated contracts
└── contracts.test.ts        # export and shape coverage
```
[VERIFIED: 01-UI-SPEC.md; current source layout from `find apps/web/src packages/shared/src apps/server/src -type f`]

### Pattern 1: Route-Level Fullscreen Shell

**What:** Render active race sessions through a shell that is not wrapped in `.panel`, `.card`, `.viewport`, or normal top navigation chrome. [VERIFIED: 01-UI-SPEC.md]  
**When to use:** Use for live race session routes only, not lobby/results pages. [VERIFIED: .planning/ROADMAP.md]  
**Implementation note:** Either move `/race/live/:sessionId` outside the `AppLayout` route branch or add an explicit layout variant that suppresses `.topbar`, `.scanlines`, `.shell-glow`, and `.viewport`. [VERIFIED: apps/web/src/app/router.tsx; apps/web/src/styles.css]

```tsx
// Source: local router pattern in apps/web/src/app/router.tsx
{
  path: '/race/live/:sessionId',
  element: <RaceShellSessionPage />,
}
```
[VERIFIED: apps/web/src/app/router.tsx]

### Pattern 2: Pointer Capture Analog Control

**What:** On pointer down, capture the pointer ID, compute vector from pad center, clamp x/y to `-1..1`, compute `magnitude` clamped to `0..1`, and reset on pointer up/cancel/lost capture/blur/unmount. [VERIFIED: 01-UI-SPEC.md] [CITED: developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture]  
**When to use:** Use for `AnalogPad` and mouse-drag local testing. [VERIFIED: 1-CONTEXT.md]

```tsx
// Source: MDN pointer capture + local UI-SPEC normalization contract
function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
  event.currentTarget.setPointerCapture(event.pointerId);
  updateVectorFromClientPoint(event.clientX, event.clientY);
}
```
[CITED: developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture] [VERIFIED: 01-UI-SPEC.md]

### Pattern 3: CSS-Owned No-Scroll Gameplay Surface

**What:** Use fixed route containment, `100vw`, `100dvh`, `overflow: hidden`, safe-area padding with `env()`, and `touch-action: none` on control surfaces. [VERIFIED: 01-UI-SPEC.md] [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length; developer.mozilla.org/en-US/docs/Web/CSS/env; developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action]  
**When to use:** Use on the fullscreen game shell and interactive controls. [VERIFIED: 01-UI-SPEC.md]

```css
/* Source: MDN dvh/env/touch-action docs + Phase 1 UI-SPEC */
.game-shell {
  position: fixed;
  inset: 0;
  width: 100vw;
  min-height: 100dvh;
  overflow: hidden;
  padding:
    max(16px, env(safe-area-inset-top))
    max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));
}

.game-control {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
```
[CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length; developer.mozilla.org/en-US/docs/Web/CSS/env; developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action]

### Pattern 4: Discriminated Input Contracts

**What:** Replace race-control assumptions with explicit input unions that include kind, sequence, client timestamp, and normalized payload. [VERIFIED: 1-CONTEXT.md; packages/shared/src/game.ts]  
**When to use:** Use before Phase 2 creates drag-specific inputs so later modes do not invent incompatible shapes. [VERIFIED: .planning/ROADMAP.md]

```ts
// Source: local shared contract boundary in packages/shared/src/game.ts
export type RaceGameInput =
  | {
      kind: 'analog';
      sequence: number;
      clientTimeMs: number;
      vector: { x: number; y: number; magnitude: number };
    }
  | {
      kind: 'button';
      sequence: number;
      clientTimeMs: number;
      button: 'primary' | 'secondary';
      pressed: boolean;
    }
  | {
      kind: 'action';
      sequence: number;
      clientTimeMs: number;
      action: 'primary-tap' | 'secondary-tap' | 'shift';
    };
```
[VERIFIED: packages/shared/src/game.ts; 1-CONTEXT.md]

### Anti-Patterns to Avoid

- **Adding more UI into `SprintCircuitPage.tsx` cards:** The page is currently a normal panel layout and should become either a consumer of the new shell or a legacy reference. [VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx; 01-UI-SPEC.md]
- **Canvas-only HUD:** Critical state must be React-rendered for tests and assistive tech. [VERIFIED: 01-UI-SPEC.md; .planning/codebase/CONCERNS.md]
- **Separate touch/mouse code paths for every button:** Pointer Events cover mouse/pen/touch and support pointer capture. [CITED: developer.mozilla.org/en-US/docs/Web/API/Pointer_events]
- **Finalizing drag/obstacle/checkpoint physics in Phase 1 contracts:** Phase 1 should define common shell fields and mode detail extension points, not detailed physics fields. [VERIFIED: 1-CONTEXT.md]
- **Relying on `100vh` alone for phone fullscreen:** MDN documents dynamic viewport units for browser UI changes; use `100dvh` with safe-area padding. [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length; developer.mozilla.org/en-US/docs/Web/CSS/env]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unified touch/mouse/pen drag | Parallel mouse/touch/touchmove state machines in every component | Browser Pointer Events plus pointer capture | Pointer Events are hardware-agnostic and pointer capture keeps events targeted during drags. [CITED: developer.mozilla.org/en-US/docs/Web/API/Pointer_events; developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture] |
| Mobile scroll suppression on controls | JS-only `preventDefault()` as the primary guard | CSS `touch-action: none` on gameplay controls | MDN notes Pointer Event apps should declare touch behavior with CSS before listeners run. [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action] |
| Shared payload typing | Ad hoc local payload objects | `packages/shared/src/game.ts` exported discriminated unions | Existing architecture uses `@blitz/shared` as the client/server contract boundary. [VERIFIED: packages/shared/src/index.ts; .planning/codebase/ARCHITECTURE.md] |
| Realtime transport | Custom WebSocket protocol | Existing Socket.IO event family | The app already emits `client:game-input` and receives `server:session-state`; Socket.IO supports TypeScript event hints. [VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; packages/shared/src/contracts.ts] [CITED: socket.io/docs/v4/typescript/] |
| Route testing infrastructure | Custom browser harness for component rendering | Existing Vitest + React Testing Library + memory router | Existing route tests already render `RouterProvider` with `createAppRouter({ initialEntries })`. [VERIFIED: apps/web/src/pages/SprintCircuitPage.test.tsx; apps/web/src/app/router.tsx] |

**Key insight:** Phase 1 complexity is in lifecycle correctness, not game physics: input must reset on all cancellation paths, layout must never scroll on phone, and emitted payloads must stay compatible with server-authoritative runtimes. [VERIFIED: 01-UI-SPEC.md; .planning/codebase/CONCERNS.md]

## Common Pitfalls

### Pitfall 1: Fullscreen Route Still Wrapped by App Chrome
**What goes wrong:** The topbar, `.viewport` width cap, panel padding, and card shadows consume screen space and reintroduce mobile scrolling. [VERIFIED: apps/web/src/app/router.tsx; apps/web/src/styles.css]  
**Why it happens:** The current `/race/live/:sessionId` route is a child of `AppLayout`. [VERIFIED: apps/web/src/app/router.tsx]  
**How to avoid:** Put the gameplay route outside `AppLayout` or create a layout branch that renders only the fullscreen shell. [VERIFIED: 01-UI-SPEC.md]  
**Warning signs:** Tests find `.panel`, `.card`, `.viewport`, or top navigation inside the active gameplay route. [VERIFIED: 01-UI-SPEC.md]

### Pitfall 2: Touch Drag Gets Canceled by Browser Panning
**What goes wrong:** Thumb movement causes scrolling or pointer cancellation instead of analog updates. [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action]  
**Why it happens:** Browser default touch behavior remains enabled unless CSS communicates intent. [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action]  
**How to avoid:** Apply `touch-action: none` to analog/action control surfaces and handle `pointercancel`. [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action] [VERIFIED: 01-UI-SPEC.md]  
**Warning signs:** Mobile viewport scrolls while dragging controls or input remains stuck after OS gesture interruption. [VERIFIED: 01-UI-SPEC.md]

### Pitfall 3: Input State Sticks After Blur or Route Change
**What goes wrong:** Acceleration/brake/steer remains active after tab switch, pointer cancel, or navigation. [VERIFIED: 01-UI-SPEC.md]  
**Why it happens:** Existing controls reset on mouse/touch end/leave but do not cover every cancellation path. [VERIFIED: apps/web/src/pages/SprintCircuitPage.tsx]  
**How to avoid:** Centralize neutral reset in `useGameControls` for `pointerup`, `pointercancel`, `lostpointercapture`, `window.blur`, `visibilitychange`, and unmount. [VERIFIED: 01-UI-SPEC.md] [CITED: react.dev/reference/react/useEffect]  
**Warning signs:** Tests can press a control, unmount the component, and observe no neutral event/reset. [VERIFIED: 01-UI-SPEC.md]

### Pitfall 4: Generic Contracts Remain Too Loose
**What goes wrong:** Later phases add incompatible input fields per page/runtime. [VERIFIED: 1-CONTEXT.md]  
**Why it happens:** `GameInputPayload` is currently `Record<string, unknown>`, and current race input is a simple non-discriminated `PlayerInput`. [VERIFIED: packages/shared/src/contracts.ts; packages/shared/src/game.ts]  
**How to avoid:** Add discriminated race shell input and snapshot unions now, and test exports. [VERIFIED: .planning/ROADMAP.md; packages/shared/src/contracts.test.ts]  
**Warning signs:** New payloads do not have `kind`, `sequence`, and `clientTimeMs`, or mode details are stored only in local component state. [VERIFIED: 1-CONTEXT.md]

### Pitfall 5: jsdom Tests Pretend to Verify Physical Layout
**What goes wrong:** Tests pass while actual phone controls overlap or scroll. [CITED: testing-library.com/docs/user-event/pointer/]  
**Why it happens:** Testing Library documents that jsdom has no real layout, so pointer positions are not layout-validated. [CITED: testing-library.com/docs/user-event/pointer/]  
**How to avoid:** Use component tests for DOM presence, attributes, and event behavior; add manual/mobile viewport verification as a phase gate. [VERIFIED: AGENTS.md; 01-UI-SPEC.md]  
**Warning signs:** Assertions depend on actual pixel hit testing in jsdom. [CITED: testing-library.com/docs/user-event/pointer/]

## Code Examples

### Shared Snapshot Foundation

```ts
// Source: local shared game.ts pattern + Phase 1 context
export interface RaceShellSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  modeId: 'drag' | 'dodge' | 'circle' | 'figure-eight';
  status: 'countdown' | 'racing' | 'finished';
  countdown: number | null;
  tick: number;
  players: Array<{
    playerId: string;
    nickname: string;
    progress: number;
    speed: number;
    penalty: string | null;
  }>;
  hud: {
    objective: string;
    progressLabel: string;
    speedLabel: string;
    penaltyLabel: string;
    inputLabel: string;
    modeMetricLabel: string;
    modeMetricValue: string;
  };
  mode: Record<string, unknown>;
}
```
[VERIFIED: packages/shared/src/game.ts; 1-CONTEXT.md; 01-UI-SPEC.md]

### Game Controls Hook Responsibilities

```ts
// Source: React useEffect cleanup pattern + Phase 1 UI-SPEC
useEffect(() => {
  const reset = () => setInputState(createNeutralInputState());
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', reset);

  return () => {
    reset();
    window.removeEventListener('blur', reset);
    document.removeEventListener('visibilitychange', reset);
  };
}, []);
```
[CITED: react.dev/reference/react/useEffect] [VERIFIED: 01-UI-SPEC.md]

### Socket Input Emission

```ts
// Source: local useGameSessionSocket submitInput + Socket.IO emit docs
submitInput({
  kind: 'analog',
  sequence,
  clientTimeMs: Date.now(),
  vector: { x, y, magnitude },
});
```
[VERIFIED: apps/web/src/lib/useGameSessionSocket.ts] [CITED: socket.io/docs/v4/emitting-events/]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate mouse/touch handlers on every gameplay button | Pointer Events with pointer capture and CSS `touch-action` | Pointer capture is broadly available per MDN since July 2020; `touch-action` is broadly available per MDN since September 2019 | Use one input path and handle cancellation explicitly. [CITED: developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture; developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action] |
| `100vh` as default mobile fullscreen height | `100dvh` plus safe-area `env()` padding | Dynamic viewport units are documented in current MDN CSS values docs | Avoid mobile browser UI clipping and gesture-edge controls. [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length; developer.mozilla.org/en-US/docs/Web/CSS/env] |
| Canvas-only gameplay status | Canvas for track, React text for HUD/state | Locked in Phase 1 UI-SPEC | Tests and assistive technologies can inspect critical state. [VERIFIED: 01-UI-SPEC.md] |
| `Record<string, unknown>` input payloads for game input | Discriminated unions in shared package | Required by ARCH-01 in this milestone | Later race modes share a stable control vocabulary. [VERIFIED: packages/shared/src/contracts.ts; .planning/REQUIREMENTS.md] |

**Deprecated/outdated:**
- Race-specific socket events such as `raceStarted`, `raceSnapshot`, and `playerInput` exist in shared contracts, but active server flow uses generic session events. Planner should avoid building new Phase 1 work on the stale race-specific event family. [VERIFIED: packages/shared/src/contracts.ts; .planning/codebase/CONCERNS.md]
- Tiny pixel-font HUD labels are not allowed for gameplay-critical status in Phase 1. [VERIFIED: 01-UI-SPEC.md; apps/web/src/styles.css]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Keep Phase 1 tests dependency-free by default; use existing Testing Library `fireEvent` unless implementation proves it cannot express the required pointer/keyboard cases. [RESOLVED] | Standard Stack | If `fireEvent` proves insufficient during execution, add `@testing-library/user-event@14.6.1` as a focused dev dependency and record the reason in the plan summary. |
| A2 | Research remains valid until 2026-05-25 for local architecture and browser APIs, with npm versions rechecked before dependency changes. [ASSUMED] | Metadata | Planner may rely on stale npm version data if dependency work starts later. |

## Open Questions (RESOLVED)

1. **Should Phase 1 add `@testing-library/user-event` or keep tests dependency-free?** [RESOLVED]
   - What we know: Existing web tests use Vitest and Testing Library React, and `user-event` is current at `14.6.1`. [VERIFIED: apps/web/src/pages/SprintCircuitPage.test.tsx; npm registry via `npm view @testing-library/user-event`]
   - Resolution: Keep Phase 1 tests dependency-free by default and use existing Testing Library `fireEvent`, `render`, `renderHook`, and `act`. Add `@testing-library/user-event@14.6.1` only if `fireEvent` cannot express a required pointer/keyboard sequence during execution. [RESOLVED]
   - Plan impact: Plan 02 Task 1 explicitly instructs the executor to use `fireEvent` and avoid adding `@testing-library/user-event` unless existing tools cannot express the required events. [RESOLVED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Workspace scripts and tests | yes | `v24.14.1` | Node 20+ is the practical project baseline from `@types/node`, but current local Node is newer. [VERIFIED: `node --version`; .planning/codebase/STACK.md] |
| pnpm | Workspace build/test/add commands | yes | `10.33.2` | None needed. [VERIFIED: `pnpm --version`; package.json] |
| npm registry access | Version verification and optional dependency add | yes after approved network escalation | npm `11.11.0`; registry checks succeeded after escalation | Use lockfile-installed versions if offline. [VERIFIED: `npm --version`; npm registry via `npm view`] |
| Vitest/jsdom | Web component tests | yes via workspace deps | Vitest lockfile `3.2.4`; jsdom lockfile `26.1.0` | Existing route tests can be extended. [VERIFIED: apps/web/package.json; pnpm-lock.yaml] |
| Node test runner | Shared/server tests | yes via Node | `v24.14.1` | None needed. [VERIFIED: `node --version`; packages/shared/package.json; apps/server/package.json] |

**Missing dependencies with no fallback:**
- None found for Phase 1. [VERIFIED: local tool checks]

**Missing dependencies with fallback:**
- `@testing-library/user-event` is not installed; fallback is existing Testing Library `fireEvent`/render tests. [VERIFIED: apps/web/package.json; npm registry via `npm view @testing-library/user-event`]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Web: Vitest `3.2.4` with jsdom; Shared: Node test runner with `tsx`; Server: Node test runner with `tsx`. [VERIFIED: apps/web/package.json; packages/shared/package.json; apps/server/package.json; pnpm-lock.yaml] |
| Config file | `apps/web/vite.config.ts`; shared/server use package scripts. [VERIFIED: apps/web/vite.config.ts; packages/shared/package.json; apps/server/package.json] |
| Quick run command | `pnpm --filter @blitz/web test -- SprintCircuitPage.test.tsx` or the new shell test file; `pnpm --filter @blitz/shared test`. [VERIFIED: apps/web/package.json; packages/shared/package.json] |
| Full suite command | `pnpm test`; final completion also requires `pnpm run build`. [VERIFIED: AGENTS.md; package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CTRL-01 | Fullscreen race route renders shell, viewport, HUD, and bottom controls without normal panel/card chrome. | component/route | `pnpm --filter @blitz/web test -- FullscreenGameShell.test.tsx` | no - Wave 0 [VERIFIED: current file list] |
| CTRL-02 | Analog/action controls expose pointer-safe attributes and reset on cancel/up/unmount. | component/hook | `pnpm --filter @blitz/web test -- useGameControls.test.tsx` | no - Wave 0 [VERIFIED: current file list] |
| CTRL-03 | HUD renders objective, progress/speed, penalty/status, input state, and mode metric as React text. | component | `pnpm --filter @blitz/web test -- GameHud.test.tsx` | no - Wave 0 [VERIFIED: current file list] |
| CTRL-04 | Keyboard fallback maps WASD/arrows, Space/Enter, Shift/Control to normalized inputs. | hook/component | `pnpm --filter @blitz/web test -- useGameControls.test.tsx` | no - Wave 0 [VERIFIED: current file list] |
| ARCH-01 | Shared exports include discriminated input/snapshot shapes. | shared unit/type smoke | `pnpm --filter @blitz/shared test` | yes, extend `packages/shared/src/contracts.test.ts` [VERIFIED: packages/shared/src/contracts.test.ts] |

### Sampling Rate

- **Per task commit:** Run the focused package test for touched package, such as `pnpm --filter @blitz/web test -- FullscreenGameShell.test.tsx` or `pnpm --filter @blitz/shared test`. [VERIFIED: package scripts]
- **Per wave merge:** Run `pnpm --filter @blitz/web test` and `pnpm --filter @blitz/shared test`. [VERIFIED: package scripts]
- **Phase gate:** Run `pnpm run build` and `pnpm test`. [VERIFIED: AGENTS.md; package.json]

### Wave 0 Gaps

- [ ] `apps/web/src/components/game/FullscreenGameShell.test.tsx` - covers CTRL-01 shell/chrome/no-scroll DOM contract. [VERIFIED: current file list]
- [ ] `apps/web/src/components/game/AnalogPad.test.tsx` - covers CTRL-02 analog vector output and reset behavior. [VERIFIED: current file list]
- [ ] `apps/web/src/components/game/ActionButton.test.tsx` - covers CTRL-02/CTRL-04 press/release and focus states. [VERIFIED: current file list]
- [ ] `apps/web/src/components/game/GameHud.test.tsx` - covers CTRL-03 visible fields and live region. [VERIFIED: current file list]
- [ ] `apps/web/src/components/game/useGameControls.test.tsx` - covers CTRL-02/CTRL-04 keyboard, blur, visibility, and unmount reset. [VERIFIED: current file list]
- [ ] Extend `packages/shared/src/contracts.test.ts` - covers ARCH-01 export and sample payload/snapshot shapes. [VERIFIED: packages/shared/src/contracts.test.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no for Phase 1 | Existing project has no external authentication; do not alter auth in shell phase. [VERIFIED: .planning/codebase/ARCHITECTURE.md] |
| V3 Session Management | yes, indirectly | Continue filtering session state by `sessionId` and do not create browser-authoritative game state. [VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; AGENTS.md] |
| V4 Access Control | yes, indirectly | Keep authoritative input application on server `GameManager.applyInput()` by socket/player context. [VERIFIED: apps/server/src/games/manager.ts; apps/server/src/games/runtime.ts] |
| V5 Input Validation | yes | Use discriminated unions and runtime guards in server runtimes before trusting input payloads; Socket.IO type hints do not replace validation. [VERIFIED: packages/shared/src/contracts.ts] [CITED: socket.io/docs/v4/typescript/] |
| V6 Cryptography | no | No cryptography changes in Phase 1. [VERIFIED: .planning/ROADMAP.md] |

### Known Threat Patterns for React/Socket.IO Game Input

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed or high-frequency `gameInput` payloads | Tampering / Denial of Service | Server-side discriminant checks, numeric clamping, sequence handling, and future rate limiting. [VERIFIED: .planning/codebase/CONCERNS.md; packages/shared/src/contracts.ts] |
| Client claims final game outcome | Tampering | Treat browser input as intent only; server runtime remains authoritative for snapshots/results. [VERIFIED: AGENTS.md; apps/server/src/games/runtime.ts] |
| Stale session snapshots rendered after navigation | Information disclosure / UX integrity | Filter by `sessionId` as existing hooks do, and reset input state on route unmount. [VERIFIED: apps/web/src/lib/useGameSessionSocket.ts; 01-UI-SPEC.md] |
| XSS through HUD labels or nicknames | Information disclosure / Tampering | React escapes text by default, but keep HUD as text nodes and avoid `dangerouslySetInnerHTML`. [VERIFIED: local React code uses JSX text rendering; apps/web/src/pages/SprintCircuitPage.tsx] |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/1-CONTEXT.md` - locked Phase 1 decisions, discretion areas, deferred scope. [VERIFIED: local file]
- `.planning/phases/01-fullscreen-game-shell-and-input-foundation/01-UI-SPEC.md` - fullscreen shell, controls, typography, color, HUD, shared contract expectations. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` - CTRL-01 through CTRL-04 and ARCH-01 descriptions. [VERIFIED: local file]
- `.planning/ROADMAP.md` - Phase 1 goal, success criteria, and implementation notes. [VERIFIED: local file]
- `AGENTS.md` - workspace rules, verification commands, deployment target. [VERIFIED: local file]
- `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/CONCERNS.md` - current architecture, concerns, and testing gaps. [VERIFIED: local files]
- `apps/web/src/app/router.tsx`, `apps/web/src/pages/SprintCircuitPage.tsx`, `apps/web/src/lib/useLiveRaceSocket.ts`, `apps/web/src/lib/useGameSessionSocket.ts`, `packages/shared/src/game.ts`, `packages/shared/src/contracts.ts` - implementation boundaries and current patterns. [VERIFIED: local files]
- npm registry via `npm view` - current package versions and modified timestamps. [VERIFIED: npm registry]
- MDN Pointer Events, `setPointerCapture`, `touch-action`, `env()`, and CSS length/dynamic viewport docs. [CITED: developer.mozilla.org]
- Socket.IO v4 emitting events and TypeScript docs. [CITED: socket.io/docs/v4/emitting-events/; socket.io/docs/v4/typescript/]
- React `useEffect` docs. [CITED: react.dev/reference/react/useEffect]

### Secondary (MEDIUM confidence)
- Testing Library user-event pointer docs - jsdom pointer testing limitations and pointer API behavior. [CITED: testing-library.com/docs/user-event/pointer/]
- React Router `createMemoryRouter` docs - route testing support with memory history. [CITED: reactrouter.com/api/data-routers/createMemoryRouter]

### Tertiary (LOW confidence)
- None used as authoritative sources. [VERIFIED: source list]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - local package files, lockfile, and npm registry checks agree for installed/current versions; no core dependency migration is required. [VERIFIED: apps/web/package.json; apps/server/package.json; pnpm-lock.yaml; npm registry via `npm view`]
- Architecture: HIGH - project docs and source files clearly establish React route pages, Socket.IO session events, server runtime authority, and shared contracts. [VERIFIED: .planning/codebase/ARCHITECTURE.md; apps/server/src/games/runtime.ts; packages/shared/src/index.ts]
- Input/control browser patterns: HIGH - MDN official docs support pointer capture and `touch-action`; UI-SPEC locks these patterns. [CITED: developer.mozilla.org] [VERIFIED: 01-UI-SPEC.md]
- Pitfalls: HIGH for local pitfalls, MEDIUM for mobile feel because real-device ergonomics still need manual validation. [VERIFIED: .planning/codebase/CONCERNS.md; 01-UI-SPEC.md]

**Research date:** 2026-04-25 [VERIFIED: date/current prompt]  
**Valid until:** 2026-05-25 for local architecture and browser APIs; re-check npm versions before dependency changes. [ASSUMED]
