---
quick_id: 20260425
slug: ui-laps-gift-locked-maps
status: planned
created: 2026-04-25
---

# Quick Task: UI laps, gift clarity, locked maps

## Goal
Make the legacy Blitz flow clearer and more reactive:

- In car selection, make the gifted lap count clearer and hint why each car gets that number in a track-day reality-check tone.
- In the final result screen, clearly state what gift the player is receiving.
- In track selection, make every locked map clickable and show a deliberately dumb locked-track response like the existing Roman circuit gag.

## Scope
- Edit `index.html` legacy flow.
- Add focused coverage in `tests/blitz-flow.test.js`.
- Keep unrelated worktree changes untouched.

## Verification
- Run the focused legacy Node test.
- Run web package tests if dependency state allows it.
