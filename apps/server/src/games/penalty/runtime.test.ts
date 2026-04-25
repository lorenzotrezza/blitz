import assert from 'node:assert/strict';
import test from 'node:test';

import { PLAYER_CONNECTION_STATE, type LobbyState } from '@blitz/shared';

import { createPenaltyRuntime, type PenaltySessionState } from './runtime.js';

function seedLobby(): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'kicker',
    mode: 'multiplayer',
    selectedGame: 'penalty',
    selectedVariant: null,
    status: 'in-session',
    settings: {
      maxPlayers: 8,
      rounds: 1,
    },
    players: [
      {
        id: 'kicker',
        nickname: 'Blitz',
        carId: 'f812',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
      {
        id: 'keeper',
        nickname: 'SubrataPal',
        carId: 'panda',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
    ],
  };
}

test('resolves a penalty turn from hidden kick and dive choices', () => {
  const runtime = createPenaltyRuntime(seedLobby(), 'session-penalty', {
    countdownMs: 0,
    revealMs: 0,
  });

  runtime.start();
  runtime.applyInput('kicker', {
    lane: 'left',
    shot: 'power',
  });
  const resolved = runtime.applyInput('keeper', {
    dive: 'right',
  });

  assert.ok(resolved);
  const state = resolved.state as PenaltySessionState;

  assert.equal(state.players[0]?.goals, 1);
  assert.equal(state.turn, 2);
});
