import assert from 'node:assert/strict';
import test from 'node:test';

import type { StraightObstacleObstacle } from '@blitz/shared';

import {
  advanceStraightObstacleRace,
  buildStraightObstacleResults,
  clampSteerX,
  createInitialStraightObstacleState,
  generateStraightObstacleWaves,
} from './straightObstacleRules.js';

const distanceTarget = 900;
const warningDistance = 150;
const slowdownDurationMs = 1250;
const playerWidth = 0.18;
const obstacleWidth = 0.24;
const playerDepth = 4;
const obstacleDepth = 6;
const baseSpeed = 34;

function createBlockingObstacle(overrides: Partial<StraightObstacleObstacle> = {}) {
  return {
    id: 'wave-1-obstacle-1',
    waveId: 'wave-1',
    centerX: 0,
    width: obstacleWidth,
    distance: 12,
    depth: obstacleDepth,
    warningDistance,
    hitPlayerIds: [],
    ...overrides,
  };
}

test('clamps steering intent and rejects non finite values', () => {
  assert.equal(clampSteerX(-2), -1);
  assert.equal(clampSteerX(2), 1);
  assert.equal(clampSteerX(Number.NaN), 0);
  assert.equal(clampSteerX(Infinity), 0);
});

test('generates seeded readable obstacle waves', () => {
  const firstRun: StraightObstacleObstacle[] =
    generateStraightObstacleWaves('seed-a', distanceTarget);
  const secondRun: StraightObstacleObstacle[] =
    generateStraightObstacleWaves('seed-a', distanceTarget);

  assert.deepEqual(
    firstRun.map((obstacle) => ({
      id: obstacle.id,
      centerX: obstacle.centerX,
    })),
    secondRun.map((obstacle) => ({
      id: obstacle.id,
      centerX: obstacle.centerX,
    })),
  );
  assert.ok(firstRun.length > 0);
  assert.ok(firstRun.every((obstacle) => obstacle.warningDistance >= 140));

  const firstTwoWaveIds = [...new Set(firstRun.map((obstacle) => obstacle.waveId))].slice(0, 2);
  const firstTwoWaves = firstRun.filter((obstacle) =>
    firstTwoWaveIds.includes(obstacle.waveId),
  );

  for (const waveId of firstTwoWaveIds) {
    const waveObstacles = firstTwoWaves.filter((obstacle) => obstacle.waveId === waveId);
    const blockedWidth = waveObstacles.reduce(
      (total, obstacle) => total + obstacle.width + playerWidth,
      0,
    );

    assert.ok(blockedWidth < 1.64);
  }
});

test('advances continuous horizontal steering within road bounds', () => {
  const state = createInitialStraightObstacleState({
    players: [{ playerId: 'player-1', nickname: 'Dash' }],
    obstacles: [],
    distanceTarget,
    baseSpeed,
  });

  const advanced = advanceStraightObstacleRace(
    state,
    new Map([['player-1', { steerX: 1 }]]),
    { nowMs: 500, deltaMs: 500 },
  );
  const player = advanced.players[0]!;

  assert.ok(player.x > 0);
  assert.ok(player.x <= 0.82);
});

test('applies obstacle hit slowdown and recovery timer', () => {
  const nowMs = 2_000;
  const state = createInitialStraightObstacleState({
    players: [{ playerId: 'player-1', nickname: 'Dash' }],
    obstacles: [createBlockingObstacle()],
    distanceTarget,
    baseSpeed,
  });

  const advanced = advanceStraightObstacleRace(
    {
      ...state,
      players: [
        {
          ...state.players[0]!,
          x: 0,
          distance: 12,
          speed: baseSpeed,
        },
      ],
    },
    new Map([['player-1', { steerX: 0 }]]),
    { nowMs, deltaMs: 0 },
  );
  const player = advanced.players[0]!;
  const obstacle = advanced.obstacles[0]!;

  assert.equal(player.obstacleHits, 1);
  assert.ok(player.speed < baseSpeed);
  assert.equal(player.slowdownUntilMs, nowMs + slowdownDurationMs);
  assert.deepEqual(obstacle.hitPlayerIds, ['player-1']);
  assert.equal(advanced.warning, 'Hit - recovering');
});

test('recovers speed after slowdown window', () => {
  const state = createInitialStraightObstacleState({
    players: [{ playerId: 'player-1', nickname: 'Dash' }],
    obstacles: [createBlockingObstacle({ distance: 400 })],
    distanceTarget,
    baseSpeed,
  });

  const advanced = advanceStraightObstacleRace(
    {
      ...state,
      warning: 'Slowdown',
      players: [
        {
          ...state.players[0]!,
          speed: 18,
          slowdownUntilMs: 3_000,
        },
      ],
    },
    new Map([['player-1', { steerX: 0 }]]),
    { nowMs: 3_500, deltaMs: 500 },
  );
  const player = advanced.players[0]!;

  assert.ok(player.speed > 18);
  assert.ok(player.speed <= baseSpeed);
  assert.equal(advanced.warning, 'Road clear');
});

test('builds finish rankings with obstacle hit details', () => {
  const state = createInitialStraightObstacleState({
    players: [
      { playerId: 'player-slow', nickname: 'Slow' },
      { playerId: 'player-fast', nickname: 'Fast' },
    ],
    obstacles: [],
    distanceTarget,
    baseSpeed,
  });

  const results = buildStraightObstacleResults({
    ...state,
    players: [
      {
        ...state.players[0]!,
        distance: distanceTarget,
        finishedAtMs: 12_300,
        obstacleHits: 2,
        status: 'finished',
      },
      {
        ...state.players[1]!,
        distance: distanceTarget,
        finishedAtMs: 9_800,
        obstacleHits: 0,
        status: 'finished',
      },
    ],
  });

  assert.equal(results.rankings[0]?.playerId, 'player-fast');
  assert.equal(results.rankings[1]?.playerId, 'player-slow');
  assert.equal(results.rankings[1]?.label, '12.3s · 2 hits');
  assert.equal(results.rankings[1]?.details?.obstacleHits, 2);
});
