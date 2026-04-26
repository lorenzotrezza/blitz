import {
  GAME_SESSION_STATUS,
  PLAYER_CONNECTION_STATE,
  RACE_STATUS,
  type GameInputPayload,
  type GameResultEntry,
  type GameSessionEnvelope,
  type LobbyState,
  type RaceStatus,
  type SessionFinishedPayload,
} from '@blitz/shared';

import type { GameRuntimeInstance, RuntimeCallbacks } from '../runtime.js';
import {
  DEFAULT_DRAG_GEAR_TUNING,
  advanceDragGearPlayer,
  applyDragGearInput,
  buildDragGearRankings,
  buildDragShiftSummary,
  createInitialDragGearPlayer,
  readDragGearInput,
  type DragGearPlayerRuleState,
  type DragGearTuning,
  type DragShiftQuality,
  type DragShiftWindow,
} from './dragGearRules.js';

const DEFAULT_COUNTDOWN_MS = 3_000;
const DRAG_RACE_TICK_MS = 50;
const TRACK_ID = 'straight-drag-gear';

type TimerHandle = ReturnType<typeof setTimeout> | null;

export interface DragGearPlayerSnapshot {
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
  shiftSummary: {
    early: number;
    good: number;
    perfect: number;
    late: number;
    total: number;
  };
  finished: boolean;
  finishTimeMs: number | null;
  rank: number | null;
}

export interface DragGearSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  status: RaceStatus;
  tick: number;
  startedAt: number | null;
  countdown: number | null;
  distanceTargetM: number;
  shiftWindow: DragShiftWindow;
  playersState: DragGearPlayerSnapshot[];
}

export interface DragSprintRuntimeOptions extends RuntimeCallbacks<DragGearSnapshot> {
  countdownMs?: number;
  distanceTarget?: number;
  now?: () => number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}

export function createDragSprintRuntime(
  lobby: LobbyState,
  sessionId: string,
  options: DragSprintRuntimeOptions = {},
): GameRuntimeInstance<DragGearSnapshot> {
  const countdownMs = options.countdownMs ?? DEFAULT_COUNTDOWN_MS;
  const distanceTargetM = Math.max(
    30,
    options.distanceTarget ?? DEFAULT_DRAG_GEAR_TUNING.distanceTargetM,
  );
  const tuning: DragGearTuning = {
    ...DEFAULT_DRAG_GEAR_TUNING,
    distanceTargetM,
    maxGear: 4,
  };
  const now = options.now ?? (() => Date.now());
  const schedule =
    options.schedule ??
    ((callback: () => void, delayMs: number) => {
      const timer = setTimeout(callback, delayMs);

      timer.unref?.();

      return timer;
    });
  const cancel =
    options.cancel ??
    ((timer: Exclude<TimerHandle, null>) => {
      clearTimeout(timer);
    });
  const lobbyPlayers = lobby.players.filter(
    (player) => player.connectionState === PLAYER_CONNECTION_STATE.connected,
  );

  let countdownTimer: TimerHandle = null;
  let raceTimer: TimerHandle = null;
  let startedAtMs: number | null = null;
  let lastAdvancedAtMs: number | null = null;
  let tick = 0;
  let finishedEmitted = false;
  const activePlayerIds = new Set(lobbyPlayers.map((player) => player.id));
  let players = lobbyPlayers.map((player) =>
    createInitialDragGearPlayer(
      {
        playerId: player.id,
        nickname: player.nickname,
      },
      tuning,
    ),
  );

  let state: GameSessionEnvelope<DragGearSnapshot> = {
    sessionId,
    lobbyCode: lobby.code,
    game: 'race',
    variant: 'drag-sprint',
    status: GAME_SESSION_STATUS.countdown,
    countdown: Math.ceil(countdownMs / 1000),
    results: null,
    state: createSnapshot(RACE_STATUS.countdown, Math.ceil(countdownMs / 1000)),
  };

  function createSnapshot(status: RaceStatus, countdown: number | null): DragGearSnapshot {
    return {
      sessionId,
      lobbyCode: lobby.code,
      trackId: 'straight-drag-gear',
      status,
      tick,
      startedAt: startedAtMs,
      countdown,
      distanceTargetM,
      shiftWindow: tuning.shiftWindow,
      playersState: players.map(toPlayerSnapshot),
    };
  }

  function toPlayerSnapshot(player: DragGearPlayerRuleState): DragGearPlayerSnapshot {
    return {
      playerId: player.playerId,
      nickname: player.nickname,
      gear: player.gear,
      maxGear: player.maxGear,
      rpm: player.rpm,
      speedKmh: player.speedKmh,
      distanceM: player.distanceM,
      distanceTargetM: player.distanceTargetM,
      throttlePressed: player.throttlePressed,
      lastShiftQuality: player.lastShiftQuality,
      shiftSummary: buildDragShiftSummary(player),
      finished: player.finished,
      finishTimeMs: player.finishTimeMs,
      rank: player.rank,
    };
  }

  function setState(status: RaceStatus, results = state.results) {
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

  function clearCountdown() {
    if (countdownTimer === null) {
      return;
    }

    cancel(countdownTimer);
    countdownTimer = null;
  }

  function clearRaceTimer() {
    if (raceTimer === null) {
      return;
    }

    cancel(raceTimer);
    raceTimer = null;
  }

  function hasActiveThrottle() {
    return players.some(
      (player) =>
        activePlayerIds.has(player.playerId) &&
        !player.finished &&
        player.throttlePressed,
    );
  }

  function scheduleRaceTick() {
    if (
      raceTimer !== null ||
      state.state.status !== RACE_STATUS.racing ||
      !hasActiveThrottle()
    ) {
      return;
    }

    raceTimer = schedule(() => {
      raceTimer = null;

      if (state.state.status !== RACE_STATUS.racing) {
        return;
      }

      advanceDragPlayersToNow();

      const finishedState = maybeFinishAfterAdvance();

      if (finishedState) {
        return;
      }

      setState(RACE_STATUS.racing, null);
      emitState();
      scheduleRaceTick();
    }, DRAG_RACE_TICK_MS);
  }

  function activateRace() {
    const currentTimeMs = now();

    startedAtMs = currentTimeMs;
    lastAdvancedAtMs = currentTimeMs;
    tick = 0;
    players = players.map((player) => ({
      ...player,
      elapsedMs: 0,
    }));
    setState(RACE_STATUS.racing, null);
    emitState();
    scheduleRaceTick();

    return state;
  }

  function advanceDragPlayersToNow() {
    if (state.state.status !== RACE_STATUS.racing) {
      return;
    }

    const currentTimeMs = now();
    const previousTimeMs = lastAdvancedAtMs ?? startedAtMs ?? currentTimeMs;
    const elapsedMs = Math.max(0, currentTimeMs - previousTimeMs);

    if (elapsedMs <= 0) {
      return;
    }

    let remainingElapsedMs = elapsedMs;

    while (remainingElapsedMs > 0) {
      const stepMs = Math.min(remainingElapsedMs, 1_000);

      players = players.map((player) =>
        activePlayerIds.has(player.playerId)
          ? advanceDragGearPlayer(player, stepMs, tuning, player.elapsedMs)
          : player,
      );
      remainingElapsedMs -= stepMs;
    }

    lastAdvancedAtMs = currentTimeMs;
    tick += 1;
  }

  function updateRanks(rankings: GameResultEntry[]) {
    const rankByPlayerId = new Map(
      rankings.map((ranking) => [ranking.playerId, ranking.rank] as const),
    );

    players = players.map((player) => ({
      ...player,
      rank: rankByPlayerId.get(player.playerId) ?? null,
    }));
  }

  function buildResults(winner: DragGearPlayerRuleState) {
    const summary = buildDragShiftSummary(winner);

    return {
      rankings: buildDragGearRankings(players),
      summary: {
        mode: 'drag-gear',
        track: TRACK_ID,
        distanceTargetM,
        finishTimeMs: winner.finishTimeMs,
        perfectShifts: summary.perfect,
        goodShifts: summary.good,
        earlyShifts: summary.early,
        lateShifts: summary.late,
        totalShifts: summary.total,
      },
    };
  }

  function finishRace(winner: DragGearPlayerRuleState) {
    if (state.status === GAME_SESSION_STATUS.finished) {
      return state;
    }

    const results = buildResults(winner);

    clearRaceTimer();
    updateRanks(results.rankings);
    setState(RACE_STATUS.finished, results);
    emitState();

    if (!finishedEmitted) {
      finishedEmitted = true;
      const payload: SessionFinishedPayload = {
        sessionId,
        lobbyCode: lobby.code,
        game: 'race',
        variant: 'drag-sprint',
        results,
      };

      options.onFinished?.(payload);
    }

    return state;
  }

  function maybeFinishAfterAdvance() {
    const winner = players.find((player) => player.finished);

    if (winner) {
      return finishRace(winner);
    }

    return null;
  }

  function updatePlayer(playerId: string, nextPlayer: DragGearPlayerRuleState) {
    players = players.map((player) =>
      player.playerId === playerId ? nextPlayer : player,
    );
  }

  return {
    sessionId,
    lobbyCode: lobby.code,
    start() {
      if (countdownMs <= 0) {
        return activateRace();
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

      const player = players.find((entry) => entry.playerId === playerId);

      if (!player || !activePlayerIds.has(playerId)) {
        return state;
      }

      const dragInput = readDragGearInput(input);

      if (dragInput === null) {
        return state;
      }

      // Advance all held-throttle physics before scoring drag-shift timing.
      advanceDragPlayersToNow();

      const advancedFinish = maybeFinishAfterAdvance();

      if (advancedFinish) {
        return advancedFinish;
      }

      const updatedPlayer = players.find((entry) => entry.playerId === playerId);

      if (!updatedPlayer) {
        return state;
      }

      const nextPlayer = applyDragGearInput(
        {
          status: state.state.status,
          player: updatedPlayer,
        },
        dragInput,
        tuning,
      );

      updatePlayer(playerId, nextPlayer);

      const inputFinish = maybeFinishAfterAdvance();

      if (inputFinish) {
        return inputFinish;
      }

      tick += 1;
      setState(RACE_STATUS.racing, null);
      emitState();
      scheduleRaceTick();

      return state;
    },
    removePlayer(playerId) {
      const player = players.find((entry) => entry.playerId === playerId);

      if (!player) {
        return;
      }

      updatePlayer(playerId, {
        ...player,
        throttlePressed: false,
      });
      activePlayerIds.delete(playerId);
      clearRaceTimer();

      const remainingRacers = players.filter(
        (entry) => activePlayerIds.has(entry.playerId) && !entry.finished,
      );

      if (
        state.state.status === RACE_STATUS.racing &&
        activePlayerIds.size > 0 &&
        remainingRacers.length === 0
      ) {
        const winner =
          players.find((entry) => activePlayerIds.has(entry.playerId) && entry.finished) ??
          players.find((entry) => entry.finished);

        if (winner) {
          finishRace(winner);
          return;
        }
      }

      setState(state.state.status, state.results);
      emitState();
      scheduleRaceTick();
    },
    dispose() {
      clearCountdown();
      clearRaceTimer();
    },
  };
}
