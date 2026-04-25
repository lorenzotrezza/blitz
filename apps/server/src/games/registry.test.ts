import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLobbySelectionStartable,
  PARTY_GAMES,
  PARTY_GAME_VARIANTS,
} from '@blitz/shared';

import { createGameRuntimeRegistry } from './registry.js';

test('game registry support matches shared lobby startability for current known selections', () => {
  const registry = createGameRuntimeRegistry();
  const selections = [
    { game: PARTY_GAMES.lights, variant: null },
    { game: PARTY_GAMES.penalty, variant: null },
    { game: PARTY_GAMES.race, variant: PARTY_GAME_VARIANTS.sprintCircuit },
    { game: PARTY_GAMES.race, variant: PARTY_GAME_VARIANTS.dragSprint },
  ] as const;

  for (const selection of selections) {
    const supportedByRegistry = registry.resolve(selection.game, selection.variant) !== null;
    const startableInLobby = isLobbySelectionStartable(selection.game, selection.variant);

    assert.equal(
      supportedByRegistry,
      startableInLobby,
      `registry/startability drift for ${selection.game}:${selection.variant ?? 'default'}`,
    );
  }
});
