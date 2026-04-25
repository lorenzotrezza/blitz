# Phase 3: Straight Obstacle Race - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-25T17:17:33Z
**Phase:** 03-straight-obstacle-race
**Areas discussed:** Dodge Control Feel, Obstacle Pattern Design, Hit Penalty And Recovery, Track And HUD Readability

---

## Dodge Control Feel

| Option | Description | Selected |
|--------|-------------|----------|
| Smooth horizontal steering | Three visual lanes may remain, but the car slides continuously left/right for direct phone control. | yes |
| Lane-snap movement | Left/right inputs move between fixed lane indexes. Simpler, but feels more like menu navigation. | |

**User's choice:** User asked to discuss all areas with recommendations, then approved the recommended set.
**Notes:** Recommended smooth horizontal steering because it makes the player feel directly responsible for dodging and avoids making the straight obstacle race feel like a renamed lane picker.

---

## Obstacle Pattern Design

| Option | Description | Selected |
|--------|-------------|----------|
| Seeded readable waves | Deterministic waves with increasing pressure, fair reaction time, and testable patterns. | yes |
| Pure random spawns | More varied, but can create unfair or untestable obstacle placements. | |
| Fixed script only | Very teachable, but risks feeling solved after a few runs. | |

**User's choice:** User asked to discuss all areas with recommendations, then approved the recommended set.
**Notes:** Recommended seeded readable waves so multiplayer outcomes are fair and runtime tests can assert exact obstacle behavior.

---

## Hit Penalty And Recovery

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate speed drop plus short recovery | Collision visibly cuts speed, increments hit count, and shows slowdown for roughly 1-1.5 seconds. | yes |
| Tiny speed loss only | Low frustration, but hits may not feel meaningful. | |
| Long stun or hard stop | Very clear consequence, but likely too punishing for a first mobile tune. | |

**User's choice:** User asked to discuss all areas with recommendations, then approved the recommended set.
**Notes:** Recommended visible slowdown recovery. One hit should hurt but remain recoverable; repeated hits should decide final time.

---

## Track And HUD Readability

| Option | Description | Selected |
|--------|-------------|----------|
| Warning-first phone layout | Road shows incoming danger early; HUD shows distance, speed, hit count, and slowdown state. | yes |
| HUD-heavy explanation | More explicit text, but distracts from fast phone play. | |
| Canvas-only feedback | Visually compact, but weaker for testing and accessibility. | |

**User's choice:** User asked to discuss all areas with recommendations, then approved the recommended set.
**Notes:** Recommended warning-first road readability with React-rendered HUD text for speed, distance, warnings, hit count, and slowdown state.

---

## the agent's Discretion

- Exact steering sensitivity and track width.
- Exact obstacle dimensions, wave spacing, and difficulty ramp.
- Exact warning visuals and collision feedback styling.
- Exact route/runtime integration target, as long as the final mode satisfies DODGE-01 through DODGE-05 and keeps the server authoritative.

## Deferred Ideas

- Gear/RPM shift timing remains Phase 2 scope.
- Analog tracks, checkpoints, laps, and off-track penalties remain Phases 4 and 5 scope.
- Lobby catalog copy and broad result polish remain Phase 6 scope.
- Sound, haptics, camera shake, and advanced visual polish remain later polish.
