import {
  GAME_SESSION_STATUS,
  type GameInputPayload,
  type GameSessionEnvelope,
  type LobbyState,
  type SessionFinishedPayload,
} from '@blitz/shared';

import type { GameRuntimeInstance, RuntimeCallbacks } from '../runtime.js';

const DEFAULT_COUNTDOWN_MS = 3_000;
const DEFAULT_REVEAL_MS = 1_600;

type TimerHandle = ReturnType<typeof setTimeout> | null;
type PenaltyLane = 'left' | 'center' | 'right';
type PenaltyShot = 'power' | 'placement';

interface KickChoice {
  lane: PenaltyLane;
  shot: PenaltyShot;
}

interface KeeperChoice {
  dive: PenaltyLane;
}

export interface PenaltyRuntimeOptions extends RuntimeCallbacks<PenaltySessionState> {
  countdownMs?: number;
  revealMs?: number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (timer: Exclude<TimerHandle, null>) => void;
}

export interface PenaltyPlayerState {
  playerId: string;
  nickname: string;
  goals: number;
  saves: number;
}

export interface PenaltyResolution {
  lane: PenaltyLane;
  shot: PenaltyShot;
  dive: PenaltyLane;
  goal: boolean;
  save: boolean;
}

export interface PenaltySessionState extends Record<string, unknown> {
  phase: 'countdown' | 'select' | 'reveal' | 'finished';
  turn: number;
  totalTurns: number;
  activeKickerId: string | null;
  activeKeeperId: string | null;
  waitingFor: string[];
  lockedChoices: {
    kicker: boolean;
    keeper: boolean;
  };
  players: PenaltyPlayerState[];
  lastResolution: PenaltyResolution | null;
}

function clampDelay(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value);
}

function isPenaltyLane(value: unknown): value is PenaltyLane {
  return value === 'left' || value === 'center' || value === 'right';
}

function isPenaltyShot(value: unknown): value is PenaltyShot {
  return value === 'power' || value === 'placement';
}

function readKickChoice(input: GameInputPayload): KickChoice | null {
  if (!isPenaltyLane(input.lane) || !isPenaltyShot(input.shot)) {
    return null;
  }

  return {
    lane: input.lane,
    shot: input.shot,
  };
}

function readKeeperChoice(input: GameInputPayload): KeeperChoice | null {
  if (!isPenaltyLane(input.dive)) {
    return null;
  }

  return {
    dive: input.dive,
  };
}

function createPlayers(lobby: LobbyState): PenaltyPlayerState[] {
  return lobby.players.map((player) => ({
    playerId: player.id,
    nickname: player.nickname,
    goals: 0,
    saves: 0,
  }));
}

function buildRankings(players: PenaltyPlayerState[]) {
  return [...players]
    .sort((left, right) => {
      if (left.goals !== right.goals) {
        return right.goals - left.goals;
      }

      return right.saves - left.saves;
    })
    .map((player, index) => ({
      playerId: player.playerId,
      rank: index + 1,
      label: `${player.goals} gol · ${player.saves} parate`,
      value: player.goals,
    }));
}

export function createPenaltyRuntime(
  lobby: LobbyState,
  sessionId: string,
  options: PenaltyRuntimeOptions = {},
): GameRuntimeInstance {
  const countdownMs = options.countdownMs ?? DEFAULT_COUNTDOWN_MS;
  const revealMs = options.revealMs ?? DEFAULT_REVEAL_MS;
  const schedule =
    options.schedule ??
    ((callback: () => void, delayMs: number) => setTimeout(callback, delayMs));
  const cancel =
    options.cancel ??
    ((timer: Exclude<TimerHandle, null>) => {
      clearTimeout(timer);
    });
  const players = createPlayers(lobby);
  const totalTurns = Math.max(players.length, 2) * (lobby.settings.rounds ?? 3);

  let phaseTimer: TimerHandle = null;
  let kickChoice: KickChoice | null = null;
  let keeperChoice: KeeperChoice | null = null;
  let state: GameSessionEnvelope<PenaltySessionState> = {
    sessionId,
    lobbyCode: lobby.code,
    game: 'penalty',
    variant: null,
    status: GAME_SESSION_STATUS.countdown,
    countdown: Math.ceil(countdownMs / 1000),
    results: null,
    state: {
      phase: 'countdown',
      turn: 1,
      totalTurns,
      activeKickerId: players[0]?.playerId ?? null,
      activeKeeperId: players[1]?.playerId ?? null,
      waitingFor: [players[0]?.playerId, players[1]?.playerId].filter(Boolean) as string[],
      lockedChoices: {
        kicker: false,
        keeper: false,
      },
      players,
      lastResolution: null,
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

  const activateTurn = (turn: number) => {
    const kickerIndex = (turn - 1) % players.length;
    const keeperIndex = turn % players.length;

    kickChoice = null;
    keeperChoice = null;
    state = {
      ...state,
      status: GAME_SESSION_STATUS.active,
      countdown: null,
      state: {
        ...state.state,
        phase: 'select',
        turn,
        activeKickerId: players[kickerIndex]?.playerId ?? null,
        activeKeeperId: players[keeperIndex]?.playerId ?? null,
        waitingFor: [players[kickerIndex]?.playerId, players[keeperIndex]?.playerId].filter(
          Boolean,
        ) as string[],
        lockedChoices: {
          kicker: false,
          keeper: false,
        },
        lastResolution: null,
      },
    };
    emitState();
  };

  const finalizeSession = () => {
    state = {
      ...state,
      status: GAME_SESSION_STATUS.finished,
      countdown: null,
      results: {
        rankings: buildRankings(state.state.players),
        summary: {
          turns: totalTurns,
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
      game: 'penalty',
      variant: null,
      results: state.results!,
    };

    options.onFinished?.(payload);
  };

  const resolveTurn = () => {
    if (!kickChoice || !keeperChoice) {
      return;
    }

    const goal = kickChoice.lane !== keeperChoice.dive;
    const save = !goal;
    const kickerId = state.state.activeKickerId;
    const keeperId = state.state.activeKeeperId;

    state = {
      ...state,
      status: state.state.turn >= totalTurns ? GAME_SESSION_STATUS.finished : GAME_SESSION_STATUS.active,
      countdown: null,
      state: {
        ...state.state,
        phase: state.state.turn >= totalTurns ? 'finished' : 'reveal',
        waitingFor: [],
        lockedChoices: {
          kicker: true,
          keeper: true,
        },
        players: state.state.players.map((player) => {
          if (goal && player.playerId === kickerId) {
            return {
              ...player,
              goals: player.goals + 1,
            };
          }

          if (save && player.playerId === keeperId) {
            return {
              ...player,
              saves: player.saves + 1,
            };
          }

          return player;
        }),
        lastResolution: {
          lane: kickChoice.lane,
          shot: kickChoice.shot,
          dive: keeperChoice.dive,
          goal,
          save,
        },
      },
    };

    emitState();

    if (state.state.turn >= totalTurns) {
      finalizeSession();
      return;
    }

    queue(() => {
      activateTurn(state.state.turn + 1);
    }, revealMs);
  };

  return {
    sessionId,
    lobbyCode: lobby.code,
    start() {
      if (countdownMs > 0) {
        emitState();
        queue(() => activateTurn(1), countdownMs);
        return state;
      }

      activateTurn(1);
      return state;
    },
    applyInput(playerId, input) {
      if (state.status === GAME_SESSION_STATUS.finished || state.state.phase !== 'select') {
        return state;
      }

      if (playerId === state.state.activeKickerId && !kickChoice) {
        const nextKick = readKickChoice(input);

        if (!nextKick) {
          return state;
        }

        kickChoice = nextKick;
        state = {
          ...state,
          state: {
            ...state.state,
            waitingFor: state.state.waitingFor.filter((candidate) => candidate !== playerId),
            lockedChoices: {
              ...state.state.lockedChoices,
              kicker: true,
            },
          },
        };
        emitState();
      }

      if (playerId === state.state.activeKeeperId && !keeperChoice) {
        const nextKeeper = readKeeperChoice(input);

        if (!nextKeeper) {
          return state;
        }

        keeperChoice = nextKeeper;
        state = {
          ...state,
          state: {
            ...state.state,
            waitingFor: state.state.waitingFor.filter((candidate) => candidate !== playerId),
            lockedChoices: {
              ...state.state.lockedChoices,
              keeper: true,
            },
          },
        };
        emitState();
      }

      if (kickChoice && keeperChoice) {
        resolveTurn();
      }

      return state;
    },
    removePlayer(playerId) {
      state = {
        ...state,
        state: {
          ...state.state,
          players: state.state.players.filter((player) => player.playerId !== playerId),
          waitingFor: state.state.waitingFor.filter((candidate) => candidate !== playerId),
        },
      };
      emitState();
    },
    dispose() {
      clearPhaseTimer();
    },
  };
}
