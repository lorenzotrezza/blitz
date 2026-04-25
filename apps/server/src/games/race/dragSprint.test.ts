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

test('eliminates inactive and crashed drivers in survival mode until the last active racer wins', () => {
  const finishedPayloads: SessionFinishedPayload[] = [];
  let nowMs = 20_000;
  const runtime = createDragSprintRuntime(
    createLobby({
      raceMode: LOBBY_RACE_MODES.survival,
    }),
    'session-drag-survival',
    {
      countdownMs: 0,
      distanceTarget: 120,
      now: () => nowMs,
      onFinished(payload) {
        finishedPayloads.push(payload);
      },
    },
  );

  function apply(
    playerId: string,
    tick: number,
    steer: -1 | 0 | 1 = 0,
    accelerate = true,
    brake = false,
  ) {
    const nextState = runtime.applyInput(playerId, {
      tick,
      steer,
      accelerate,
      brake,
    });

    assert.ok(nextState);
    return nextState;
  }

  const started = runtime.start();
  const startedSnapshot = started.state as DragSprintSnapshot;

  assert.equal(startedSnapshot.mode, LOBBY_RACE_MODES.survival);
  assert.equal(startedSnapshot.status, RACE_STATUS.racing);

  nowMs = 20_050;
  apply('socket-host', 1, 0);
  nowMs = 20_100;
  apply('socket-guest', 1, -1);
  nowMs = 20_150;
  const timeoutState = apply('socket-host', 2, 0);

  const timeoutSnapshot = timeoutState.state as DragSprintSnapshot;

  assert.equal(timeoutSnapshot.playersState[2]?.status, 'eliminated');
  assert.equal(timeoutSnapshot.playersState[2]?.distance, 0);

  nowMs = 20_200;
  apply('socket-guest', 2, 0);
  nowMs = 20_250;
  apply('socket-host', 3, 1);
  nowMs = 20_300;
  const finished = apply('socket-guest', 3, 0);

  const finishedSnapshot = finished.state as DragSprintSnapshot;

  assert.equal(finished.status, 'finished');
  assert.equal(finishedSnapshot.status, RACE_STATUS.finished);
  assert.equal(finishedSnapshot.playersState[0]?.status, 'finished');
  assert.equal(finishedSnapshot.playersState[1]?.status, 'eliminated');
  assert.equal(finishedSnapshot.playersState[1]?.distance, 36);
  assert.equal(finishedPayloads.length, 1);
  assert.deepEqual(finishedPayloads[0]?.results.rankings, [
    {
      playerId: 'socket-host',
      rank: 1,
      label: '0.3s',
      value: 300,
    },
    {
      playerId: 'socket-guest',
      rank: 2,
      label: '0.3s',
      value: 300,
    },
    {
      playerId: 'socket-third',
      rank: 3,
      label: '0.1s',
      value: 150,
    },
  ]);
  assert.deepEqual(finishedPayloads[0]?.results.summary, {
    mode: LOBBY_RACE_MODES.survival,
    track: 'drag-strip',
    distanceTarget: 120,
    winnerId: 'socket-host',
  });
});

test('resets the strip across three best-of-3 manches and ranks ties by cumulative time', () => {
  const finishedPayloads: SessionFinishedPayload[] = [];
  let nowMs = 1_000;
  const runtime = createDragSprintRuntime(
    createLobby({
      raceMode: LOBBY_RACE_MODES.bestOf3,
    }),
    'session-drag-best-of-3',
    {
      countdownMs: 0,
      distanceTarget: 30,
      now: () => nowMs,
      onFinished(payload) {
        finishedPayloads.push(payload);
      },
    },
  );

  function accelerate(playerId: string, tick: number, steer: -1 | 0 | 1 = 0) {
    const nextState = runtime.applyInput(playerId, {
      tick,
      steer,
      accelerate: true,
      brake: false,
    });

    assert.ok(nextState);
    return nextState;
  }

  const started = runtime.start();
  const startedSnapshot = started.state as DragSprintSnapshot;

  assert.equal(startedSnapshot.mode, LOBBY_RACE_MODES.bestOf3);
  assert.equal(startedSnapshot.round, 1);
  assert.equal(startedSnapshot.totalRounds, 3);

  accelerate('socket-host', 1, 1);
  accelerate('socket-guest', 1, 0);
  let state = accelerate('socket-third', 1, -1);

  nowMs = 1_090;
  accelerate('socket-host', 2, 1);
  nowMs = 1_200;
  accelerate('socket-guest', 2, 0);
  nowMs = 1_300;
  state = accelerate('socket-third', 2, -1);

  let roundTwoSnapshot = state.state as DragSprintSnapshot;
  assert.equal(state.status, 'active');
  assert.equal(roundTwoSnapshot.status, RACE_STATUS.racing);
  assert.equal(roundTwoSnapshot.round, 2);
  assert.deepEqual(
    roundTwoSnapshot.playersState.map((player) => ({
      lane: player.lane,
      distance: player.distance,
      speed: player.speed,
      status: player.status,
    })),
    [
      { lane: 0, distance: 0, speed: 0, status: 'racing' },
      { lane: 1, distance: 0, speed: 0, status: 'racing' },
      { lane: 2, distance: 0, speed: 0, status: 'racing' },
    ],
  );
  assert.deepEqual(
    roundTwoSnapshot.standings!.map((entry) => ({
      playerId: entry.playerId,
      points: entry.points,
      roundWins: entry.roundWins,
      cumulativeTimeMs: entry.cumulativeTimeMs,
    })),
    [
      {
        playerId: 'socket-host',
        points: 3,
        roundWins: 1,
        cumulativeTimeMs: 90,
      },
      {
        playerId: 'socket-guest',
        points: 2,
        roundWins: 0,
        cumulativeTimeMs: 200,
      },
      {
        playerId: 'socket-third',
        points: 1,
        roundWins: 0,
        cumulativeTimeMs: 300,
      },
    ],
  );

  accelerate('socket-host', 3, 0);
  accelerate('socket-guest', 3, 0);
  state = accelerate('socket-third', 3, 0);

  nowMs = 1_420;
  accelerate('socket-host', 4, 0);
  nowMs = 1_560;
  accelerate('socket-guest', 4, 0);
  nowMs = 1_660;
  state = accelerate('socket-third', 4, 0);

  const roundThreeSnapshot = state.state as DragSprintSnapshot;
  assert.equal(roundThreeSnapshot.round, 3);
  assert.deepEqual(
    roundThreeSnapshot.standings!.map((entry) => ({
      playerId: entry.playerId,
      points: entry.points,
      roundWins: entry.roundWins,
    })),
    [
      { playerId: 'socket-host', points: 6, roundWins: 2 },
      { playerId: 'socket-guest', points: 4, roundWins: 0 },
      { playerId: 'socket-third', points: 2, roundWins: 0 },
    ],
  );

  accelerate('socket-host', 5, 0);
  accelerate('socket-guest', 5, 0);
  state = accelerate('socket-third', 5, 0);

  nowMs = 1_760;
  accelerate('socket-guest', 6, 0);
  nowMs = 1_900;
  accelerate('socket-third', 6, 0);
  nowMs = 2_060;
  state = accelerate('socket-host', 6, 0);

  const finishedSnapshot = state.state as DragSprintSnapshot;

  assert.equal(state.status, 'finished');
  assert.equal(finishedSnapshot.status, RACE_STATUS.finished);
  assert.equal(finishedSnapshot.round, 3);
  assert.equal(finishedPayloads.length, 1);
  assert.deepEqual(
    finishedSnapshot.standings!.map((entry) => ({
      playerId: entry.playerId,
      points: entry.points,
      roundWins: entry.roundWins,
      cumulativeTimeMs: entry.cumulativeTimeMs,
    })),
    [
      {
        playerId: 'socket-guest',
        points: 7,
        roundWins: 1,
        cumulativeTimeMs: 560,
      },
      {
        playerId: 'socket-host',
        points: 7,
        roundWins: 2,
        cumulativeTimeMs: 610,
      },
      {
        playerId: 'socket-third',
        points: 4,
        roundWins: 0,
        cumulativeTimeMs: 900,
      },
    ],
  );
  assert.deepEqual(finishedPayloads[0]?.results.rankings, [
    {
      playerId: 'socket-guest',
      rank: 1,
      label: '7 pts · 560 ms',
      value: 7,
    },
    {
      playerId: 'socket-host',
      rank: 2,
      label: '7 pts · 610 ms',
      value: 7,
    },
    {
      playerId: 'socket-third',
      rank: 3,
      label: '4 pts · 900 ms',
      value: 4,
    },
  ]);
  assert.deepEqual(finishedPayloads[0]?.results.summary, {
    mode: LOBBY_RACE_MODES.bestOf3,
    track: 'drag-strip',
    distanceTarget: 30,
    rounds: 3,
  });
});

test('advances the best-of-3 manche when the last unfinished racer disconnects', () => {
  let nowMs = 10_000;
  const stateUpdates: DragSprintSnapshot[] = [];
  const runtime = createDragSprintRuntime(
    createLobby({
      raceMode: LOBBY_RACE_MODES.bestOf3,
    }),
    'session-drag-disconnect',
    {
      countdownMs: 0,
      distanceTarget: 30,
      now: () => nowMs,
      onState(payload) {
        stateUpdates.push(payload.state as DragSprintSnapshot);
      },
    },
  );

  function accelerate(playerId: string, tick: number) {
    const nextState = runtime.applyInput(playerId, {
      tick,
      steer: 0,
      accelerate: true,
      brake: false,
    });

    assert.ok(nextState);
    return nextState;
  }

  runtime.start();

  accelerate('socket-host', 1);
  accelerate('socket-guest', 1);
  accelerate('socket-third', 1);

  nowMs = 10_100;
  accelerate('socket-host', 2);
  nowMs = 10_240;
  const guestFinished = accelerate('socket-guest', 2);

  assert.equal((guestFinished.state as DragSprintSnapshot).round, 1);

  runtime.removePlayer('socket-third');

  const snapshot = stateUpdates.at(-1)!;

  assert.equal(snapshot.round, 2);
  assert.equal(snapshot.totalRounds, 3);
  assert.equal(snapshot.status, RACE_STATUS.racing);
  assert.deepEqual(
    snapshot.playersState.map((player) => ({
      playerId: player.playerId,
      lane: player.lane,
      distance: player.distance,
      speed: player.speed,
      status: player.status,
    })),
    [
      {
        playerId: 'socket-host',
        lane: 0,
        distance: 0,
        speed: 0,
        status: 'racing',
      },
      {
        playerId: 'socket-guest',
        lane: 1,
        distance: 0,
        speed: 0,
        status: 'racing',
      },
    ],
  );
  assert.deepEqual(
    snapshot.standings!.map((entry) => ({
      playerId: entry.playerId,
      points: entry.points,
      roundWins: entry.roundWins,
      cumulativeTimeMs: entry.cumulativeTimeMs,
    })),
    [
      {
        playerId: 'socket-host',
        points: 2,
        roundWins: 1,
        cumulativeTimeMs: 100,
      },
      {
        playerId: 'socket-guest',
        points: 1,
        roundWins: 0,
        cumulativeTimeMs: 240,
      },
    ],
  );
});
