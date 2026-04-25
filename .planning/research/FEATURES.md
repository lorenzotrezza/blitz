# Project Research: Features

## Table Stakes

These are required for the rebuilt race catalog to feel playable.

- Fullscreen gameplay route that prioritizes the track, HUD, and controls over page chrome.
- Mobile-first touch controls with stable placement and no accidental scrolling.
- Distinct race mode cards/names/descriptions so users understand the difference before starting.
- Server-authoritative input loop with visible response to each player action.
- HUD that explains current objective: RPM/gear, speed, distance, lane, lap, checkpoints, penalties, or shift quality.
- Deterministic scoring/results so players understand why they won or lost.
- Tests for runtime rules, input mapping, route rendering, and results payloads.

## Differentiators For This Project

- Drag race where the core skill is shifting at the right time, not steering.
- Straight obstacle race where the core skill is avoiding slowdowns and choosing lanes/position.
- Circular track using analog pad movement for continuous control.
- Figure-eight track using analog pad movement plus crossing/intersection risk.
- Explicit mobile thumb ergonomics: left thumb analog/steer, right thumb action/accelerate/shift depending on mode.
- Reuse the party lobby flow so people can compare results after short rounds.

## Anti-Features

- Autoplay-style racing where the car advances with little meaningful input.
- Multiple race variants that differ only by name while sharing the same map and controls.
- Small page-embedded control clusters below the canvas on phone.
- Controls that require reading instructions mid-race.
- Complex simulation tuning before the arcade feel is working.

## Suggested v1 Feature Set

1. Control/screen foundation for fullscreen mobile play.
2. Drag Gear Race.
3. Straight Obstacle Race.
4. Analog Circuit Race on circular track.
5. Analog Figure-Eight Race.
6. Lobby/results integration and final polish across all modes.
