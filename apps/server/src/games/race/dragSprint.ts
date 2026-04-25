import {
  GAME_SESSION_STATUS,
  LOBBY_RACE_MODES,
  RACE_STATUS,
  type DragSprintLane,
  type DragSprintObstacleState,
  type DragSprintPickupState,
  type DragSprintPlayerState,
  type DragSprintSnapshot,
  type GameInputPayload,
  type GameResultEntry,
  type GameSessionEnvelope,
  type LobbyState,
  type SessionFinishedPayload,
  type SteeringInput,
} from '@blitz/shared';

import type { GameRuntimeInstance, RuntimeCallbacks } from '../runtime.js';

const DEFAULT_COUNTDOWN_MS = 3_000;
const DEFAULT_DISTANCE_TARGET = 360;
const DEFAULT_MAX_SPEED = 24;
const DEFAULT_ACCELERATION = 12;
const DEFAULT_BRAKE = 12;
const DEFAULT_DRAG = 1;
const DEFAULT_LANE_CHANGE_COOLDOWN_TICKS = 2;
const TRACK_ID = 'drag-strip';

type TimerHandle = ReturnType<typeof setTimeout> | null;

export interface DragSprintRuntimeOptions extends RuntimeCallbacks<DragSprintSnapshot> {
  countdownMs?: number;
  distanceTarget?: number;
  laneChangeCooldownTicks?: number;
  now?: () => number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}

const OBSTACLE_STREAM: DragSprintObstacleState[] = [
  {
    id: 'drag-obstacle-1',
    type: 'cone',
    lane: 0,
    distance: 36,
    speed: 0,
  },
  {
    id: 'drag-obstacle-2',
    type: 'slow-car',
    lane: 2,
    distance: 72,
    speed: 4,
  },
];

const PICKUP_STREAM: DragSprintPickupState[] = [
  {
    id: 'drag-pickup-1',
    type: 'nitro',
    lane: 1,
    distance: 28,
  },
  {
    id: 'drag-pickup-2',
    type: 'shield',
    lane: 0,
    distance: 64,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function formatFinishTime(finishTimeMs: number | null) {
  if (finishTimeMs === null) {
    return null;
  }

  return `${(finishTimeMs / 1000).toFixed(1)}s`;
}

function createPlayerState(lobby: LobbyState, playerIndex: number): DragSprintPlayerState {
  const player = lobby.players[playerIndex]!;
  const lane = clamp(playerIndex, 0, 2) as DragSprintLane;

  return {
    playerId: player.id,
    nickname: player.nickname,
    lane,
    distance: 0,
    speed: 0,
    status: 'racing',
    activePowerUp: null,
  };
}

function buildRankings(
  playersState: DragSprintPlayerState[],
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

      return right.distance - left.distance;
    })
    .map((player, index) => ({
      playerId: player.playerId,
      rank: index + 1,
      label:
        formatFinishTime(finishTimesMs[player.playerId]) ?? `${Math.round(player.distance)}m`,
      value: finishTimesMs[player.playerId] ?? Math.round(player.distance),
    }));
}

export function createDragSprintRuntime(
  lobby: LobbyState,
  sessionId: string,
  options: DragSprintRuntimeOptions = {},
): GameRuntimeInstance<DragSprintSnapshot> {
  const countdownMs = options.countdownMs ?? DEFAULT_COUNTDOWN_MS;
  const distanceTarget = Math.max(30, options.distanceTarget ?? DEFAULT_DISTANCE_TARGET);
  const laneChangeCooldownTicks =
    options.laneChangeCooldownTicks ?? DEFAULT_LANE_CHANGE_COOLDOWN_TICKS;
  const now = options.now ?? (() => Date.now());
  const schedule =
    options.schedule ??
    ((callback: () => void, delayMs: number) => setTimeout(callback, delayMs));
  const cancel =
    options.cancel ??
    ((timer: Exclude<TimerHandle, null>) => {
      clearTimeout(timer);
    });

  let countdownTimer: TimerHandle = null;
  let startedAtMs: number | null = null;
  let finishTimesMs = Object.fromEntries(
    lobby.players.map((player) => [player.id, null]),
  ) as Record<string, number | null>;
  let inputTickByPlayerId = Object.fromEntries(
    lobby.players.map((player) => [player.id, 0]),
  ) as Record<string, number>;
  let lastLaneChangeTickByPlayerId = Object.fromEntries(
    lobby.players.map((player) => [player.id, -laneChangeCooldownTicks]),
  ) as Record<string, number>;

  let state: GameSessionEnvelope<DragSprintSnapshot> = {
    sessionId,
    lobbyCode: lobby.code,
    game: 'race',
    variant: 'drag-sprint',
    status: GAME_SESSION_STATUS.countdown,
    countdown: Math.ceil(countdownMs / 1000),
    results: null,
    state: {
      sessionId,
      lobbyCode: lobby.code,
      trackId: TRACK_ID,
      mode: LOBBY_RACE_MODES.finishLine,
      status: RACE_STATUS.countdown,
      tick: 0,
      startedAt: null,
      countdown: Math.ceil(countdownMs / 1000),
      distanceTarget,
      playersState: lobby.players.map((_, index) => createPlayerState(lobby, index)),
      obstacles: OBSTACLE_STREAM.map((obstacle) => ({ ...obstacle })),
      pickups: PICKUP_STREAM.map((pickup) => ({ ...pickup })),
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
    startedAtMs = now();
    state = {
      ...state,
      status: GAME_SESSION_STATUS.active,
      countdown: 0,
      state: {
        ...state.state,
        status: RACE_STATUS.racing,
        countdown: 0,
        startedAt: startedAtMs,
      },
    };
    emitState();
  };

  const emitFinished = () => {
    const payload: SessionFinishedPayload = {
      sessionId,
      lobbyCode: lobby.code,
      game: 'race',
      variant: 'drag-sprint',
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
    applyInput(playerId, input: GameInputPayload) {
      if (state.state.status !== RACE_STATUS.racing) {
        return state;
      }

      const playerIndex = state.state.playersState.findIndex((player) => player.playerId === playerId);

      if (playerIndex < 0) {
        return state;
      }

      const tick = state.state.tick + 1;
      const steer = readSteer(input.steer);
      const accelerate = readBoolean(input.accelerate);
      const brake = readBoolean(input.brake);
      const nextPlayers = state.state.playersState.map((player) => ({ ...player }));
      const currentPlayer = nextPlayers[playerIndex]!;
      const playerTick = (inputTickByPlayerId[playerId] ?? 0) + 1;
      const nextSpeed = clamp(
        currentPlayer.speed +
          (accelerate ? DEFAULT_ACCELERATION : 0) -
          (brake ? DEFAULT_BRAKE : 0) -
          DEFAULT_DRAG,
        0,
        DEFAULT_MAX_SPEED,
      );
      const canChangeLane =
        playerTick - (lastLaneChangeTickByPlayerId[playerId] ?? 0) >= laneChangeCooldownTicks;
      let nextLane = currentPlayer.lane;

      inputTickByPlayerId = {
        ...inputTickByPlayerId,
        [playerId]: playerTick,
      };

      if (steer !== 0 && canChangeLane) {
        nextLane = clamp(currentPlayer.lane + steer, 0, 2) as DragSprintLane;

        if (nextLane !== currentPlayer.lane) {
          lastLaneChangeTickByPlayerId = {
            ...lastLaneChangeTickByPlayerId,
            [playerId]: playerTick,
          };
        }
      }

      const nextDistance = clamp(currentPlayer.distance + nextSpeed, 0, distanceTarget);
      nextPlayers[playerIndex] = {
        ...currentPlayer,
        lane: nextLane,
        speed: nextSpeed,
        distance: nextDistance,
        status: nextDistance >= distanceTarget ? 'finished' : 'racing',
      };

      const finishTimeMs =
        nextDistance >= distanceTarget
          ? (finishTimesMs[playerId] ?? Math.max(0, now() - (startedAtMs ?? now())))
          : finishTimesMs[playerId];
      finishTimesMs = {
        ...finishTimesMs,
        [playerId]: finishTimeMs,
      };

      const winnerReachedFinish = nextPlayers.some((player) => player.distance >= distanceTarget);

      state = {
        ...state,
        status: winnerReachedFinish ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
        state: {
          ...state.state,
          tick,
          status: winnerReachedFinish ? RACE_STATUS.finished : RACE_STATUS.racing,
          playersState: nextPlayers,
          obstacles: OBSTACLE_STREAM.map((obstacle) => ({ ...obstacle })),
          pickups: PICKUP_STREAM.map((pickup) => ({ ...pickup })),
        },
        results: winnerReachedFinish
          ? {
              rankings: buildRankings(nextPlayers, finishTimesMs),
              summary: {
                mode: LOBBY_RACE_MODES.finishLine,
                track: TRACK_ID,
                distanceTarget,
              },
            }
          : null,
      };

      emitState();

      if (winnerReachedFinish) {
        emitFinished();
      }

      return state;
    },
    removePlayer(playerId) {
      const nextPlayers = state.state.playersState.filter((player) => player.playerId !== playerId);
      const { [playerId]: _finishTime, ...nextFinishTimes } = finishTimesMs;
      const { [playerId]: _inputTick, ...nextInputTicks } = inputTickByPlayerId;
      const { [playerId]: _laneChangeTick, ...nextLaneChangeTicks } = lastLaneChangeTickByPlayerId;

      finishTimesMs = nextFinishTimes;
      inputTickByPlayerId = nextInputTicks;
      lastLaneChangeTickByPlayerId = nextLaneChangeTicks;
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
