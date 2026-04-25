# Agent Guide: Blitz

## Project Context

Read these first before planning or implementation:

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`

## Current Goal

Rebuild the race/minigame catalog so the games are actually playable, especially on phones. The player should affect outcomes through timing, steering, gear shifts, obstacle avoidance, and analog control.

## Workflow

- Use `$gsd-discuss-phase 1` before implementation unless the user explicitly skips discussion.
- Use `$gsd-ui-phase 1` for frontend/gameplay screen design before coding Phase 1.
- Keep phase work mapped to `.planning/REQUIREMENTS.md`.
- Update `.planning/STATE.md` after phase transitions.

## Engineering Rules

- Keep the current pnpm workspace architecture.
- Source of truth is `apps/**/src` and `packages/shared/src`.
- Server gameplay state is authoritative.
- Put shared socket/input/snapshot contracts in `packages/shared`.
- Prefer deterministic rule helpers with tests over adding more logic to large runtime files.
- Gameplay screens must be mobile-first and fullscreen.

## Verification

Use these checks before claiming completion:

- `pnpm run build`
- `pnpm test`
- Focused tests for changed packages when iteration speed matters.

## Deployment

Render Free is the current intended low-cost target.

- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
- Start command: `pnpm start`
- Health check: `/health`
