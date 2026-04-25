# Phase 2: Drag Gear Race - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-25T16:54:18Z
**Phase:** 02-drag-gear-race
**Areas discussed:** Gear timing feel, Acceleration and controls, Race pacing and difficulty, HUD and results feedback

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Gear timing feel | Shift window size, early/perfect/late consequences, and how forgiving the race should be. Recommended because this is the core skill loop. | yes |
| Acceleration and controls | Hold-to-accelerate plus shift, automatic throttle plus shift, or a more involved two-button rhythm. | yes |
| Race pacing and difficulty | Number of gears, race length, finish-time spread, and whether a bad shift is recoverable. | yes |
| HUD and results feedback | RPM display, ideal shift cue, last-shift quality, finish time, and shift performance summary. | yes |

**User's choice:** "tutti con condigli" interpreted as all areas with recommended defaults.
**Notes:** The user accepted the recommended set with "va bene procedi".

---

## Gear Timing Feel

| Option | Description | Selected |
|--------|-------------|----------|
| Forgiving visible window | Early loses some acceleration, good/perfect reward timing, late applies a small speed/RPM drop. Learnable in one or two races. | yes |
| Strict narrow window | More skillful but harder to learn on phone and riskier for first playable version. | |
| Hidden timing | Cleaner screen but weaker feedback and harder onboarding. | |

**User's choice:** Recommended forgiving visible window.
**Notes:** Locked outcomes: early, good, perfect, late.

---

## Acceleration And Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Hold accelerate plus shift | Player holds throttle and presses shift at the right time. Best fit for phone play and player agency. | yes |
| Automatic throttle plus shift | Simpler, but risks feeling less manually playable. | |
| More involved rhythm controls | Potentially deeper, but too much for the first drag phase. | |

**User's choice:** Recommended hold-to-accelerate plus shift.
**Notes:** No steering in this phase.

---

## Race Pacing And Difficulty

| Option | Description | Selected |
|--------|-------------|----------|
| Short 4-gear race | Roughly 12-18 seconds, recoverable single error, clear advantage for better timing. | yes |
| Longer 5-6 gear race | More depth, but risks dragging out each party round. | |
| Very short sprint | Fast, but too few decisions to prove gear timing matters. | |

**User's choice:** Recommended short 4-gear race.
**Notes:** Tune so one bad shift is recoverable, while multiple good shifts clearly win.

---

## HUD And Results Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| RPM-led HUD with shift summary | Show RPM, gear, speed, distance, last shift quality; results include finish time and shift quality counts. | yes |
| Minimal HUD | Less clutter, but too little feedback for learning shift timing. | |
| Detailed telemetry HUD | Rich, but likely too busy for phone gameplay. | |

**User's choice:** Recommended RPM-led HUD with shift summary.
**Notes:** React-rendered status remains required for testability and accessibility.

---

## the agent's Discretion

- Exact numeric RPM scale and tuning constants.
- Exact visual shift cue representation.
- Exact desktop fallback keys within the Phase 1 control contract.
- Internal helper/module split for replacing or refactoring the old drag runtime.

## Deferred Ideas

- Steering, obstacles, and lane play are deferred to Phase 3.
- Analog controls and track checkpoint logic are deferred to Phases 4 and 5.
- Lobby catalog and broad results polish are deferred to Phase 6.
