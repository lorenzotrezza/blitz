import {
  GAME_SESSION_STATUS,
  LOBBY_RACE_MODES,
  RACE_STATUS,
  type DragSprintLane,
  type DragSprintObstacleState,
  type DragSprintPickupState,
  type DragSprintPlayerState,
  type DragSprintSnapshot,
  type DragSprintStanding,
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

type DragSprintLobbyPlayer = LobbyState['players'][number];

const BEST_OF_3_TOTAL_ROUNDS = 3;

function cloneObstacles() {
  return OBSTACLE_STREAM.map((obstacle) => ({ ...obstacle }));
}

function clonePickups() {
  return PICKUP_STREAM.map((pickup) => ({ ...pickup }));
}

function createPlayerState(player: DragSprintLobbyPlayer, playerIndex: number): DragSprintPlayerState {
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

function createPlayerStates(players: DragSprintLobbyPlayer[]) {
  return players.map((player, index) => createPlayerState(player, index));
}

function createFinishTimes(players: DragSprintLobbyPlayer[]) {
  return Object.fromEntries(players.map((player) => [player.id, null])) as Record<string, number | null>;
}

function createNumberMap(players: DragSprintLobbyPlayer[], initialValue: number) {
  return Object.fromEntries(players.map((player) => [player.id, initialValue])) as Record<string, number>;
}

function buildFinishLineRankings(
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

function buildBestOf3Standings(
  players: DragSprintLobbyPlayer[],
  pointsByPlayerId: Record<string, number>,
  roundWinsByPlayerId: Record<string, number>,
  cumulativeTimeByPlayerId: Record<string, number>,
): DragSprintStanding[] {
  return players
    .map((player) => ({
      playerId: player.id,
      nickname: player.nickname,
      points: pointsByPlayerId[player.id] ?? 0,
      roundWins: roundWinsByPlayerId[player.id] ?? 0,
      cumulativeTimeMs: cumulativeTimeByPlayerId[player.id] ?? 0,
    }))
    .sort((left, right) => {
      if (left.points !== right.points) {
        return right.points - left.points;
      }

      if (left.cumulativeTimeMs !== right.cumulativeTimeMs) {
        return left.cumulativeTimeMs - right.cumulativeTimeMs;
      }

      if (left.roundWins !== right.roundWins) {
        return right.roundWins - left.roundWins;
      }

      return left.playerId.localeCompare(right.playerId);
    });
}

function buildBestOf3Rankings(standings: DragSprintStanding[]): GameResultEntry[] {
  return standings.map((entry, index) => ({
    playerId: entry.playerId,
    rank: index + 1,
    label: `${entry.points} pts · ${entry.cumulativeTimeMs} ms`,
    value: entry.points,
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
  const mode =
    lobby.settings.raceMode === LOBBY_RACE_MODES.bestOf3
      ? LOBBY_RACE_MODES.bestOf3
      : LOBBY_RACE_MODES.finishLine;
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
  let activePlayers = [...lobby.players];
  let currentRound = 1;
  let pointsByPlayerId = createNumberMap(activePlayers, 0);
  let roundWinsByPlayerId = createNumberMap(activePlayers, 0);
  let cumulativeTimeByPlayerId = createNumberMap(activePlayers, 0);
  let startedAtMs: number | null = null;
  let finishTimesMs = createFinishTimes(activePlayers);
  let inputTickByPlayerId = createNumberMap(activePlayers, 0);
  let lastLaneChangeTickByPlayerId = createNumberMap(activePlayers, -laneChangeCooldownTicks);

  const buildStateSnapshot = (snapshot: DragSprintSnapshot) => {
    if (mode !== LOBBY_RACE_MODES.bestOf3) {
      return snapshot;
    }

    return {
      ...snapshot,
      round: currentRound,
      totalRounds: BEST_OF_3_TOTAL_ROUNDS,
      standings: buildBestOf3Standings(
        activePlayers,
        pointsByPlayerId,
        roundWinsByPlayerId,
        cumulativeTimeByPlayerId,
      ),
    };
  };

  const resetRoundTracking = () => {
    finishTimesMs = createFinishTimes(activePlayers);
    inputTickByPlayerId = createNumberMap(activePlayers, 0);
    lastLaneChangeTickByPlayerId = createNumberMap(activePlayers, -laneChangeCooldownTicks);
  };

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
      mode,
      status: RACE_STATUS.countdown,
      tick: 0,
      startedAt: null,
      countdown: Math.ceil(countdownMs / 1000),
      distanceTarget,
      playersState: createPlayerStates(activePlayers),
      obstacles: cloneObstacles(),
      pickups: clonePickups(),
    } as DragSprintSnapshot,
  };
  state = {
    ...state,
    state: buildStateSnapshot(state.state),
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

  const setRoundState = (
    playersState: DragSprintPlayerState[],
    tick: number,
    status: DragSprintSnapshot['status'],
  ) => {
    state = {
      ...state,
      status: status === RACE_STATUS.finished ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
      countdown: 0,
      state: buildStateSnapshot({
        ...state.state,
        status,
        tick,
        countdown: 0,
        startedAt: startedAtMs,
        playersState,
        obstacles: cloneObstacles(),
        pickups: clonePickups(),
      }),
    };
  };

  const activateRace = () => {
    startedAtMs = now();
    resetRoundTracking();
    setRoundState(createPlayerStates(activePlayers), 0, RACE_STATUS.racing);
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

  const finalizeBestOf3Session = (tick: number, playersState: DragSprintPlayerState[]) => {
    const standings = buildBestOf3Standings(
      activePlayers,
      pointsByPlayerId,
      roundWinsByPlayerId,
      cumulativeTimeByPlayerId,
    );

    state = {
      ...state,
      status: GAME_SESSION_STATUS.finished,
      countdown: 0,
      results: {
        rankings: buildBestOf3Rankings(standings),
        summary: {
          mode: LOBBY_RACE_MODES.bestOf3,
          track: TRACK_ID,
          distanceTarget,
          rounds: BEST_OF_3_TOTAL_ROUNDS,
        },
      },
      state: buildStateSnapshot({
        ...state.state,
        status: RACE_STATUS.finished,
        tick,
        countdown: 0,
        startedAt: startedAtMs,
        playersState,
        obstacles: cloneObstacles(),
        pickups: clonePickups(),
      }),
    };

    emitState();
    emitFinished();
    return state;
  };

  const finishBestOf3Round = (tick: number, playersState: DragSprintPlayerState[]) => {
    const roundPlacements = [...playersState].sort((left, right) => {
      const leftFinish = finishTimesMs[left.playerId] ?? Number.POSITIVE_INFINITY;
      const rightFinish = finishTimesMs[right.playerId] ?? Number.POSITIVE_INFINITY;

      if (leftFinish !== rightFinish) {
        return leftFinish - rightFinish;
      }

      return left.playerId.localeCompare(right.playerId);
    });
    const playerCount = roundPlacements.length;

    const nextPoints = { ...pointsByPlayerId };
    const nextRoundWins = { ...roundWinsByPlayerId };
    const nextCumulativeTimes = { ...cumulativeTimeByPlayerId };

    roundPlacements.forEach((player, index) => {
      const finishTimeMs = finishTimesMs[player.playerId] ?? 0;
      nextPoints[player.playerId] = (nextPoints[player.playerId] ?? 0) + (playerCount - index);
      nextCumulativeTimes[player.playerId] =
        (nextCumulativeTimes[player.playerId] ?? 0) + finishTimeMs;

      if (index === 0) {
        nextRoundWins[player.playerId] = (nextRoundWins[player.playerId] ?? 0) + 1;
      }
    });

    pointsByPlayerId = nextPoints;
    roundWinsByPlayerId = nextRoundWins;
    cumulativeTimeByPlayerId = nextCumulativeTimes;

    if (currentRound >= BEST_OF_3_TOTAL_ROUNDS) {
      return finalizeBestOf3Session(tick, playersState);
    }

    currentRound += 1;
    startedAtMs = now();
    resetRoundTracking();
    setRoundState(createPlayerStates(activePlayers), 0, RACE_STATUS.racing);
    emitState();
    return state;
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

      if (currentPlayer.status !== 'racing') {
        return state;
      }

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

      if (mode === LOBBY_RACE_MODES.bestOf3) {
        const roundComplete = nextPlayers.every((player) => player.status === 'finished');

        if (roundComplete) {
          return finishBestOf3Round(tick, nextPlayers);
        }

        setRoundState(nextPlayers, tick, RACE_STATUS.racing);
        emitState();
        return state;
      }

      const winnerReachedFinish = nextPlayers.some((player) => player.distance >= distanceTarget);

      state = {
        ...state,
        status: winnerReachedFinish ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
        state: buildStateSnapshot({
          ...state.state,
          tick,
          status: winnerReachedFinish ? RACE_STATUS.finished : RACE_STATUS.racing,
          playersState: nextPlayers,
          obstacles: cloneObstacles(),
          pickups: clonePickups(),
        }),
        results: winnerReachedFinish
          ? {
              rankings: buildFinishLineRankings(nextPlayers, finishTimesMs),
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
      activePlayers = activePlayers.filter((player) => player.id !== playerId);
      const nextPlayers = state.state.playersState.filter((player) => player.playerId !== playerId);
      const { [playerId]: _finishTime, ...nextFinishTimes } = finishTimesMs;
      const { [playerId]: _inputTick, ...nextInputTicks } = inputTickByPlayerId;
      const { [playerId]: _laneChangeTick, ...nextLaneChangeTicks } = lastLaneChangeTickByPlayerId;
      const { [playerId]: _points, ...nextPoints } = pointsByPlayerId;
      const { [playerId]: _roundWins, ...nextRoundWins } = roundWinsByPlayerId;
      const { [playerId]: _cumulativeTime, ...nextCumulativeTimes } = cumulativeTimeByPlayerId;

      finishTimesMs = nextFinishTimes;
      inputTickByPlayerId = nextInputTicks;
      lastLaneChangeTickByPlayerId = nextLaneChangeTicks;
      pointsByPlayerId = nextPoints;
      roundWinsByPlayerId = nextRoundWins;
      cumulativeTimeByPlayerId = nextCumulativeTimes;

      if (
        mode === LOBBY_RACE_MODES.bestOf3 &&
        state.status !== GAME_SESSION_STATUS.finished &&
        state.state.status === RACE_STATUS.racing
      ) {
        if (nextPlayers.length === 0) {
          finalizeBestOf3Session(state.state.tick, nextPlayers);
          return;
        }

        if (nextPlayers.every((player) => player.status === 'finished')) {
          finishBestOf3Round(state.state.tick, nextPlayers);
          return;
        }
      }

      state = {
        ...state,
        state: buildStateSnapshot({
          ...state.state,
          playersState: nextPlayers,
        }),
      };
      emitState();
    },
    dispose() {
      clearCountdown();
    },
  };
}
