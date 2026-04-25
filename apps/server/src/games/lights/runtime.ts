import {
  GAME_SESSION_STATUS,
  type GameInputPayload,
  type GameSessionEnvelope,
  type GameResultEntry,
  type LobbyState,
  type SessionFinishedPayload,
} from '@blitz/shared';

import type { GameRuntimeInstance, RuntimeCallbacks } from '../runtime.js';

const DEFAULT_COUNTDOWN_MS = 3_000;
const DEFAULT_REACTION_WINDOW_MS = 1_500;
const DEFAULT_REVEAL_MS = 1_200;
const DEFAULT_INTER_ROUND_MS = 800;
const FALSE_START_PENALTY_MS = 1_000;

type TimerHandle = ReturnType<typeof setTimeout> | null;

export interface LightsRuntimeOptions extends RuntimeCallbacks<LightsSessionState> {
  countdownMs?: number;
  randomDelayMs?: () => number;
  reactionWindowMs?: number;
  revealMs?: number;
  interRoundMs?: number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}

export interface LightsPlayerState {
  playerId: string;
  nickname: string;
  status: 'waiting' | 'reacted' | 'false-start' | 'timeout';
  lastReactionMs: number | null;
  falseStarts: number;
  totalScoreMs: number;
  roundWins: number;
}

export interface LightsRoundResultEntry {
  playerId: string;
  nickname: string;
  rank: number;
  label: string;
  reactionMs: number | null;
}

export interface LightsSessionState extends Record<string, unknown> {
  phase: 'countdown' | 'armed' | 'go' | 'round-result' | 'finished';
  round: number;
  totalRounds: number;
  goAtMs: number | null;
  reactionWindowMs: number;
  players: LightsPlayerState[];
  roundResults: LightsRoundResultEntry[] | null;
}

function clampDelay(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value);
}

function readReactionAtMs(input: GameInputPayload): number | null {
  const value = input.reactionAtMs;

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value);
}

function createPlayerState(lobby: LobbyState): LightsPlayerState[] {
  return lobby.players.map((player) => ({
    playerId: player.id,
    nickname: player.nickname,
    status: 'waiting',
    lastReactionMs: null,
    falseStarts: 0,
    totalScoreMs: 0,
    roundWins: 0,
  }));
}

function resetRoundPlayers(players: LightsPlayerState[]): LightsPlayerState[] {
  return players.map((player) => ({
    ...player,
    status: 'waiting',
    lastReactionMs: null,
  }));
}

function buildRanking(players: LightsPlayerState[], totalRounds: number): GameResultEntry[] {
  return [...players]
    .sort((left, right) => {
      if (left.totalScoreMs !== right.totalScoreMs) {
        return left.totalScoreMs - right.totalScoreMs;
      }

      if (left.falseStarts !== right.falseStarts) {
        return left.falseStarts - right.falseStarts;
      }

      return right.roundWins - left.roundWins;
    })
    .map((player, index) => {
      const averageMs = Math.round(player.totalScoreMs / Math.max(1, totalRounds));
      const falseStartLabel =
        player.falseStarts > 0
          ? ` · ${player.falseStarts} false start`
          : '';

      return {
        playerId: player.playerId,
        rank: index + 1,
        label: `${averageMs} ms media${falseStartLabel}`,
        value: averageMs,
      };
    });
}

export function createLightsRuntime(
  lobby: LobbyState,
  sessionId: string,
  options: LightsRuntimeOptions = {},
): GameRuntimeInstance {
  const totalRounds = lobby.settings.rounds ?? 3;
  const countdownMs = options.countdownMs ?? DEFAULT_COUNTDOWN_MS;
  const reactionWindowMs = options.reactionWindowMs ?? DEFAULT_REACTION_WINDOW_MS;
  const revealMs = options.revealMs ?? DEFAULT_REVEAL_MS;
  const interRoundMs = options.interRoundMs ?? DEFAULT_INTER_ROUND_MS;
  const randomDelayMs = options.randomDelayMs ?? (() => 1_300 + Math.round(Math.random() * 1_400));
  const schedule =
    options.schedule ??
    ((callback: () => void, delayMs: number) => setTimeout(callback, delayMs));
  const cancel =
    options.cancel ??
    ((timer: Exclude<TimerHandle, null>) => {
      clearTimeout(timer);
    });

  let phaseTimer: TimerHandle = null;
  let state: GameSessionEnvelope<LightsSessionState> = {
    sessionId,
    lobbyCode: lobby.code,
    game: 'lights',
    variant: null,
    status: GAME_SESSION_STATUS.countdown,
    countdown: Math.ceil(countdownMs / 1000),
    results: null,
    state: {
      phase: 'countdown',
      round: 1,
      totalRounds,
      goAtMs: null,
      reactionWindowMs,
      players: createPlayerState(lobby),
      roundResults: null,
    },
  };

  const clearPhaseTimer = () => {
    if (!phaseTimer) {
      return;
    }

    cancel(phaseTimer);
    phaseTimer = null;
  };

  const emitState = () => {
    options.onState?.(state);
    return state;
  };

  const queue = (callback: () => void, delayMs: number) => {
    clearPhaseTimer();
    const effectiveDelay = clampDelay(delayMs);

    if (effectiveDelay <= 0) {
      callback();
      return;
    }

    phaseTimer = schedule(callback, effectiveDelay);
  };

  const finalizeSession = () => {
    state = {
      ...state,
      status: GAME_SESSION_STATUS.finished,
      countdown: null,
      results: {
        rankings: buildRanking(state.state.players, totalRounds),
        summary: {
          rounds: totalRounds,
        },
      },
      state: {
        ...state.state,
        phase: 'finished',
      },
    };

    emitState();

    const payload: SessionFinishedPayload = {
      sessionId,
      lobbyCode: lobby.code,
      game: 'lights',
      variant: null,
      results: state.results!,
    };

    options.onFinished?.(payload);
  };

  const finalizeRound = () => {
    if (state.state.phase === 'finished' || state.state.phase === 'round-result') {
      return;
    }

    const scoredPlayers = state.state.players.map((player) => {
      if (player.status === 'reacted' && player.lastReactionMs !== null) {
        return {
          ...player,
          totalScoreMs: player.totalScoreMs + player.lastReactionMs,
        };
      }

      if (player.status === 'false-start') {
        return {
          ...player,
          totalScoreMs: player.totalScoreMs + reactionWindowMs + FALSE_START_PENALTY_MS,
        };
      }

      return {
        ...player,
        status: 'timeout' as const,
        totalScoreMs: player.totalScoreMs + reactionWindowMs + FALSE_START_PENALTY_MS,
      };
    });

    const roundStandings = [...scoredPlayers]
      .sort((left, right) => {
        const leftScore =
          left.status === 'reacted' && left.lastReactionMs !== null
            ? left.lastReactionMs
            : reactionWindowMs + FALSE_START_PENALTY_MS;
        const rightScore =
          right.status === 'reacted' && right.lastReactionMs !== null
            ? right.lastReactionMs
            : reactionWindowMs + FALSE_START_PENALTY_MS;

        return leftScore - rightScore;
      })
      .map((player, index) => ({
        playerId: player.playerId,
        nickname: player.nickname,
        rank: index + 1,
        label:
          player.status === 'reacted' && player.lastReactionMs !== null
            ? `${player.lastReactionMs} ms`
            : player.status === 'false-start'
              ? 'False start'
              : 'Nessuna reazione',
        reactionMs: player.lastReactionMs,
      }));

    const winner = roundStandings.find((entry) => entry.reactionMs !== null);
    const updatedPlayers = scoredPlayers.map((player) =>
      player.playerId === winner?.playerId
        ? {
            ...player,
            roundWins: player.roundWins + 1,
          }
        : player,
    );

    const finishedRound = state.state.round;

    state = {
      ...state,
      status: finishedRound >= totalRounds ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
      countdown: null,
      state: {
        ...state.state,
        phase: finishedRound >= totalRounds ? 'finished' : 'round-result',
        players: updatedPlayers,
        roundResults: roundStandings,
      },
    };

    if (finishedRound >= totalRounds) {
      finalizeSession();
      return;
    }

    emitState();

    queue(() => {
      const nextRound = finishedRound + 1;

      state = {
        ...state,
        status: GAME_SESSION_STATUS.active,
        countdown: null,
        state: {
          ...state.state,
          phase: 'armed',
          round: nextRound,
          goAtMs: clampDelay(randomDelayMs()),
          players: resetRoundPlayers(updatedPlayers),
          roundResults: null,
        },
      };
      emitState();

      queue(() => {
        state = {
          ...state,
          status: GAME_SESSION_STATUS.active,
          state: {
            ...state.state,
            phase: 'go',
          },
        };
        emitState();
        queue(finalizeRound, reactionWindowMs);
      }, state.state.goAtMs ?? 0);
    }, revealMs + interRoundMs);
  };

  const armFirstRound = () => {
    state = {
      ...state,
      status: GAME_SESSION_STATUS.active,
      countdown: null,
      state: {
        ...state.state,
        phase: 'armed',
        round: 1,
        goAtMs: clampDelay(randomDelayMs()),
        players: resetRoundPlayers(state.state.players),
        roundResults: null,
      },
    };
    emitState();

    queue(() => {
      state = {
        ...state,
        status: GAME_SESSION_STATUS.active,
        state: {
          ...state.state,
          phase: 'go',
        },
      };
      emitState();
      queue(finalizeRound, reactionWindowMs);
    }, state.state.goAtMs ?? 0);
  };

  return {
    sessionId,
    lobbyCode: lobby.code,
    start() {
      if (countdownMs > 0) {
        emitState();
        queue(armFirstRound, countdownMs);
        return state;
      }

      armFirstRound();
      return state;
    },
    applyInput(playerId, input) {
      if (state.status === GAME_SESSION_STATUS.finished) {
        return state;
      }

      if (state.state.phase !== 'armed' && state.state.phase !== 'go') {
        return state;
      }

      const reactionAtMs = readReactionAtMs(input);

      if (reactionAtMs === null) {
        return state;
      }

      let changed = false;
      const goAtMs = state.state.goAtMs ?? 0;

      state = {
        ...state,
        state: {
          ...state.state,
          players: state.state.players.map((player) => {
            if (player.playerId !== playerId || player.status !== 'waiting') {
              return player;
            }

            changed = true;

            if (reactionAtMs < goAtMs) {
              return {
                ...player,
                status: 'false-start',
                falseStarts: player.falseStarts + 1,
              };
            }

            return {
              ...player,
              status: 'reacted',
              lastReactionMs: reactionAtMs - goAtMs,
            };
          }),
        },
      };

      if (!changed) {
        return state;
      }

      emitState();

      if (state.state.players.every((player) => player.status !== 'waiting')) {
        finalizeRound();
      }

      return state;
    },
    removePlayer(playerId) {
      state = {
        ...state,
        state: {
          ...state.state,
          players: state.state.players.filter((player) => player.playerId !== playerId),
        },
      };

      emitState();

      if (
        state.status !== GAME_SESSION_STATUS.finished &&
        state.state.players.length > 0 &&
        state.state.players.every((player) => player.status !== 'waiting')
      ) {
        finalizeRound();
      }
    },
    dispose() {
      clearPhaseTimer();
    },
  };
}
