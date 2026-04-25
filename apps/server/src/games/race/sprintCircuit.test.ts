import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_STATUS,
  PLAYER_CONNECTION_STATE,
  type LobbyState,
  type RaceSnapshot,
} from '@blitz/shared';

import { createSprintCircuitRuntime } from './sprintCircuit.js';

function createLobby(): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'sprint-circuit',
    status: LOBBY_STATUS.waiting,
    settings: {
      maxPlayers: 8,
      laps: 2,
    },
    players: [
      {
        id: 'socket-host',
        nickname: 'Blitz',
        carId: 'f812',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
      {
        id: 'socket-guest',
        nickname: 'SubrataPal',
        carId: 'panda',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
    ],
  };
}

test('advances players through checkpoints on a sprint circuit track', () => {
  const runtime = createSprintCircuitRuntime(createLobby(), 'session-race', {
    countdownMs: 0,
    laps: 1,
  });

  const initial = runtime.start();
  const next = runtime.applyInput('socket-host', {
    tick: 1,
    steer: 1,
    accelerate: true,
    brake: false,
  });

  assert.ok(next);
  const initialSnapshot = initial.state as RaceSnapshot;
  const nextSnapshot = next.state as RaceSnapshot;

  assert.equal(nextSnapshot.trackId, 'sprint-circuit');
  assert.ok(nextSnapshot.playersState[0]!.checkpoint >= 0);
  assert.ok(nextSnapshot.playersState[0]!.progress > initialSnapshot.playersState[0]!.progress);
});
