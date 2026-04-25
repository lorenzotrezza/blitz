import assert from 'node:assert/strict';
import test from 'node:test';

import { PLAYER_CONNECTION_STATE, type LobbyState } from '@blitz/shared';

import { createLightsRuntime } from './runtime.js';

function seedLobby(): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'p1',
    mode: 'multiplayer',
    selectedGame: 'lights',
    selectedVariant: null,
    status: 'in-session',
    settings: {
      maxPlayers: 8,
      rounds: 1,
    },
    players: [
      {
        id: 'p1',
        nickname: 'Blitz',
        carId: 'f812',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
      {
        id: 'p2',
        nickname: 'SubrataPal',
        carId: 'panda',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
    ],
  };
}

test('ranks players by valid reaction time after the shared lights out event', () => {
  const runtime = createLightsRuntime(seedLobby(), 'session-lights', {
    countdownMs: 0,
    randomDelayMs: () => 0,
    reactionWindowMs: 400,
    revealMs: 0,
    interRoundMs: 0,
  });

  runtime.start();
  runtime.applyInput('p1', { reactionAtMs: 180 });
  const resolved = runtime.applyInput('p2', { reactionAtMs: 240 });

  assert.ok(resolved);
  assert.equal(resolved.status, 'finished');
  assert.equal(resolved.results?.rankings[0]?.playerId, 'p1');
  assert.equal(resolved.results?.rankings[1]?.playerId, 'p2');
});

test('marks false starts behind valid reactions in the final ranking', () => {
  const runtime = createLightsRuntime(seedLobby(), 'session-lights', {
    countdownMs: 0,
    randomDelayMs: () => 200,
    reactionWindowMs: 400,
    revealMs: 0,
    interRoundMs: 0,
  });

  runtime.start();
  runtime.applyInput('p1', { reactionAtMs: 120 });
  const resolved = runtime.applyInput('p2', { reactionAtMs: 260 });

  assert.ok(resolved);
  assert.equal(resolved.status, 'finished');
  assert.equal(resolved.results?.rankings[0]?.playerId, 'p2');
  assert.match(resolved.results?.rankings[1]?.label ?? '', /false start/i);
});
