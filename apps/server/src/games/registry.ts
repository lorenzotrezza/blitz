import type { PartyGame, PartyGameVariant } from '@blitz/shared';

export interface GameRegistryEntry {
  key: string;
  game: PartyGame;
  variant: PartyGameVariant;
  countdown: number | null;
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
  },
  {
    key: 'penalty',
    game: 'penalty',
    variant: null,
    countdown: 3,
  },
  {
    key: 'race:sprint-circuit',
    game: 'race',
    variant: 'sprint-circuit',
    countdown: 3,
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
