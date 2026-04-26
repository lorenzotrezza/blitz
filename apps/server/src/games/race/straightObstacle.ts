import {
  GAME_SESSION_STATUS,
  PLAYER_CONNECTION_STATE,
  RACE_STATUS,
  type GameInputPayload,
  type GameResults,
  type GameSessionEnvelope,
  type LobbyState,
  type RaceStatus,
  type SessionFinishedPayload,
  type StraightObstacleObstacle,
  type StraightObstacleSnapshot,
} from '@blitz/shared';

import type { GameRuntimeInstance, RuntimeCallbacks } from '../runtime.js';
import {
  advanceStraightObstacleRace,
  buildStraightObstacleResults,
  clampSteerX,
  createInitialStraightObstacleState,
  type StraightObstacleRuleState,
} from './straightObstacleRules.js';

const DEFAULT_COUNTDOWN_MS = 3_000;
const TRACK_ID = 'straight-obstacle';
const OBSTACLE_PREVIEW_BACKFILL = 24;
const OBSTACLE_PREVIEW_DISTANCE = 180;

type IntervalHandle = ReturnType<typeof setInterval>;
type TimeoutHandle = ReturnType<typeof setTimeout>;

interface StraightObstacleTimers {
  now?: () => number;
  setInterval?: (callback: () => void, delayMs: number) => IntervalHandle;
  clearInterval?: (timer: IntervalHandle) => void;
  setTimeout?: (callback: () => void, delayMs: number) => TimeoutHandle;
  clearTimeout?: (timer: TimeoutHandle) => void;
}

export interface StraightObstacleRuntimeOptions
  extends RuntimeCallbacks<StraightObstacleSnapshot> {
  countdownMs?: number;
  tickMs?: number;
  distanceTarget?: number;
  obstacles?: StraightObstacleObstacle[];
  timers?: StraightObstacleTimers;
}

export function createStraightObstacleRuntime(
  lobby: LobbyState,
  sessionId: string,
  options: StraightObstacleRuntimeOptions = {},
): GameRuntimeInstance<StraightObstacleSnapshot> {
  const {
    countdownMs = DEFAULT_COUNTDOWN_MS,
    tickMs = 50,
    distanceTarget,
    obstacles,
  } = options;
  const timers = options.timers ?? {};
  const now = timers.now ?? (() => Date.now());
  const scheduleInterval =
    timers.setInterval ??
    ((callback: () => void, delayMs: number) => {
      const timer = setInterval(callback, delayMs);

      timer.unref?.();

      return timer;
    });
  const cancelInterval =
    timers.clearInterval ??
    ((timer: IntervalHandle) => {
      clearInterval(timer);
    });
  const scheduleTimeout =
    timers.setTimeout ??
    ((callback: () => void, delayMs: number) => {
      const timer = setTimeout(callback, delayMs);

      timer.unref?.();

      return timer;
    });
  const cancelTimeout =
    timers.clearTimeout ??
    ((timer: TimeoutHandle) => {
      clearTimeout(timer);
    });
  const lobbyPlayers = lobby.players.filter(
    (player) => player.connectionState === PLAYER_CONNECTION_STATE.connected,
  );
  const activePlayerIds = new Set(lobbyPlayers.map((player) => player.id));
  const latestIntentByPlayerId = new Map<string, { steerX: number }>();
  const lastSequenceByPlayerId = new Map<string, number>();

  let startedAtMs: number | null = null;
  let lastAdvancedAtMs: number | null = null;
  let tick = 0;
  let intervalTimer: IntervalHandle | null = null;
  let countdownTimer: TimeoutHandle | null = null;
  let finishedEmitted = false;
  let ruleState: StraightObstacleRuleState = createInitialStraightObstacleState({
    players: lobbyPlayers.map((player) => ({
      playerId: player.id,
      nickname: player.nickname,
    })),
    distanceTarget,
    obstacles,
  });

  let state: GameSessionEnvelope<StraightObstacleSnapshot> = {
    sessionId,
    lobbyCode: lobby.code,
    game: 'race',
    variant: 'straight-obstacle',
    status: GAME_SESSION_STATUS.countdown,
    countdown: Math.ceil(countdownMs / 1000),
    state: createSnapshot(RACE_STATUS.countdown, Math.ceil(countdownMs / 1000)),
    results: null,
  };

  function createSnapshot(
    status: RaceStatus,
    countdown: number | null,
  ): StraightObstacleSnapshot {
    return {
      sessionId,
      lobbyCode: lobby.code,
      trackId: TRACK_ID,
      mode: 'straight-obstacle',
      status,
      tick,
      startedAt: startedAtMs,
      countdown,
      distanceTarget: ruleState.distanceTarget,
      serverTimeMs: now(),
      warning: ruleState.warning,
      playersState: ruleState.players.map((player) => ({ ...player })),
      activeObstacles: getPreviewObstacles().map((obstacle) => ({
        ...obstacle,
        hitPlayerIds: [...obstacle.hitPlayerIds],
      })),
    };
  }

  function getPreviewObstacles() {
    if (ruleState.players.length === 0) {
      return [];
    }

    const distances = ruleState.players.map((player) => player.distance);
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);

    return ruleState.obstacles.filter(
      (obstacle) =>
        obstacle.distance >= minDistance - OBSTACLE_PREVIEW_BACKFILL &&
        obstacle.distance <= maxDistance + OBSTACLE_PREVIEW_DISTANCE,
    );
  }

  function setState(status: RaceStatus, results: GameResults | null = state.results) {
    state = {
      ...state,
      status:
        status === RACE_STATUS.finished
          ? GAME_SESSION_STATUS.finished
          : status === RACE_STATUS.racing
            ? GAME_SESSION_STATUS.active
            : GAME_SESSION_STATUS.countdown,
      countdown: status === RACE_STATUS.countdown ? state.countdown : 0,
      results,
      state: createSnapshot(status, status === RACE_STATUS.countdown ? state.countdown : 0),
    };

    return state;
  }

  function emitState() {
    options.onState?.(state);

    return state;
  }

  function clearCountdownTimer() {
    if (countdownTimer === null) {
      return;
    }

    cancelTimeout(countdownTimer);
    countdownTimer = null;
  }

  function clearTickTimer() {
    if (intervalTimer === null) {
      return;
    }

    cancelInterval(intervalTimer);
    intervalTimer = null;
  }

  function startTickTimer() {
    if (intervalTimer !== null || state.state.status !== RACE_STATUS.racing) {
      return;
    }

    intervalTimer = scheduleInterval(() => {
      advanceRaceToNow();
    }, tickMs);
  }

  function activateRace() {
    const currentTimeMs = now();

    clearCountdownTimer();
    startedAtMs = currentTimeMs;
    lastAdvancedAtMs = currentTimeMs;
    tick = 0;
    setState(RACE_STATUS.racing, null);
    emitState();
    startTickTimer();

    return state;
  }

  function advanceRaceToNow() {
    if (state.state.status !== RACE_STATUS.racing) {
      return state;
    }

    const currentTimeMs = now();
    const previousTimeMs = lastAdvancedAtMs ?? startedAtMs ?? currentTimeMs;
    const deltaMs = Math.max(0, currentTimeMs - previousTimeMs);

    ruleState = advanceStraightObstacleRace(ruleState, latestIntentByPlayerId, {
      nowMs: currentTimeMs,
      elapsedMs:
        startedAtMs === null ? 0 : Math.max(0, currentTimeMs - startedAtMs),
      deltaMs,
    });
    lastAdvancedAtMs = currentTimeMs;
    tick += 1;

    if (ruleState.players.length > 0 && ruleState.players.every((player) => player.status === 'finished')) {
      return finishRace();
    }

    setState(RACE_STATUS.racing, null);
    emitState();

    return state;
  }

  function finishRace() {
    if (state.status === GAME_SESSION_STATUS.finished) {
      return state;
    }

    const results = buildStraightObstacleResults(ruleState);

    clearTickTimer();
    setState(RACE_STATUS.finished, results);
    emitState();

    if (!finishedEmitted) {
      finishedEmitted = true;
      const payload: SessionFinishedPayload = {
        sessionId,
        lobbyCode: lobby.code,
        game: 'race',
        variant: 'straight-obstacle',
        results,
      };

      options.onFinished?.(payload);
    }

    return state;
  }

  function readStraightObstacleInput(input: GameInputPayload) {
    if (
      typeof input !== 'object' ||
      input === null ||
      !('mode' in input) ||
      input.mode !== 'straight-obstacle' ||
      !('kind' in input) ||
      input.kind !== 'steer'
    ) {
      return null;
    }

    const sequence = input.sequence;
    const steerX = input.steerX;

    if (
      typeof sequence !== 'number' ||
      !Number.isFinite(sequence) ||
      sequence < 0 ||
      typeof steerX !== 'number' ||
      !Number.isFinite(steerX)
    ) {
      return null;
    }

    return {
      sequence,
      steerX: clampSteerX(steerX),
    };
  }

  return {
    sessionId,
    lobbyCode: lobby.code,
    start() {
      if (countdownMs <= 0) {
        return activateRace();
      }

      emitState();
      countdownTimer = scheduleTimeout(() => {
        activateRace();
      }, countdownMs);

      return state;
    },
    applyInput(playerId, input) {
      if (state.state.status !== RACE_STATUS.racing || !activePlayerIds.has(playerId)) {
        return state;
      }

      const steeringInput = readStraightObstacleInput(input);

      if (steeringInput === null) {
        return state;
      }

      if (steeringInput.sequence <= (lastSequenceByPlayerId.get(playerId) ?? -1)) {
        return state;
      }

      lastSequenceByPlayerId.set(playerId, steeringInput.sequence);
      latestIntentByPlayerId.set(playerId, { steerX: steeringInput.steerX });

      return state;
    },
    removePlayer(playerId) {
      if (!activePlayerIds.has(playerId)) {
        return;
      }

      activePlayerIds.delete(playerId);
      latestIntentByPlayerId.delete(playerId);
      lastSequenceByPlayerId.delete(playerId);
      ruleState = {
        ...ruleState,
        players: ruleState.players.filter((player) => player.playerId !== playerId),
      };

      if (
        state.state.status === RACE_STATUS.racing &&
        ruleState.players.length > 0 &&
        ruleState.players.every((player) => player.status === 'finished')
      ) {
        finishRace();
        return;
      }

      setState(state.state.status, state.results);
      emitState();
    },
    dispose() {
      clearCountdownTimer();
      clearTickTimer();
    },
  };
}
