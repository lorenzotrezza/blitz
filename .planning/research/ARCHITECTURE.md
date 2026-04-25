# Project Research: Architecture

## Current Architecture Fit

The existing architecture is usable for this milestone:

- Lobby selection chooses `game` and `variant`.
- Server registry resolves the selected runtime.
- Runtime receives player input and emits snapshots/results.
- Web session pages render current state and emit controls.
- Shared contracts define payloads for both sides.

## Proposed Gameplay Architecture

### Shared Layer

Add explicit race mode contracts:

- `DragGearInput`: throttle/shift intent.
- `StraightDodgeInput`: lane or analog horizontal intent plus accelerate/brake if needed.
- `AnalogRaceInput`: analog vector, throttle/brake/action state.
- `RaceModeSnapshot`: mode-specific snapshot discriminated by `mode` or `variant`.

### Server Layer

Keep `GameRuntimeInstance`, but split rules:

- `dragGearRules.ts`: RPM, gear, shift quality, acceleration, finish timing.
- `straightDodgeRules.ts`: lane/position, obstacle streams, collision slowdowns.
- `analogTrackRules.ts`: continuous steering, track projection, checkpoint/lap validation.
- `trackDefinitions.ts`: straight, circle, figure-eight geometry.

Runtime files should orchestrate timers and callbacks; rule files should be deterministic and directly tested.

### Web Layer

Create a reusable fullscreen game shell:

- Track canvas fills available screen.
- HUD overlays top/sides without blocking controls.
- Controls are fixed near bottom safe areas.
- Mode-specific control component plugs into the shell.

Potential components/hooks:

- `FullscreenGameLayout`
- `RaceHud`
- `DragShiftControls`
- `StraightDodgeControls`
- `AnalogPad`
- `useRaceSessionSocket` or generalized `useGameInputSocket`

## Data Flow

1. Lobby host chooses one of the rebuilt race variants.
2. Server starts the matching runtime and emits countdown.
3. Client renders fullscreen game shell and mode controls.
4. Client sends compact input intent at a capped interval or on meaningful changes.
5. Server updates authoritative state on a fixed tick.
6. Server emits snapshots at a controlled rate.
7. Client renders snapshots plus immediate local control feedback.
8. Runtime emits results with mode-specific summary stats.

## Build Order Implications

The control/screen foundation should happen first because every mode depends on it. Then build the two straight races, because they can share distance/progress UI but have distinct mechanics. Then build analog circular and figure-eight races, because they require more track geometry and input tuning.
