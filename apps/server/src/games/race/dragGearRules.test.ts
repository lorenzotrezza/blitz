import assert from 'node:assert/strict';
import test from 'node:test';

import { RACE_STATUS } from '@blitz/shared';

import {
  DEFAULT_DRAG_GEAR_TUNING,
  advanceDragGearPlayer,
  applyDragGearInput,
  buildDragGearRankings,
  buildDragShiftSummary,
  createInitialDragGearPlayer,
  scoreShift,
} from './dragGearRules.js';

test('scores shift windows as early good perfect and late', () => {
  const window = DEFAULT_DRAG_GEAR_TUNING.shiftWindow;

  assert.equal(scoreShift(6200, window), 'early');
  assert.equal(scoreShift(6900, window), 'good');
  assert.equal(scoreShift(7500, window), 'perfect');
  assert.equal(scoreShift(8500, window), 'late');
});

test('advances throttle held acceleration from server state', () => {
  const starting = createInitialDragGearPlayer({
    playerId: 'p1',
    nickname: 'Blitz',
  });
  const throttled = applyDragGearInput(
    { status: RACE_STATUS.racing, player: starting },
    { kind: 'drag-throttle', pressed: true, sequence: 1, clientTimeMs: 50 },
  );
  const advanced = advanceDragGearPlayer(throttled, 1000);

  assert.ok(advanced.speedKmh > starting.speedKmh);
  assert.ok(advanced.rpm > starting.rpm);
  assert.ok(advanced.distanceM > starting.distanceM);

  const released = applyDragGearInput(
    { status: RACE_STATUS.racing, player: advanced },
    { kind: 'drag-throttle', pressed: false, sequence: 2, clientTimeMs: 1050 },
  );
  const coasting = advanceDragGearPlayer(released, 1000);

  assert.ok(coasting.speedKmh < advanced.speedKmh);
  assert.ok(coasting.rpm < advanced.rpm);
});

test('ignores malformed repeated and invalid shift input', () => {
  const player = createInitialDragGearPlayer({
    playerId: 'p1',
    nickname: 'Blitz',
  });
  const throttled = applyDragGearInput(
    { status: RACE_STATUS.racing, player },
    { kind: 'drag-throttle', pressed: true, sequence: 1, clientTimeMs: 0 },
  );
  const malformed = applyDragGearInput(
    { status: RACE_STATUS.racing, player: throttled },
    { kind: 'drag-throttle', pressed: 'yes', sequence: 2, clientTimeMs: 20 },
  );

  assert.deepEqual(malformed, throttled);

  const firstShift = applyDragGearInput(
    { status: RACE_STATUS.racing, player: throttled },
    { kind: 'drag-shift', sequence: 2, clientTimeMs: 100 },
  );
  const repeatedShift = applyDragGearInput(
    { status: RACE_STATUS.racing, player: firstShift },
    { kind: 'drag-shift', sequence: 2, clientTimeMs: 120 },
  );

  assert.deepEqual(repeatedShift, firstShift);

  const notRacing = applyDragGearInput(
    { status: RACE_STATUS.finished, player: firstShift },
    { kind: 'drag-shift', sequence: 3, clientTimeMs: 140 },
  );

  assert.deepEqual(notRacing, firstShift);

  const maxGearPlayer = {
    ...firstShift,
    gear: DEFAULT_DRAG_GEAR_TUNING.maxGear,
    lastInputSequence: 10,
  };
  const overMaxShift = applyDragGearInput(
    { status: RACE_STATUS.racing, player: maxGearPlayer },
    { kind: 'drag-shift', sequence: 11, clientTimeMs: 160 },
  );

  assert.deepEqual(overMaxShift, maxGearPlayer);
});

test('perfect and good shifts beat mediocre timing', () => {
  const strong = driveRun([7500, 7400, 7300]);
  const mediocre = driveRun([6200, 8500, 6100]);

  assert.ok(strong.finishTimeMs !== null);
  assert.ok(mediocre.finishTimeMs !== null);
  assert.ok(strong.finishTimeMs < mediocre.finishTimeMs);

  const rankings = buildDragGearRankings([mediocre, strong]);

  assert.equal(rankings[0]?.playerId, strong.playerId);
  assert.equal(rankings[1]?.playerId, mediocre.playerId);
});

test('competent run finishes between 12000 and 18000 ms', () => {
  const competent = driveCompetentRun();

  assert.ok(competent.finishTimeMs !== null);
  assert.ok(competent.finishTimeMs >= 12000);
  assert.ok(competent.finishTimeMs <= 18000);
});

test('builds shift summary counts', () => {
  const player = {
    ...createInitialDragGearPlayer({
      playerId: 'p1',
      nickname: 'Blitz',
    }),
    shiftSummary: {
      early: 1,
      good: 2,
      perfect: 3,
      late: 4,
      total: 10,
    },
  };

  assert.deepEqual(buildDragShiftSummary(player), {
    early: 1,
    good: 2,
    perfect: 3,
    late: 4,
    total: 10,
  });
});

function driveCompetentRun() {
  return driveRun([7500, 7400, 7600]);
}

function driveRun(shiftTargets: number[]) {
  let elapsedMs = 0;
  let nextSequence = 1;
  let player = createInitialDragGearPlayer({
    playerId: `driver-${shiftTargets.join('-')}`,
    nickname: 'Driver',
  });
  player = applyDragGearInput(
    { status: RACE_STATUS.racing, player },
    {
      kind: 'drag-throttle',
      pressed: true,
      sequence: nextSequence,
      clientTimeMs: elapsedMs,
    },
  );
  nextSequence += 1;

  for (const targetRpm of shiftTargets) {
    while (!player.finished && player.rpm < targetRpm) {
      player = tick(player, elapsedMs);
      elapsedMs += 100;
    }

    if (!player.finished) {
      player = applyDragGearInput(
        { status: RACE_STATUS.racing, player },
        {
          kind: 'drag-shift',
          sequence: nextSequence,
          clientTimeMs: elapsedMs,
        },
      );
      nextSequence += 1;
    }
  }

  while (!player.finished && elapsedMs < 30_000) {
    player = tick(player, elapsedMs);
    elapsedMs += 100;
  }

  return player;
}

function tick(player: ReturnType<typeof createInitialDragGearPlayer>, elapsedMs: number) {
  return advanceDragGearPlayer(player, 100, DEFAULT_DRAG_GEAR_TUNING, elapsedMs);
}
