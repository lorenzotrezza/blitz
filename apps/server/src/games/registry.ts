import type { LobbyState, PartyGame, PartyGameVariant } from '@blitz/shared';

import { createLightsRuntime } from './lights/runtime.js';
import { createPenaltyRuntime } from './penalty/runtime.js';
import { createDragSprintRuntime } from './race/dragSprint.js';
import { createSprintCircuitRuntime } from './race/sprintCircuit.js';
import type { GameRuntimeFactory } from './runtime.js';

export interface GameRegistryEntry {
  key: string;
  game: PartyGame;
  variant: PartyGameVariant;
  countdown: number | null;
  createRuntime?: GameRuntimeFactory;
}

export interface GameRuntimeRegistry {
  list(): GameRegistryEntry[];
  resolve(game: PartyGame, variant: PartyGameVariant): GameRegistryEntry | null;
}

const DEFAULT_GAME_REGISTRY: GameRegistryEntry[] = [
  {
    key: 'lights',
    game: 'lights',
    variant: null,
    countdown: 3,
    createRuntime(lobby: LobbyState, sessionId: string, callbacks) {
      return createLightsRuntime(lobby, sessionId, {
        onState(payload) {
          callbacks.onState?.(payload);
        },
        onFinished(payload) {
          callbacks.onFinished?.(payload);
        },
      });
    },
  },
  {
    key: 'penalty',
    game: 'penalty',
    variant: null,
    countdown: 3,
    createRuntime(lobby: LobbyState, sessionId: string, callbacks) {
      return createPenaltyRuntime(lobby, sessionId, {
        onState(payload) {
          callbacks.onState?.(payload);
        },
        onFinished(payload) {
          callbacks.onFinished?.(payload);
        },
      });
    },
  },
  {
    key: 'race:sprint-circuit',
    game: 'race',
    variant: 'sprint-circuit',
    countdown: 3,
    createRuntime(lobby: LobbyState, sessionId: string, callbacks) {
      return createSprintCircuitRuntime(lobby, sessionId, {
        onState(payload) {
          callbacks.onState?.(payload);
        },
        onFinished(payload) {
          callbacks.onFinished?.(payload);
        },
      });
    },
  },
  {
    key: 'race:drag-sprint',
    game: 'race',
    variant: 'drag-sprint',
    countdown: 3,
    createRuntime(lobby: LobbyState, sessionId: string, callbacks) {
      return createDragSprintRuntime(lobby, sessionId, {
        onState(payload) {
          callbacks.onState?.(payload);
        },
        onFinished(payload) {
          callbacks.onFinished?.(payload);
        },
      });
    },
  },
];

export function createGameRuntimeRegistry(
  entries: GameRegistryEntry[] = DEFAULT_GAME_REGISTRY,
): GameRuntimeRegistry {
  return {
    list() {
      return [...entries];
    },
    resolve(game, variant) {
      return (
        entries.find((entry) => entry.game === game && entry.variant === variant) ??
        null
      );
    },
  };
}
