import { describe, expect, test } from 'vitest';

import { advanceRaceState, createInitialRetroRaceState } from './useRetroRace';

describe('retro race engine', () => {
  test('creates a clean practice state without bots', () => {
    const state = createInitialRetroRaceState('practice');

    expect(state.mode).toBe('practice');
    expect(state.bots).toHaveLength(0);
    expect(state.player.x).toBe(0.5);
  });

  test('creates bot opponents only in bot mode', () => {
    const state = createInitialRetroRaceState('bot');

    expect(state.mode).toBe('bot');
    expect(state.bots.length).toBeGreaterThan(0);
  });

  test('advances the player with controlled steering and clamps position', () => {
    const initial = createInitialRetroRaceState('practice');
    const next = advanceRaceState(initial, {
      deltaMs: 16,
      steer: -1,
      accelerate: true,
      brake: false,
    });

    expect(next.player.speed).toBeGreaterThan(initial.player.speed);
    expect(next.player.x).toBeLessThan(initial.player.x);
    expect(next.player.x).toBeGreaterThanOrEqual(0.18);
    expect(next.player.x).toBeGreaterThan(0.47);
  });
});
