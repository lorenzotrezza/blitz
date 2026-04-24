import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_STATUS,
  PLAYER_CONNECTION_STATE,
  RACE_STATUS,
  type LobbyState,
} from '@blitz/shared';

import { applyPlayerInput, armRaceSession, createRaceSession } from './session.js';

function createLobby(): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    status: LOBBY_STATUS.waiting,
    settings: {
      trackId: 'track-oval',
      botCount: 0,
      maxPlayers: 8,
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

test('createRaceSession builds a countdown snapshot from the lobby entrants', () => {
  const session = createRaceSession(createLobby(), 'session-1');

  assert.equal(session.snapshot.sessionId, 'session-1');
  assert.equal(session.snapshot.status, RACE_STATUS.countdown);
  assert.equal(session.snapshot.countdown, 3);
  assert.equal(session.snapshot.playersState.length, 2);
  assert.equal(session.snapshot.playersState[0]?.playerId, 'socket-host');
});

test('applyPlayerInput advances the player while keeping steering under control', () => {
  const session = armRaceSession(createRaceSession(createLobby(), 'session-1'), 1_000);
  const previous = session.snapshot.playersState[0]!;
  const result = applyPlayerInput(
    session,
    'socket-host',
    {
      tick: 1,
      steer: 1,
      accelerate: true,
      brake: false,
    },
    1_080,
  );
  const next = result.session.snapshot.playersState[0]!;

  assert.equal(result.finished, null);
  assert.equal(result.session.snapshot.status, RACE_STATUS.racing);
  assert.ok(next.progress > previous.progress);
  assert.ok(next.speed > previous.speed);
  assert.ok(next.x > previous.x);
  assert.ok(next.x < 360);
});

test('applyPlayerInput finishes the race once every player has completed the lap', () => {
  const session = armRaceSession(createRaceSession(createLobby(), 'session-1'), 1_000);
  session.snapshot.playersState[0] = {
    ...session.snapshot.playersState[0]!,
    progress: 0.995,
    speed: 4.2,
  };
  session.snapshot.playersState[1] = {
    ...session.snapshot.playersState[1]!,
    progress: 1,
    lap: 1,
    speed: 0,
  };
  session.finishTimesMs['socket-guest'] = 3_900;

  const result = applyPlayerInput(
    session,
    'socket-host',
    {
      tick: 2,
      steer: 0,
      accelerate: true,
      brake: false,
    },
    5_200,
  );

  assert.equal(result.session.snapshot.status, RACE_STATUS.finished);
  assert.ok(result.finished);
  assert.equal(result.finished?.standings[0]?.entrantType, 'player');
  assert.equal(result.finished?.standings[0]?.entrantId, 'socket-guest');
  assert.equal(result.finished?.standings[1]?.entrantId, 'socket-host');
});
