# Phase 5: Figure-Eight Analog Track Race - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25T21:39:24Z
**Phase:** 05-figure-eight-analog-track-race
**Areas discussed:** Crossing Readability, Checkpoint Order Through The Eight, Penalty Behavior At The Crossing, Difficulty And Track Feel

---

## Crossing Readability

| Option | Description | Selected |
|--------|-------------|----------|
| Intentional crossing treatment | Use bridge/underpass styling, directional arrows, and next-path highlighting so the intersection reads as designed. | ✓ |
| Minimal visual crossing | Draw the center crossing plainly and rely mainly on HUD/checkpoint state. | |
| Complex traffic/collision crossing | Add player-to-player conflict or crossing hazards at the center. | |

**User's choice:** User selected all areas with recommended decisions.
**Notes:** Recommended choice is intentional crossing treatment. This keeps the map distinct from the circle while avoiding extra collision chaos.

---

## Checkpoint Order Through The Eight

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit ordered gates | Add lobe-specific and center-crossing gates with deterministic validation and tests. | ✓ |
| Nearest path/progress only | Infer progress from nearest position on the figure-eight path. | |
| Loose lap completion | Let any full route-ish progress count as long as the player reaches start/finish. | |

**User's choice:** User selected all areas with recommended decisions.
**Notes:** Recommended choice is explicit ordered gates. It prevents center-cut ambiguity and gives planners clear geometry tests.

---

## Penalty Behavior At The Crossing

| Option | Description | Selected |
|--------|-------------|----------|
| Warning-first recoverable penalties | Warn for wrong lobe, wrong-way, or cutting behavior, then apply slowdown if it persists. | ✓ |
| Instant hard reset | Immediately reset or teleport the car when crossing behavior is wrong. | |
| No crossing penalties | Let the player freely cut or reverse through the center without progress validation consequences. | |

**User's choice:** User selected all areas with recommended decisions.
**Notes:** Recommended choice carries forward Phase 4's warning-first model. Cutting should not advance progress, and sustained violations should apply visible slowdown/penalty.

---

## Difficulty And Track Feel

| Option | Description | Selected |
|--------|-------------|----------|
| More complex but forgiving | Make the figure-eight harder than the circle through route awareness, while keeping road width and turn radii phone-friendly. | ✓ |
| Same difficulty as circle | Keep the figure-eight almost as easy as the circular baseline. | |
| Tight technical course | Make the figure-eight significantly harder with narrow turns and harsh penalties. | |

**User's choice:** User selected all areas with recommended decisions.
**Notes:** Recommended choice gives Phase 5 a distinct identity without making the first phone-playable version frustrating.

---

## the agent's Discretion

- Exact geometry, checkpoint count, and gate placement.
- Exact visual style for bridge/underpass, arrows, and next-path highlights.
- Exact warning/penalty tuning constants.
- Exact module split, as long as deterministic tests cover crossing order and existing circular analog tests keep passing.

## Deferred Ideas

- Final lobby catalog and result polish belongs to Phase 6.
- Center-crossing player collisions, traffic hazards, powerups, haptics, sound, and advanced camera effects are deferred.
