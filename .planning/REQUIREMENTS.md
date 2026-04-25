# Requirements: Blitz Playable Minigames

**Defined:** 2026-04-25
**Core Value:** Every minigame must feel manually playable on a phone: the player should win or lose because of timing, steering, gear changes, obstacle avoidance, and control skill.

## v1 Requirements

### Game Shell And Controls

- [ ] **CTRL-01**: Player can play race sessions in a fullscreen mobile-first game screen where the track, HUD, and controls are visible without scrolling.
- [ ] **CTRL-02**: Player can use touch controls that stay in fixed thumb-friendly zones and do not trigger browser scrolling during gameplay.
- [ ] **CTRL-03**: Player can see mode-specific HUD feedback for objective, progress, speed, penalty, and current input state.
- [ ] **CTRL-04**: Keyboard or desktop users have a usable fallback for every required gameplay input.

### Drag Gear Race

- [ ] **DRAG-01**: Player can start a straight drag race and control acceleration.
- [ ] **DRAG-02**: Player can shift gears during the race.
- [ ] **DRAG-03**: The runtime scores shift timing as early, good/perfect, or late and changes acceleration/result accordingly.
- [ ] **DRAG-04**: Player can see RPM, current gear, speed, distance, and last shift quality during the race.
- [ ] **DRAG-05**: Results show finish time and shift performance summary.

### Straight Obstacle Race

- [ ] **DODGE-01**: Player can race on a straight map with active lane or horizontal positioning controls.
- [ ] **DODGE-02**: The runtime spawns readable obstacle patterns on the straight map.
- [ ] **DODGE-03**: Hitting an obstacle visibly slows the player and affects final result.
- [ ] **DODGE-04**: Player can see obstacle warnings, current speed, distance, and slowdown/penalty state.
- [ ] **DODGE-05**: Results show finish time and obstacle hit count.

### Analog Track Races

- [ ] **ANLG-01**: Player can control a car with an analog-style touch pad that outputs continuous direction/magnitude.
- [ ] **ANLG-02**: Player can race on a circular track with checkpoint/lap validation.
- [ ] **ANLG-03**: Player can race on a figure-eight track with checkpoint/lap validation and readable crossing/intersection behavior.
- [ ] **ANLG-04**: The runtime detects off-track or wrong-way behavior and applies clear feedback/penalties.
- [ ] **ANLG-05**: Player can see lap, checkpoint, direction, speed, and penalty feedback during analog races.

### Lobby, Results, And Variants

- [ ] **FLOW-01**: Host can choose distinct race variants for Drag Gear, Straight Obstacle, Circle Track, and Figure-Eight Track from the lobby.
- [ ] **FLOW-02**: Lobby UI explains each race variant's objective and primary control method.
- [ ] **FLOW-03**: Session routing opens the correct fullscreen game screen for each selected race variant.
- [ ] **FLOW-04**: Results page can display mode-specific summaries for timing, shifts, obstacle hits, laps, and penalties.
- [ ] **FLOW-05**: Existing non-race minigames and lobby post-game actions keep working after race rebuild.

### Architecture And Verification

- [ ] **ARCH-01**: Shared contracts define explicit input and snapshot shapes for each rebuilt race mode.
- [ ] **ARCH-02**: Server race rules are covered by deterministic tests for timing, collisions, checkpoints, penalties, and results.
- [ ] **ARCH-03**: Web tests cover core route rendering, control availability, and mode-specific HUD copy.
- [ ] **ARCH-04**: Root build/test commands pass before the milestone is considered complete.

## v2 Requirements

### Persistence And Social

- **PERS-01**: Persist high scores or best times per mode.
- **PERS-02**: Add persistent player identity beyond socket id.
- **PERS-03**: Add shareable post-game recap cards.

### Advanced Gameplay

- **ADV-01**: Add AI opponents with difficulty levels.
- **ADV-02**: Add powerups or hazards beyond the initial obstacle race.
- **ADV-03**: Add car-specific handling differences.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile app | Browser mobile play is the target for this milestone. |
| Database-backed lobby/session persistence | Gameplay validation can use existing in-memory sessions. |
| Leaderboards/accounts | They do not fix the current lack of playability. |
| Simulation-grade physics | Arcade feel is more important than realism. |
| New non-race games | The stated problem is the race catalog. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CTRL-01 | Phase 1 | Pending |
| CTRL-02 | Phase 1 | Pending |
| CTRL-03 | Phase 1 | Pending |
| CTRL-04 | Phase 1 | Pending |
| DRAG-01 | Phase 2 | Pending |
| DRAG-02 | Phase 2 | Pending |
| DRAG-03 | Phase 2 | Pending |
| DRAG-04 | Phase 2 | Pending |
| DRAG-05 | Phase 2 | Pending |
| DODGE-01 | Phase 3 | Pending |
| DODGE-02 | Phase 3 | Pending |
| DODGE-03 | Phase 3 | Pending |
| DODGE-04 | Phase 3 | Pending |
| DODGE-05 | Phase 3 | Pending |
| ANLG-01 | Phase 4 | Pending |
| ANLG-02 | Phase 4 | Pending |
| ANLG-04 | Phase 4 | Pending |
| ANLG-05 | Phase 4 | Pending |
| ANLG-03 | Phase 5 | Pending |
| FLOW-01 | Phase 6 | Pending |
| FLOW-02 | Phase 6 | Pending |
| FLOW-03 | Phase 6 | Pending |
| FLOW-04 | Phase 6 | Pending |
| FLOW-05 | Phase 6 | Pending |
| ARCH-01 | Phase 1 | Pending |
| ARCH-02 | Phase 2 | Pending |
| ARCH-03 | Phase 6 | Pending |
| ARCH-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-04-25*
*Last updated: 2026-04-25 after initial definition*
