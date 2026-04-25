import {
  RACE_STATUS,
  type GameResultEntry,
  type RaceStatus,
} from '@blitz/shared';

export type DragShiftQuality = 'early' | 'good' | 'perfect' | 'late';

export interface DragShiftSummary {
  early: number;
  good: number;
  perfect: number;
  late: number;
  total: number;
}

export interface DragShiftWindow {
  goodMinRpm: number;
  perfectMinRpm: number;
  perfectMaxRpm: number;
  goodMaxRpm: number;
  redlineRpm: number;
}

export interface DragGearTuning {
  maxGear: number;
  distanceTargetM: number;
  idleRpm: number;
  redlineRpm: number;
  shiftWindow: DragShiftWindow;
  shiftMultipliers: Record<DragShiftQuality, number>;
  gearMaxSpeedKmh: number[];
  gearAccelerationMps2: number[];
  throttleRpmGainPerSecond: number[];
  coastDragMps2: number;
  aeroDragFactor: number;
}

export interface DragGearPlayerRuleState {
  playerId: string;
  nickname: string;
  gear: number;
  maxGear: number;
  rpm: number;
  speedKmh: number;
  distanceM: number;
  distanceTargetM: number;
  throttlePressed: boolean;
  lastShiftQuality: DragShiftQuality | null;
  shiftSummary: DragShiftSummary;
  finished: boolean;
  finishTimeMs: number | null;
  rank: number | null;
  lastInputSequence: number;
  shiftPowerMultiplier: number;
  elapsedMs: number;
}

export interface DragGearRuleState {
  status: RaceStatus;
  player: DragGearPlayerRuleState;
}

export type DragGearRuleInput =
  | { kind: 'drag-throttle'; pressed: boolean; sequence: number; clientTimeMs: number }
  | { kind: 'drag-shift'; sequence: number; clientTimeMs: number };

export const DEFAULT_DRAG_GEAR_TUNING: DragGearTuning = {
  maxGear: 4,
  distanceTargetM: 402,
  idleRpm: 1200,
  redlineRpm: 9000,
  shiftWindow: {
    goodMinRpm: 6500,
    perfectMinRpm: 7200,
    perfectMaxRpm: 7800,
    goodMaxRpm: 8200,
    redlineRpm: 9000,
  },
  shiftMultipliers: {
    early: 0.82,
    good: 1.08,
    perfect: 1.18,
    late: 0.9,
  },
  gearMaxSpeedKmh: [62, 112, 164, 220],
  gearAccelerationMps2: [9.2, 7.2, 5.5, 4.1],
  throttleRpmGainPerSecond: [3200, 2350, 1700, 1100],
  coastDragMps2: 3.2,
  aeroDragFactor: 0.018,
};

export function createInitialDragGearPlayer(
  player: { playerId: string; nickname: string },
  tuning: DragGearTuning = DEFAULT_DRAG_GEAR_TUNING,
): DragGearPlayerRuleState {
  return {
    playerId: player.playerId,
    nickname: player.nickname,
    gear: 1,
    maxGear: tuning.maxGear,
    rpm: tuning.idleRpm,
    speedKmh: 0,
    distanceM: 0,
    distanceTargetM: tuning.distanceTargetM,
    throttlePressed: false,
    lastShiftQuality: null,
    shiftSummary: {
      early: 0,
      good: 0,
      perfect: 0,
      late: 0,
      total: 0,
    },
    finished: false,
    finishTimeMs: null,
    rank: null,
    lastInputSequence: 0,
    shiftPowerMultiplier: 1,
    elapsedMs: 0,
  };
}

export function readDragGearInput(input: unknown): DragGearRuleInput | null {
  if (!isRecord(input)) {
    return null;
  }

  const { kind, sequence, clientTimeMs } = input;

  if (!isFiniteNonNegativeNumber(sequence) || !isFiniteNonNegativeNumber(clientTimeMs)) {
    return null;
  }

  if (kind === 'drag-throttle') {
    const { pressed } = input;

    if (typeof pressed !== 'boolean') {
      return null;
    }

    return {
      kind,
      pressed,
      sequence,
      clientTimeMs,
    };
  }

  if (kind === 'drag-shift') {
    return {
      kind,
      sequence,
      clientTimeMs,
    };
  }

  return null;
}

export function scoreShift(
  rpm: number,
  window: DragShiftWindow = DEFAULT_DRAG_GEAR_TUNING.shiftWindow,
): DragShiftQuality {
  if (rpm < window.goodMinRpm) {
    return 'early';
  }

  if (rpm < window.perfectMinRpm) {
    return 'good';
  }

  if (rpm <= window.perfectMaxRpm) {
    return 'perfect';
  }

  if (rpm <= window.goodMaxRpm) {
    return 'good';
  }

  return 'late';
}

export function applyDragGearInput(
  state: DragGearRuleState,
  input: unknown,
  tuning: DragGearTuning = DEFAULT_DRAG_GEAR_TUNING,
): DragGearPlayerRuleState {
  if (state.status !== RACE_STATUS.racing) {
    return state.player;
  }

  const dragInput = readDragGearInput(input);

  if (dragInput === null || dragInput.sequence <= state.player.lastInputSequence) {
    return state.player;
  }

  if (dragInput.kind === 'drag-throttle') {
    return {
      ...state.player,
      throttlePressed: dragInput.pressed,
      lastInputSequence: dragInput.sequence,
    };
  }

  if (state.player.gear >= tuning.maxGear) {
    return state.player;
  }

  const quality = scoreShift(state.player.rpm, tuning.shiftWindow);
  const summary = incrementShiftSummary(state.player.shiftSummary, quality);
  const rpmDrop = quality === 'late' ? 0.46 : 0.58;

  return {
    ...state.player,
    gear: state.player.gear + 1,
    rpm: clampFinite(state.player.rpm * rpmDrop, tuning.idleRpm, tuning.redlineRpm),
    lastShiftQuality: quality,
    shiftSummary: summary,
    lastInputSequence: dragInput.sequence,
    shiftPowerMultiplier: tuning.shiftMultipliers[quality],
  };
}

export function advanceDragGearPlayer(
  player: DragGearPlayerRuleState,
  deltaMs: number,
  tuning: DragGearTuning = DEFAULT_DRAG_GEAR_TUNING,
  elapsedMs = player.elapsedMs,
): DragGearPlayerRuleState {
  if (player.finished) {
    return player;
  }

  const effectiveDeltaMs = clampFinite(deltaMs, 0, 1000);

  if (effectiveDeltaMs <= 0) {
    return player;
  }

  const deltaSeconds = effectiveDeltaMs / 1000;
  const gearIndex = clampGearIndex(player.gear, tuning);
  const maxSpeedKmh = tuning.gearMaxSpeedKmh[gearIndex] ?? tuning.gearMaxSpeedKmh[0]!;
  const speedMps = player.speedKmh / 3.6;
  const dragMps2 = tuning.coastDragMps2 + speedMps * tuning.aeroDragFactor;
  const throttleAcceleration = player.throttlePressed
    ? (tuning.gearAccelerationMps2[gearIndex] ?? 0) *
      player.shiftPowerMultiplier *
      rpmEfficiency(player.rpm, tuning)
    : 0;
  const accelerationMps2 = throttleAcceleration - dragMps2;
  const nextSpeedMps = clampFinite(
    speedMps + accelerationMps2 * deltaSeconds,
    0,
    maxSpeedKmh / 3.6,
  );
  const nextSpeedKmh = nextSpeedMps * 3.6;
  const averageSpeedMps = (speedMps + nextSpeedMps) / 2;
  const nextDistanceM = clampFinite(
    player.distanceM + averageSpeedMps * deltaSeconds,
    0,
    tuning.distanceTargetM,
  );
  const nextElapsedMs = elapsedMs + effectiveDeltaMs;
  const finished = nextDistanceM >= tuning.distanceTargetM;
  const finishTimeMs =
    finished && player.finishTimeMs === null
      ? interpolateFinishTime(
          elapsedMs,
          effectiveDeltaMs,
          player.distanceM,
          nextDistanceM,
          tuning.distanceTargetM,
        )
      : player.finishTimeMs;
  const nextRpm = player.throttlePressed
    ? Math.max(
        rpmFromSpeed(nextSpeedKmh, maxSpeedKmh, tuning),
        player.rpm + (tuning.throttleRpmGainPerSecond[gearIndex] ?? 0) * deltaSeconds,
      )
    : player.rpm - 2300 * deltaSeconds;

  return {
    ...player,
    speedKmh: roundMetric(nextSpeedKmh),
    rpm: Math.round(clampFinite(nextRpm, tuning.idleRpm, tuning.redlineRpm)),
    distanceM: roundMetric(nextDistanceM),
    finished,
    finishTimeMs,
    elapsedMs: nextElapsedMs,
  };
}

export function buildDragGearRankings(
  players: DragGearPlayerRuleState[],
): GameResultEntry[] {
  return [...players]
    .sort((left, right) => {
      if (left.finishTimeMs !== null && right.finishTimeMs !== null) {
        return left.finishTimeMs - right.finishTimeMs;
      }

      if (left.finishTimeMs !== null) {
        return -1;
      }

      if (right.finishTimeMs !== null) {
        return 1;
      }

      return right.distanceM - left.distanceM;
    })
    .map((player, index) => ({
      playerId: player.playerId,
      rank: index + 1,
      label:
        player.finishTimeMs === null
          ? `${Math.round(player.distanceM)}m`
          : `${(player.finishTimeMs / 1000).toFixed(2)}s`,
      value: player.finishTimeMs ?? Math.round(player.distanceM),
    }));
}

export function buildDragShiftSummary(
  player: Pick<DragGearPlayerRuleState, 'shiftSummary'>,
): DragShiftSummary {
  return {
    early: player.shiftSummary.early,
    good: player.shiftSummary.good,
    perfect: player.shiftSummary.perfect,
    late: player.shiftSummary.late,
    total: player.shiftSummary.total,
  };
}

function incrementShiftSummary(
  summary: DragShiftSummary,
  quality: DragShiftQuality,
): DragShiftSummary {
  return {
    ...summary,
    [quality]: summary[quality] + 1,
    total: summary.total + 1,
  };
}

function rpmEfficiency(rpm: number, tuning: DragGearTuning) {
  const normalized = (rpm - tuning.idleRpm) / (tuning.redlineRpm - tuning.idleRpm);

  return clampFinite(0.86 + normalized * 0.32, 0.72, 1.18);
}

function rpmFromSpeed(speedKmh: number, maxSpeedKmh: number, tuning: DragGearTuning) {
  const ratio = clampFinite(speedKmh / Math.max(1, maxSpeedKmh), 0, 1);

  return tuning.idleRpm + ratio * (tuning.redlineRpm - tuning.idleRpm);
}

function interpolateFinishTime(
  elapsedMs: number,
  deltaMs: number,
  previousDistanceM: number,
  nextDistanceM: number,
  targetDistanceM: number,
) {
  if (nextDistanceM <= previousDistanceM) {
    return Math.round(elapsedMs + deltaMs);
  }

  const fraction =
    (targetDistanceM - previousDistanceM) / (nextDistanceM - previousDistanceM);

  return Math.round(elapsedMs + deltaMs * clampFinite(fraction, 0, 1));
}

function clampGearIndex(gear: number, tuning: DragGearTuning) {
  return Math.round(clampFinite(gear, 1, tuning.maxGear)) - 1;
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

function clampFinite(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
