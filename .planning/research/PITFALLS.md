# Project Research: Pitfalls

## Pitfall 1: Controls Feel Like UI Buttons, Not Game Controls

**Warning signs:**
- Buttons sit below the canvas and require looking away from the track.
- Touch input scrolls the page or loses press state.
- Player cannot comfortably play with two thumbs.

**Prevention:**
- Build a fullscreen game shell in Phase 1.
- Use fixed-position control zones and `touch-action: none`.
- Test on narrow mobile viewport before adding more mechanics.

**Phase:** Phase 1

## Pitfall 2: Drag Race Becomes Autoplay

**Warning signs:**
- Holding accelerate is enough to finish.
- Shift timing barely changes result.
- HUD does not show RPM/gear/shift feedback.

**Prevention:**
- Make shift timing materially affect acceleration and final time.
- Show RPM band, current gear, last shift quality, and finish delta.
- Add tests for early/perfect/late shifts.

**Phase:** Phase 2

## Pitfall 3: Straight Obstacle Race Feels Like Drag Race With Sprites

**Warning signs:**
- Obstacles are decorative or unavoidable.
- Collision penalty is too small to matter.
- Player has no lane/position choices.

**Prevention:**
- Define obstacle patterns with readable reaction windows.
- Make hits slow the player visibly and impact results.
- Keep controls different from drag race.

**Phase:** Phase 3

## Pitfall 4: Analog Tracks Are Hard To Read

**Warning signs:**
- Player does not understand where the lap starts or which checkpoint is next.
- Figure-eight intersection feels unfair.
- Car movement clips through track boundaries without feedback.

**Prevention:**
- Render track boundaries, direction arrows, checkpoint gates, and next target.
- Treat off-track and wrong-way states as explicit feedback, not silent failure.
- Start with circle before figure-eight.

**Phase:** Phase 4 and Phase 5

## Pitfall 5: Snapshot Rate And Input Rate Fight Each Other

**Warning signs:**
- Controls feel delayed.
- Server emits too much state.
- Canvas rerenders only when React state changes.

**Prevention:**
- Cap network input/snapshot rates.
- Render local control feedback immediately.
- Keep deterministic server state authoritative.

**Phase:** All gameplay phases

## Pitfall 6: Variants Stay Ambiguous In The Lobby

**Warning signs:**
- Race cards have similar descriptions.
- Users cannot tell which controls/mechanics they are choosing.

**Prevention:**
- Give each mode a clear title, icon, objective, and control hint.
- Show required player count and expected round length.

**Phase:** Phase 6
