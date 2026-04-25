import assert from 'node:assert/strict';
import test from 'node:test';

import { LOBBY_RACE_MODES, isLobbySelectionStartable, PARTY_GAMES, PARTY_GAME_VARIANTS } from '@blitz/shared';

import { createGameRuntimeRegistry } from './registry.js';

test('game registry exposes the current playable variants while shared startability stays mode-aware', () => {
  const registry = createGameRuntimeRegistry();
  assert.equal(registry.resolve(PARTY_GAMES.lights, null) !== null, true);
  assert.equal(registry.resolve(PARTY_GAMES.penalty, null) !== null, true);
  assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.sprintCircuit) !== null, true);
  assert.equal(registry.resolve(PARTY_GAMES.race, PARTY_GAME_VARIANTS.dragSprint) !== null, true);

  assert.equal(
    isLobbySelectionStartable(
      PARTY_GAMES.race,
      PARTY_GAME_VARIANTS.dragSprint,
      LOBBY_RACE_MODES.finishLine,
      3,
    ),
    true,
  );
  assert.equal(
    isLobbySelectionStartable(
      PARTY_GAMES.race,
      PARTY_GAME_VARIANTS.dragSprint,
      LOBBY_RACE_MODES.survival,
      3,
    ),
    false,
  );
  assert.equal(
    isLobbySelectionStartable(
      PARTY_GAMES.race,
      PARTY_GAME_VARIANTS.dragSprint,
      LOBBY_RACE_MODES.bestOf3,
      3,
    ),
    true,
  );
  assert.equal(
    isLobbySelectionStartable(
      PARTY_GAMES.race,
      PARTY_GAME_VARIANTS.dragSprint,
      LOBBY_RACE_MODES.finishLine,
      4,
    ),
    false,
  );
});
