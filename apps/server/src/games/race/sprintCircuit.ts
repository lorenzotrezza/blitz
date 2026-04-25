import {
  GAME_SESSION_STATUS,
  RACE_STATUS,
  type GameInputPayload,
  type GameResultEntry,
  type GameSessionEnvelope,
  type LobbyState,
  type RacePlayerState,
  type RaceSnapshot,
  type SessionFinishedPayload,
  type SteeringInput,
} from '@blitz/shared';

import type { GameRuntimeInstance, RuntimeCallbacks } from '../runtime.js';

const DEFAULT_COUNTDOWN_MS = 3_000;
const DEFAULT_LAPS = 3;
const DEFAULT_MAX_SPEED = 5.2;
const DEFAULT_ACCELERATION = 0.28;
const DEFAULT_BRAKE = 0.36;
const DEFAULT_DRAG = 0.05;
const DEFAULT_PROGRESS_STEP = 0.0032;
const DEFAULT_LANE_MIN = -26;
const DEFAULT_LANE_MAX = 26;
const DEFAULT_COLLISION_LANE_GAP = 14;
const DEFAULT_COLLISION_PROGRESS_GAP = 0.022;
const DEFAULT_SPEED_PENALTY = 0.84;

type TimerHandle = ReturnType<typeof setTimeout> | null;

type TrackPoint = {
  x: number;
  y: number;
};

type TrackSegment = {
  from: TrackPoint;
  to: TrackPoint;
  length: number;
};

export interface SprintCircuitRuntimeOptions extends RuntimeCallbacks<RaceSnapshot> {
  countdownMs?: number;
  laps?: number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}

const TRACK_POINTS: TrackPoint[] = [
  { x: 112, y: 88 },
  { x: 286, y: 88 },
  { x: 332, y: 136 },
  { x: 332, y: 230 },
  { x: 286, y: 276 },
  { x: 194, y: 276 },
  { x: 146, y: 328 },
  { x: 146, y: 438 },
  { x: 204, y: 484 },
  { x: 304, y: 484 },
  { x: 336, y: 430 },
  { x: 336, y: 340 },
  { x: 248, y: 316 },
  { x: 154, y: 256 },
  { x: 94, y: 168 },
];

const CHECKPOINT_MARKERS = [0.16, 0.32, 0.5, 0.66, 0.82, 0.96];

const TRACK_SEGMENTS: TrackSegment[] = TRACK_POINTS.map((point, index) => {
  const nextPoint = TRACK_POINTS[(index + 1) % TRACK_POINTS.length]!;
  const dx = nextPoint.x - point.x;
  const dy = nextPoint.y - point.y;

  return {
    from: point,
    to: nextPoint,
    length: Math.hypot(dx, dy),
  };
});

const TRACK_TOTAL_LENGTH = TRACK_SEGMENTS.reduce((total, segment) => total + segment.length, 0);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatFinishTime(finishTimeMs: number | null) {
  if (finishTimeMs === null) {
    return 'DNF';
  }

  return `${(finishTimeMs / 1000).toFixed(1)}s`;
}

function readSteer(value: unknown): SteeringInput {
  if (value === -1 || value === 0 || value === 1) {
    return value;
  }

  return 0;
}

function readBoolean(value: unknown) {
  return value === true;
}

function readTick(value: unknown, currentTick: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return currentTick + 1;
  }

  return Math.max(currentTick + 1, Math.round(value));
}

function sampleTrackPose(trackProgress: number, laneOffset: number) {
  const normalizedProgress = clamp(trackProgress, 0, 0.999999);
  const targetDistance = TRACK_TOTAL_LENGTH * normalizedProgress;
  let traversed = 0;

  for (const segment of TRACK_SEGMENTS) {
    const nextTraversed = traversed + segment.length;

    if (targetDistance > nextTraversed) {
      traversed = nextTraversed;
      continue;
    }

    const localProgress = segment.length === 0 ? 0 : (targetDistance - traversed) / segment.length;
    const baseX = segment.from.x + (segment.to.x - segment.from.x) * localProgress;
    const baseY = segment.from.y + (segment.to.y - segment.from.y) * localProgress;
    const tangentX = segment.to.x - segment.from.x;
    const tangentY = segment.to.y - segment.from.y;
    const tangentLength = Math.hypot(tangentX, tangentY) || 1;
    const normalX = -tangentY / tangentLength;
    const normalY = tangentX / tangentLength;

    return {
      x: baseX + normalX * laneOffset,
      y: baseY + normalY * laneOffset,
      angle: Math.atan2(tangentY, tangentX),
    };
  }

  return sampleTrackPose(0, laneOffset);
}

function projectPlayerState(
  totalProgress: number,
  laneOffset: number,
  laps: number,
  previous: RacePlayerState,
): RacePlayerState {
  const normalizedProgress = clamp(totalProgress, 0, 1);
  const totalLapProgress = normalizedProgress * laps;
  const completedLaps =
    normalizedProgress >= 1 ? laps : Math.min(laps - 1, Math.floor(totalLapProgress));
  const circuitProgress =
    normalizedProgress >= 1 ? 0.999999 : totalLapProgress - Math.floor(totalLapProgress);
  const pose = sampleTrackPose(circuitProgress, laneOffset);
  const checkpoint = Math.min(
    CHECKPOINT_MARKERS.length - 1,
    Math.floor(circuitProgress * CHECKPOINT_MARKERS.length),
  );

  return {
    ...previous,
    x: pose.x,
    y: pose.y,
    vx: pose.x - previous.x,
    vy: pose.y - previous.y,
    angle: pose.angle,
    lap: completedLaps,
    checkpoint,
    progress: normalizedProgress,
  };
}

function createPlayerState(lobby: LobbyState, playerIndex: number, laps: number): RacePlayerState {
  const player = lobby.players[playerIndex]!;
  const laneOffset = clamp(-12 + playerIndex * 10, DEFAULT_LANE_MIN, DEFAULT_LANE_MAX);
  const startProgress = clamp(playerIndex * 0.01, 0, 0.04);
  const seedState: RacePlayerState = {
    playerId: player.id,
    nickname: player.nickname,
    x: TRACK_POINTS[0]!.x,
    y: TRACK_POINTS[0]!.y,
    vx: 0,
    vy: 0,
    angle: 0,
    lap: 0,
    checkpoint: 0,
    progress: startProgress,
    penalties: 0,
    speed: 0,
  };

  return projectPlayerState(startProgress, laneOffset, laps, seedState);
}

function buildRankings(
  playersState: RaceSnapshot['playersState'],
  finishTimesMs: Record<string, number | null>,
): GameResultEntry[] {
  return [...playersState]
    .sort((left, right) => {
      const leftFinish = finishTimesMs[left.playerId];
      const rightFinish = finishTimesMs[right.playerId];

      if (leftFinish !== null && rightFinish !== null) {
        return leftFinish - rightFinish;
      }

      if (leftFinish !== null) {
        return -1;
      }

      if (rightFinish !== null) {
        return 1;
      }

      return right.progress - left.progress;
    })
    .map((player, index) => ({
      playerId: player.playerId,
      rank: index + 1,
      label: formatFinishTime(finishTimesMs[player.playerId]),
      value: finishTimesMs[player.playerId],
    }));
}

export function createSprintCircuitRuntime(
  lobby: LobbyState,
  sessionId: string,
  options: SprintCircuitRuntimeOptions = {},
): GameRuntimeInstance<RaceSnapshot> {
  const laps = Math.max(1, options.laps ?? lobby.settings.laps ?? DEFAULT_LAPS);
  const countdownMs = options.countdownMs ?? DEFAULT_COUNTDOWN_MS;
  const schedule =
    options.schedule ??
    ((callback: () => void, delayMs: number) => setTimeout(callback, delayMs));
  const cancel =
    options.cancel ??
    ((timer: Exclude<TimerHandle, null>) => {
      clearTimeout(timer);
    });

  let countdownTimer: TimerHandle = null;
  let laneByPlayerId = Object.fromEntries(
    lobby.players.map((player, index) => [
      player.id,
      clamp(-12 + index * 10, DEFAULT_LANE_MIN, DEFAULT_LANE_MAX),
    ]),
  ) as Record<string, number>;
  let finishTimesMs = Object.fromEntries(
    lobby.players.map((player) => [player.id, null]),
  ) as Record<string, number | null>;

  let state: GameSessionEnvelope<RaceSnapshot> = {
    sessionId,
    lobbyCode: lobby.code,
    game: 'race',
    variant: 'sprint-circuit',
    status: GAME_SESSION_STATUS.countdown,
    countdown: Math.ceil(countdownMs / 1000),
    results: null,
    state: {
      sessionId,
      lobbyCode: lobby.code,
      trackId: 'sprint-circuit',
      status: RACE_STATUS.countdown,
      tick: 0,
      startedAt: null,
      countdown: Math.ceil(countdownMs / 1000),
      playersState: lobby.players.map((_, index) => createPlayerState(lobby, index, laps)),
      botsState: [],
    },
  };

  const clearCountdown = () => {
    if (!countdownTimer) {
      return;
    }

    cancel(countdownTimer);
    countdownTimer = null;
  };

  const emitState = () => {
    options.onState?.(state);
    return state;
  };

  const activateRace = () => {
    state = {
      ...state,
      status: GAME_SESSION_STATUS.active,
      countdown: 0,
      state: {
        ...state.state,
        status: RACE_STATUS.racing,
        countdown: 0,
        startedAt: Date.now(),
      },
    };
    emitState();
  };

  const emitFinished = () => {
    const payload: SessionFinishedPayload = {
      sessionId,
      lobbyCode: lobby.code,
      game: 'race',
      variant: 'sprint-circuit',
      results: state.results!,
    };

    options.onFinished?.(payload);
  };

  return {
    sessionId,
    lobbyCode: lobby.code,
    start() {
      if (countdownMs <= 0) {
        activateRace();
        return state;
      }

      emitState();
      countdownTimer = schedule(() => {
        activateRace();
      }, countdownMs);

      return state;
    },
    applyInput(playerId, input) {
      if (state.state.status !== RACE_STATUS.racing) {
        return state;
      }

      const playerIndex = state.state.playersState.findIndex((player) => player.playerId === playerId);

      if (playerIndex < 0) {
        return state;
      }

      const steer = readSteer(input.steer);
      const accelerate = readBoolean(input.accelerate);
      const brake = readBoolean(input.brake);
      const currentPlayer = state.state.playersState[playerIndex]!;
      const currentLane = laneByPlayerId[playerId] ?? 0;
      const nextSpeed = clamp(
        currentPlayer.speed +
          (accelerate ? DEFAULT_ACCELERATION : 0) -
          (brake ? DEFAULT_BRAKE : 0) -
          DEFAULT_DRAG,
        0,
        DEFAULT_MAX_SPEED,
      );
      const nextLane = clamp(
        currentLane + steer * (2.2 + nextSpeed * 0.6),
        DEFAULT_LANE_MIN,
        DEFAULT_LANE_MAX,
      );
      const nextProgress = clamp(
        currentPlayer.progress + (nextSpeed * DEFAULT_PROGRESS_STEP) / laps,
        0,
        1,
      );
      const nextPlayers = state.state.playersState.map((player) => ({ ...player }));

      laneByPlayerId = {
        ...laneByPlayerId,
        [playerId]: nextLane,
      };
      nextPlayers[playerIndex] = projectPlayerState(nextProgress, nextLane, laps, {
        ...currentPlayer,
        speed: nextSpeed,
      });

      for (let index = 0; index < nextPlayers.length; index += 1) {
        if (index === playerIndex) {
          continue;
        }

        const active = nextPlayers[playerIndex]!;
        const other = nextPlayers[index]!;
        const progressGap = Math.abs(active.progress - other.progress);
        const laneGap = Math.abs(
          (laneByPlayerId[active.playerId] ?? 0) - (laneByPlayerId[other.playerId] ?? 0),
        );

        if (
          progressGap > DEFAULT_COLLISION_PROGRESS_GAP ||
          laneGap > DEFAULT_COLLISION_LANE_GAP ||
          active.progress >= 1 ||
          other.progress >= 1
        ) {
          continue;
        }

        const direction =
          (laneByPlayerId[active.playerId] ?? 0) <= (laneByPlayerId[other.playerId] ?? 0) ? -1 : 1;
        const nudgedActiveLane = clamp(
          (laneByPlayerId[active.playerId] ?? 0) + direction * 6,
          DEFAULT_LANE_MIN,
          DEFAULT_LANE_MAX,
        );
        const nudgedOtherLane = clamp(
          (laneByPlayerId[other.playerId] ?? 0) - direction * 6,
          DEFAULT_LANE_MIN,
          DEFAULT_LANE_MAX,
        );

        laneByPlayerId = {
          ...laneByPlayerId,
          [active.playerId]: nudgedActiveLane,
          [other.playerId]: nudgedOtherLane,
        };
        nextPlayers[playerIndex] = projectPlayerState(active.progress, nudgedActiveLane, laps, {
          ...active,
          speed: active.speed * DEFAULT_SPEED_PENALTY,
          penalties: active.penalties + 1,
        });
        nextPlayers[index] = projectPlayerState(other.progress, nudgedOtherLane, laps, {
          ...other,
          speed: other.speed * DEFAULT_SPEED_PENALTY,
          penalties: other.penalties + 1,
        });
      }

      const startedAt = state.state.startedAt ?? Date.now();
      finishTimesMs = { ...finishTimesMs };

      for (const player of nextPlayers) {
        if (player.progress >= 1 && finishTimesMs[player.playerId] === null) {
          finishTimesMs[player.playerId] = Date.now() - startedAt;
        }
      }

      const allFinished =
        nextPlayers.length > 0 && nextPlayers.every((player) => finishTimesMs[player.playerId] !== null);

      state = {
        ...state,
        status: allFinished ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
        state: {
          ...state.state,
          tick: readTick(input.tick, state.state.tick),
          status: allFinished ? RACE_STATUS.finished : RACE_STATUS.racing,
          playersState: nextPlayers,
        },
        results: allFinished
          ? {
              rankings: buildRankings(nextPlayers, finishTimesMs),
              summary: {
                laps,
                track: 'sprint-circuit',
              },
            }
          : null,
      };

      emitState();

      if (allFinished) {
        emitFinished();
      }

      return state;
    },
    removePlayer(playerId) {
      const nextPlayers = state.state.playersState.filter((player) => player.playerId !== playerId);
      const { [playerId]: _lane, ...nextLanes } = laneByPlayerId;
      const { [playerId]: _finishTime, ...nextFinishTimes } = finishTimesMs;

      laneByPlayerId = nextLanes;
      finishTimesMs = nextFinishTimes;
      state = {
        ...state,
        state: {
          ...state.state,
          playersState: nextPlayers,
        },
      };
      emitState();
    },
    dispose() {
      clearCountdown();
    },
  };
}
