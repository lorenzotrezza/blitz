import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_RACE_MODES,
  LOBBY_STATUS,
  PLAYER_CONNECTION_STATE,
  RACE_STATUS,
  type DragSprintSnapshot,
  type LobbyState,
  type SessionFinishedPayload,
} from '@blitz/shared';

import { createDragSprintRuntime } from './dragSprint.js';

function createLobby(overrides: Partial<LobbyState['settings']> = {}): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'drag-sprint',
    status: LOBBY_STATUS.waiting,
    settings: {
      maxPlayers: 8,
      raceMode: LOBBY_RACE_MODES.finishLine,
      ...overrides,
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
      {
        id: 'socket-third',
        nickname: 'Piero',
        carId: 'tesla',
        ready: true,
        connectionState: PLAYER_CONNECTION_STATE.connected,
      },
    ],
  };
}

test('advances players on a fixed three-lane drag strip with deterministic finish-line rules', () => {
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    distanceTarget: 120,
    now: () => 2_000,
  });

  const started = runtime.start();
  const first = runtime.applyInput('socket-host', {
    tick: 1,
    steer: 1,
    accelerate: true,
    brake: false,
  });
  const guestTraffic = runtime.applyInput('socket-guest', {
    tick: 999,
    steer: 0,
    accelerate: true,
    brake: false,
  });
  const cooldownBlocked = runtime.applyInput('socket-host', {
    tick: 100,
    steer: 1,
    accelerate: true,
    brake: false,
  });
  const laneChangedAgain = runtime.applyInput('socket-host', {
    tick: 3,
    steer: 1,
    accelerate: true,
    brake: false,
  });
  const braked = runtime.applyInput('socket-host', {
    tick: 4,
    steer: 0,
    accelerate: false,
    brake: true,
  });

  assert.ok(first);
  assert.ok(cooldownBlocked);
  assert.ok(laneChangedAgain);
  assert.ok(braked);

  const startedSnapshot = started.state as DragSprintSnapshot;
  const firstSnapshot = first.state as DragSprintSnapshot;
  const guestTrafficSnapshot = guestTraffic?.state as DragSprintSnapshot;
  const cooldownSnapshot = cooldownBlocked.state as DragSprintSnapshot;
  const laneChangedSnapshot = laneChangedAgain.state as DragSprintSnapshot;
  const brakedSnapshot = braked.state as DragSprintSnapshot;

  assert.equal(startedSnapshot.trackId, 'drag-strip');
  assert.equal(startedSnapshot.mode, 'finish-line');
  assert.equal(startedSnapshot.distanceTarget, 120);
  assert.deepEqual(
    startedSnapshot.playersState.map((player) => player.lane),
    [0, 1, 2],
  );
  assert.equal(startedSnapshot.status, RACE_STATUS.racing);

  assert.equal(firstSnapshot.playersState[0]?.lane, 1);
  assert.ok(
    (firstSnapshot.playersState[0]?.speed ?? 0) > (startedSnapshot.playersState[0]?.speed ?? 0),
  );
  assert.equal(firstSnapshot.tick, 1);
  assert.equal(guestTrafficSnapshot.tick, 2);
  assert.equal(cooldownSnapshot.playersState[0]?.lane, 1);
  assert.equal(cooldownSnapshot.tick, 3);
  assert.equal(laneChangedSnapshot.playersState[0]?.lane, 2);
  assert.ok(
    (brakedSnapshot.playersState[0]?.speed ?? 0) < (laneChangedSnapshot.playersState[0]?.speed ?? 0),
  );
  assert.deepEqual(
    brakedSnapshot.obstacles.map((obstacle) => ({
      id: obstacle.id,
      lane: obstacle.lane,
      type: obstacle.type,
    })),
    [
      { id: 'drag-obstacle-1', lane: 0, type: 'cone' },
      { id: 'drag-obstacle-2', lane: 2, type: 'slow-car' },
    ],
  );
  assert.deepEqual(
    brakedSnapshot.pickups.map((pickup) => ({
      id: pickup.id,
      lane: pickup.lane,
      type: pickup.type,
    })),
    [
      { id: 'drag-pickup-1', lane: 1, type: 'nitro' },
      { id: 'drag-pickup-2', lane: 0, type: 'shield' },
    ],
  );
});

test('finishes a drag sprint session when a driver reaches the fixed distance target', () => {
  const finishedPayloads: SessionFinishedPayload[] = [];
  let nowMs = 5_000;
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    distanceTarget: 45,
    now: () => nowMs,
    onFinished(payload) {
      finishedPayloads.push(payload);
    },
  });

  runtime.start();

  let state = runtime.applyInput('socket-host', {
    tick: 1,
    steer: 0,
    accelerate: true,
    brake: false,
  });
  nowMs += 250;
  state = runtime.applyInput('socket-host', {
    tick: 2,
    steer: 0,
    accelerate: true,
    brake: false,
  });
  nowMs += 250;
  state = runtime.applyInput('socket-host', {
    tick: 3,
    steer: 0,
    accelerate: true,
    brake: false,
  });

  assert.ok(state);

  const snapshot = state.state as DragSprintSnapshot;

  assert.equal(state.status, 'finished');
  assert.equal(snapshot.status, RACE_STATUS.finished);
  assert.equal(snapshot.playersState[0]?.status, 'finished');
  assert.equal(snapshot.playersState[0]?.distance, 45);
  assert.equal(finishedPayloads.length, 1);
  assert.deepEqual(finishedPayloads[0]?.results.rankings[0], {
    playerId: 'socket-host',
    rank: 1,
    label: '0.5s',
    value: 500,
  });
});
