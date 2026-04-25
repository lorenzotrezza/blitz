# Phase 4: Circular Analog Track Race - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-25T19:19:13Z
**Phase:** 04-circular-analog-track-race
**Areas discussed:** Analog Control Feel, Circular Track Shape And Readability, Checkpoints And Laps, Off-Track And Wrong-Way Handling, Results And Multiplayer Fairness, Integration Shape

---

## Analog Control Feel

| Option | Description | Selected |
|--------|-------------|----------|
| Single analog pad controls direction and throttle magnitude | Best fit for ANLG-01 and Phase 1 analog contract; fewer thumb actions while tuning first analog mode | Yes |
| Analog steering plus separate hold-to-accelerate button | More traditional racing control, but adds right-thumb dependency before analog feel is proven | |
| Discrete left/right steering | Easier to wire from existing code, but conflicts with the analog-track requirement | |

**User's choice:** Non-interactive fallback selected the recommended default: single analog pad controls direction and throttle magnitude.
**Notes:** Phase 1 already locked bottom-left analog control, normalized vectors, and keyboard fallback.

---

## Circular Track Shape And Readability

| Option | Description | Selected |
|--------|-------------|----------|
| Simple circular or oval ring | Clear baseline analog map; lets Phase 4 focus on control feel, checkpoints, and penalties | Yes |
| Reuse the existing sprint-circuit polyline | Faster reuse, but visually/mechanically less aligned with a circular analog baseline | |
| Complex technical circuit | More interesting later, but too much difficulty while analog controls are being introduced | |

**User's choice:** Non-interactive fallback selected the recommended default: simple circular or oval ring.
**Notes:** Track should show boundaries, route direction, checkpoint gates, and lap progress without relying on explanatory text.

---

## Checkpoints And Laps

| Option | Description | Selected |
|--------|-------------|----------|
| Ordered checkpoint gates | Deterministic, testable, and clear for player feedback | Yes |
| Nearest-point or angle-only progress | Simpler math but can allow skipped checkpoints or ambiguous lap completion | |
| Free driving with lap percentage only | Less friction, but does not satisfy checkpoint/lap validation strongly enough | |

**User's choice:** Non-interactive fallback selected the recommended default: ordered checkpoint gates.
**Notes:** A lap completes after all ordered gates are reached and the start/finish gate is crossed.

---

## Off-Track And Wrong-Way Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Warn first, then slowdown/penalty | Forgiving on phones while still making mistakes affect outcomes | Yes |
| Instant reset or teleport | Clear but harsh and likely frustrating while learning analog control | |
| No penalty, feedback only | Easy to implement but weakens ANLG-04 and outcome responsibility | |

**User's choice:** Non-interactive fallback selected the recommended default: warning plus recoverable slowdown/penalty.
**Notes:** Feedback must be visible in both track visuals and React-rendered HUD text.

---

## Results And Multiplayer Fairness

| Option | Description | Selected |
|--------|-------------|----------|
| Server-authoritative finish time plus penalty summary | Matches project architecture and makes runs explainable | Yes |
| Client-computed driving state | Lower latency, but violates server-authoritative gameplay state | |
| Finish ranking only | Minimal, but loses the reason why a player won or lost | |

**User's choice:** Non-interactive fallback selected the recommended default: server-authoritative ranking with penalty summary.
**Notes:** Snapshot should expose lap, checkpoint, speed, warnings, penalty count, and analog/input state.

---

## Integration Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated `circle-track` race identity | Keeps circle analog distinct from old sprint circuit and easier for Phase 6 catalog polish | Yes |
| Overwrite `sprint-circuit` behavior | Faster in the current registry, but risks confusing old route/tests and catalog migration | |
| Local-only prototype route | Useful for experiments, but Phase 4 goal is a shippable playable mode | |

**User's choice:** Non-interactive fallback selected the recommended default: dedicated circular analog race identity.
**Notes:** Use active generic session socket events and avoid stale race-specific event names.

---

## the agent's Discretion

- Exact analog sensitivity, drag, speed cap, turn damping, and grace-window constants.
- Exact number and placement of checkpoint gates.
- Exact visual styling for arrows, gates, off-track warning, and wrong-way warning.
- Exact helper/module boundaries, as long as deterministic rule tests cover the geometry and penalties.

## Deferred Ideas

- Figure-eight map and crossing/intersection behavior.
- Final lobby catalog polish and mode-card copy.
- Simulation-grade physics, car handling differences, powerups, haptics, and advanced camera effects.
- Player-to-player collisions for analog track races unless trivial and low-risk.
