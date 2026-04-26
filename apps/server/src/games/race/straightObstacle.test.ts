import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_RACE_MODES,
  LOBBY_STATUS,
  PLAYER_CONNECTION_STATE,
  RACE_STATUS,
  type GameSessionEnvelope,
  type LobbyState,
  type SessionFinishedPayload,
  type StraightObstacleSnapshot,
} from '@blitz/shared';

import { createStraightObstacleRuntime } from './straightObstacle.js';

function createLobby(): LobbyState {
  return {
    code: 'ABCD12',
    hostId: 'socket-host',
    mode: 'multiplayer',
    selectedGame: 'race',
    selectedVariant: 'straight-obstacle',
    status: LOBBY_STATUS.waiting,
    settings: {
      maxPlayers: 8,
      raceMode: LOBBY_RACE_MODES.finishLine,
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

function createRuntimeHarness(
  options: {
    distanceTarget?: number;
    obstacles?: StraightObstacleSnapshot['activeObstacles'];
  } = {},
) {
  let nowMs = 1_000;
  const tickCallbacks: Array<() => void> = [];
  const clearedTimers: unknown[] = [];
  const states: Array<GameSessionEnvelope<StraightObstacleSnapshot>> = [];
  const finishedPayloads: SessionFinishedPayload[] = [];
  const runtime = createStraightObstacleRuntime(createLobby(), 'session-dodge', {
    countdownMs: 0,
    tickMs: 50,
    distanceTarget: options.distanceTarget,
    obstacles: options.obstacles,
    timers: {
      now: () => nowMs,
      setInterval(callback: () => void, delayMs: number) {
        assert.equal(delayMs, 50);
        tickCallbacks.push(callback);

        return { timer: tickCallbacks.length } as unknown as ReturnType<
          typeof setInterval
        >;
      },
      clearInterval(timer: unknown) {
        clearedTimers.push(timer);
      },
    },
    onState(payload: GameSessionEnvelope<StraightObstacleSnapshot>) {
      states.push(payload);
    },
    onFinished(payload: SessionFinishedPayload) {
      finishedPayloads.push(payload);
    },
  });

  return {
    runtime,
    tickCallbacks,
    clearedTimers,
    states,
    finishedPayloads,
    advanceTime(ms: number) {
      nowMs += ms;
    },
    tick() {
      assert.ok(tickCallbacks[0]);
      tickCallbacks[0]();

      return states.at(-1)!;
    },
  };
}

test('starts straight obstacle runtime with authoritative snapshot', () => {
  const { runtime, tickCallbacks } = createRuntimeHarness();

  const started = runtime.start();
  const snapshot = started.state;

  assert.equal(started.game, 'race');
  assert.equal(started.variant, 'straight-obstacle');
  assert.equal(started.status, 'active');
  assert.equal(started.results, null);
  assert.equal(snapshot.trackId, 'straight-obstacle');
  assert.equal(snapshot.mode, 'straight-obstacle');
  assert.equal(snapshot.status, RACE_STATUS.racing);
  assert.equal(snapshot.countdown, 0);
  assert.equal(snapshot.playersState.length, 2);
  assert.equal(typeof snapshot.playersState[0]?.x, 'number');
  assert.equal(tickCallbacks.length, 1);
});

test('stores latest clamped steering intent and ignores stale malformed input', () => {
  const { runtime, advanceTime, tick } = createRuntimeHarness();

  runtime.start();
  assert.ok(
    runtime.applyInput('socket-host', {
      mode: 'straight-obstacle',
      kind: 'steer',
      steerX: 99,
      sequence: 1,
      clientTimeMs: 1,
    }),
  );
  runtime.applyInput('socket-host', {
    mode: 'straight-obstacle',
    kind: 'steer',
    steerX: -1,
    sequence: 1,
    clientTimeMs: 2,
  });
  runtime.applyInput('socket-host', {
    mode: 'drag-sprint',
    kind: 'steer',
    steerX: -1,
    sequence: 2,
    clientTimeMs: 3,
  });
  runtime.applyInput('socket-host', {
    mode: 'straight-obstacle',
    kind: 'shift',
    steerX: -1,
    sequence: 3,
    clientTimeMs: 4,
  });
  runtime.applyInput('socket-host', {
    mode: 'straight-obstacle',
    kind: 'steer',
    steerX: Number.NaN,
    sequence: 4,
    clientTimeMs: 5,
  });
  runtime.applyInput('socket-host', {
    mode: 'straight-obstacle',
    kind: 'steer',
    steerX: -1,
    sequence: Number.NaN,
    clientTimeMs: 6,
  });
  runtime.applyInput('socket-host', {
    mode: 'straight-obstacle',
    kind: 'steer',
    steerX: 99,
    sequence: 5,
    clientTimeMs: 7,
    speed: 9_999,
    distance: 9_999,
    obstacleHits: 99,
    slowdownUntilMs: 1,
    finishedAtMs: 1,
    rank: 1,
  });

  advanceTime(500);
  const ticked = tick();
  const player = ticked.state.playersState.find(
    (entry) => entry.playerId === 'socket-host',
  );

  assert.ok(player);
  assert.ok(player.x > 0);
  assert.ok(player.x <= 0.82);
  assert.notEqual(player.speed, 9_999);
  assert.notEqual(player.distance, 9_999);
  assert.notEqual(player.obstacleHits, 99);
  assert.notEqual(player.slowdownUntilMs, 1);
  assert.notEqual(player.finishedAtMs, 1);
  assert.equal('rank' in player, false);
});

test('advances neutral steering through server tick', () => {
  const { runtime, advanceTime, tick } = createRuntimeHarness();

  const started = runtime.start();
  const startedPlayer = started.state.playersState[0]!;

  runtime.applyInput('socket-host', {
    mode: 'straight-obstacle',
    kind: 'steer',
    steerX: 0,
    sequence: 1,
    clientTimeMs: 1,
  });

  advanceTime(3_000);
  const ticked = tick();
  const player = ticked.state.playersState[0]!;

  assert.equal(player.x, startedPlayer.x);
  assert.ok(player.distance > startedPlayer.distance);
  assert.ok(
    ['Road clear', 'Obstacle ahead', 'Slowdown', 'Hit - recovering'].includes(
      ticked.state.warning,
    ),
  );
});

test('finishes with obstacle hit result details', () => {
  const { runtime, advanceTime, tick, finishedPayloads } = createRuntimeHarness({
    distanceTarget: 20,
    obstacles: [
      {
        id: 'blocking-obstacle',
        waveId: 'wave-1',
        centerX: 0,
        width: 0.24,
        distance: 12,
        depth: 6,
        warningDistance: 150,
        hitPlayerIds: [],
      },
    ],
  });

  runtime.start();
  advanceTime(800);
  const finished = tick();
  const payload = finishedPayloads[0];

  assert.equal(finished.status, 'finished');
  assert.equal(finished.state.status, RACE_STATUS.finished);
  assert.equal(finishedPayloads.length, 1);
  assert.ok(payload);
  assert.equal(payload.game, 'race');
  assert.equal(payload.variant, 'straight-obstacle');
  assert.match(payload.results.rankings[0]?.label ?? '', /hits$/);
  const details = payload.results.rankings[0]?.details;

  assert.ok(details);
  assert.equal(typeof details.obstacleHits, 'number');
});
