import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_RACE_MODES,
  LOBBY_STATUS,
  PLAYER_CONNECTION_STATE,
  RACE_STATUS,
  type LobbyState,
  type SessionFinishedPayload,
} from '@blitz/shared';

import { createGameRuntimeRegistry } from '../registry.js';
import { createDragSprintRuntime } from './dragSprint.js';
import type {
  DragGearPlayerRuleState,
  DragShiftWindow,
} from './dragGearRules.js';

interface DragGearRuntimeSnapshot {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  status: string;
  tick: number;
  startedAt: number | null;
  countdown: number | null;
  distanceTargetM: number;
  shiftWindow: DragShiftWindow;
  playersState: DragGearPlayerRuleState[];
}

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

test('starts a straight drag gear race from the existing registry variant', () => {
  const registryEntry = createGameRuntimeRegistry().resolve('race', 'drag-sprint');

  assert.equal(registryEntry?.key, 'race:drag-sprint');
  assert.ok(registryEntry.createRuntime);

  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    now: () => 1_000,
  });
  const started = runtime.start();
  const snapshot = started.state as unknown as DragGearRuntimeSnapshot;

  assert.equal(started.variant, 'drag-sprint');
  assert.equal(started.status, 'active');
  assert.equal(snapshot.status, RACE_STATUS.racing);
  assert.equal(snapshot.trackId, 'straight-drag-gear');
  assert.equal(snapshot.distanceTargetM, 402);
  assert.deepEqual(
    snapshot.playersState.map((player) => ({
      gear: player.gear,
      maxGear: player.maxGear,
    })),
    [
      { gear: 1, maxGear: 4 },
      { gear: 1, maxGear: 4 },
      { gear: 1, maxGear: 4 },
    ],
  );
});

test('advances throttle and shift input through authoritative server state', () => {
  let nowMs = 5_000;
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    now: () => nowMs,
  });

  const started = runtime.start();
  const startingPlayer = (started.state as unknown as DragGearRuntimeSnapshot).playersState[0]!;
  const throttled = runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 1,
    clientTimeMs: 1,
  });

  assert.ok(throttled);
  nowMs += 900;

  const shifted = runtime.applyInput('socket-host', {
    kind: 'drag-shift',
    sequence: 2,
    clientTimeMs: 2,
  });

  assert.ok(shifted);

  const throttledPlayer =
    (throttled.state as unknown as DragGearRuntimeSnapshot).playersState[0]!;
  const shiftedPlayer =
    (shifted.state as unknown as DragGearRuntimeSnapshot).playersState[0]!;

  assert.equal(throttledPlayer.throttlePressed, true);
  assert.ok(shiftedPlayer.speedKmh > startingPlayer.speedKmh);
  assert.ok(shiftedPlayer.rpm > startingPlayer.rpm);
  assert.ok(shiftedPlayer.distanceM > startingPlayer.distanceM);
  assert.equal(shiftedPlayer.gear, 2);
  assert.equal(shiftedPlayer.shiftSummary.total, 1);
});

test('held throttle progresses without repeated client packets', () => {
  let nowMs = 10_000;
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    now: () => nowMs,
  });

  runtime.start();
  const pressed = runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 1,
    clientTimeMs: 1,
  });

  assert.ok(pressed);

  const pressedPlayer =
    (pressed.state as unknown as DragGearRuntimeSnapshot).playersState[0]!;
  nowMs += 1_200;

  const later = runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 2,
    clientTimeMs: 2,
  });

  assert.ok(later);

  const laterPlayer =
    (later.state as unknown as DragGearRuntimeSnapshot).playersState[0]!;

  assert.ok(laterPlayer.rpm > pressedPlayer.rpm);
  assert.ok(laterPlayer.speedKmh > pressedPlayer.speedKmh);
  assert.ok(laterPlayer.distanceM > pressedPlayer.distanceM);
});

test('broadcasts held throttle progress from the server race tick', () => {
  let nowMs = 12_000;
  const scheduledCallbacks: Array<() => void> = [];
  const snapshots: DragGearRuntimeSnapshot[] = [];
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    now: () => nowMs,
    schedule(callback) {
      scheduledCallbacks.push(callback);
      return {} as ReturnType<typeof setTimeout>;
    },
    cancel() {},
    onState(envelope) {
      snapshots.push(envelope.state as unknown as DragGearRuntimeSnapshot);
    },
  });

  runtime.start();

  assert.equal(scheduledCallbacks.length, 0);

  runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 1,
    clientTimeMs: 1,
  });

  assert.equal(scheduledCallbacks.length, 1);

  const pressedPlayer = snapshots.at(-1)?.playersState[0];
  nowMs += 500;
  scheduledCallbacks.shift()?.();

  const tickedPlayer = snapshots.at(-1)?.playersState[0];

  assert.ok(pressedPlayer);
  assert.ok(tickedPlayer);
  assert.ok(tickedPlayer.rpm > pressedPlayer.rpm);
  assert.ok(tickedPlayer.speedKmh > pressedPlayer.speedKmh);
  assert.ok(tickedPlayer.distanceM > pressedPlayer.distanceM);
});

test('shift after elapsed hold time scores from updated RPM', () => {
  let nowMs = 20_000;
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    now: () => nowMs,
  });

  const started = runtime.start();
  const startingPlayer = (started.state as unknown as DragGearRuntimeSnapshot).playersState[0]!;

  runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 1,
    clientTimeMs: 1,
  });

  nowMs += 1_900;

  const shifted = runtime.applyInput('socket-host', {
    kind: 'drag-shift',
    sequence: 2,
    clientTimeMs: 2,
  });

  assert.ok(shifted);

  const shiftedPlayer =
    (shifted.state as unknown as DragGearRuntimeSnapshot).playersState[0]!;

  assert.equal(shiftedPlayer.gear, 2);
  assert.equal(shiftedPlayer.lastShiftQuality, 'perfect');
  assert.equal(shiftedPlayer.shiftSummary.perfect, 1);
  assert.equal(shiftedPlayer.shiftSummary.total, 1);
  assert.notEqual(shiftedPlayer.lastShiftQuality, 'early');
  assert.ok(shiftedPlayer.rpm > startingPlayer.rpm);
});

test('ignores old steering repeated shift and non-racing input', () => {
  let nowMs = 30_000;
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    distanceTarget: 18,
    now: () => nowMs,
  });

  runtime.start();

  const steered = runtime.applyInput('socket-host', {
    steer: 1,
    accelerate: true,
    brake: false,
  });

  assert.ok(steered);

  const steeredPlayer =
    (steered.state as unknown as DragGearRuntimeSnapshot).playersState[0]!;

  assert.equal(steeredPlayer.gear, 1);
  assert.equal(steeredPlayer.shiftSummary.total, 0);
  assert.equal('lane' in steeredPlayer, false);
  assert.equal('obstacles' in steered.state, false);

  const throttled = runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 1,
    clientTimeMs: 1,
  });

  assert.ok(throttled);
  nowMs += 900;

  const shifted = runtime.applyInput('socket-host', {
    kind: 'drag-shift',
    sequence: 2,
    clientTimeMs: 2,
  });
  const repeatedShift = runtime.applyInput('socket-host', {
    kind: 'drag-shift',
    sequence: 2,
    clientTimeMs: 3,
  });

  assert.ok(shifted);
  assert.ok(repeatedShift);
  const repeatedShiftPlayer =
    (repeatedShift.state as unknown as DragGearRuntimeSnapshot).playersState[0];
  const shiftedPlayer =
    (shifted.state as unknown as DragGearRuntimeSnapshot).playersState[0];

  assert.equal(repeatedShiftPlayer?.gear, shiftedPlayer?.gear);
  assert.equal(
    repeatedShiftPlayer?.shiftSummary.total,
    shiftedPlayer?.shiftSummary.total,
  );

  nowMs += 10_000;
  const finished = runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 3,
    clientTimeMs: 4,
  });

  assert.ok(finished);
  assert.equal(finished.status, 'finished');

  const afterFinish = runtime.applyInput('socket-host', {
    kind: 'drag-shift',
    sequence: 4,
    clientTimeMs: 5,
  });

  assert.ok(afterFinish);
  const afterFinishPlayer =
    (afterFinish.state as unknown as DragGearRuntimeSnapshot).playersState[0];
  const finishedPlayer =
    (finished.state as unknown as DragGearRuntimeSnapshot).playersState[0];

  assert.equal(afterFinishPlayer?.gear, finishedPlayer?.gear);
});

test('finishes with rankings and drag shift summary', () => {
  const finishedPayloads: SessionFinishedPayload[] = [];
  let nowMs = 40_000;
  const runtime = createDragSprintRuntime(createLobby(), 'session-drag', {
    countdownMs: 0,
    distanceTarget: 20,
    now: () => nowMs,
    onFinished(payload) {
      finishedPayloads.push(payload);
    },
  });

  runtime.start();

  runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 1,
    clientTimeMs: 1,
  });
  nowMs += 1_900;
  runtime.applyInput('socket-host', {
    kind: 'drag-shift',
    sequence: 2,
    clientTimeMs: 2,
  });
  nowMs += 5_000;

  const finished = runtime.applyInput('socket-host', {
    kind: 'drag-throttle',
    pressed: true,
    sequence: 3,
    clientTimeMs: 3,
  });

  assert.ok(finished);

  const snapshot = finished.state as unknown as DragGearRuntimeSnapshot;
  const payload = finishedPayloads[0];

  assert.equal(finished.status, 'finished');
  assert.equal(snapshot.status, RACE_STATUS.finished);
  assert.equal(finishedPayloads.length, 1);
  assert.ok(payload);
  assert.equal(payload.results.rankings[0]?.playerId, 'socket-host');
  assert.match(payload.results.rankings[0]?.label ?? '', /s$/);
  assert.deepEqual(Object.keys(payload.results.summary ?? {}).sort(), [
    'distanceTargetM',
    'earlyShifts',
    'finishTimeMs',
    'goodShifts',
    'lateShifts',
    'mode',
    'perfectShifts',
    'totalShifts',
    'track',
  ]);
  assert.equal(payload.results.summary?.mode, 'drag-gear');
  assert.equal(payload.results.summary?.track, 'straight-drag-gear');
  assert.equal(typeof payload.results.summary?.finishTimeMs, 'number');
  assert.equal(typeof payload.results.summary?.perfectShifts, 'number');
  assert.equal(typeof payload.results.summary?.goodShifts, 'number');
  assert.equal(typeof payload.results.summary?.earlyShifts, 'number');
  assert.equal(typeof payload.results.summary?.lateShifts, 'number');
  assert.equal(typeof payload.results.summary?.totalShifts, 'number');
});
