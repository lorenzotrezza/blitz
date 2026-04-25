import type { DragSprintMode } from './game.js';

export const MAX_LOBBY_PLAYERS = 8;

export const PARTY_MODES = {
  single: 'single',
  multiplayer: 'multiplayer',
} as const;

export type PartyMode = (typeof PARTY_MODES)[keyof typeof PARTY_MODES];

export const PARTY_GAMES = {
  lights: 'lights',
  penalty: 'penalty',
  race: 'race',
} as const;

export type PartyGame = (typeof PARTY_GAMES)[keyof typeof PARTY_GAMES];

export const PARTY_GAME_VARIANTS = {
  sprintCircuit: 'sprint-circuit',
  trafficSurvival: 'traffic-survival',
  dragSprint: 'drag-sprint',
} as const;

export const LOBBY_RACE_MODES = {
  finishLine: 'finish-line',
  bestOf3: 'best-of-3',
  survival: 'survival',
} as const satisfies Record<string, DragSprintMode>;

export type PartyGameVariant =
  | (typeof PARTY_GAME_VARIANTS)[keyof typeof PARTY_GAME_VARIANTS]
  | null;

export const LOBBY_STATUS = {
  waiting: 'waiting',
  countdown: 'countdown',
  inSession: 'in-session',
  results: 'results',
} as const;

export type LobbyStatus = (typeof LOBBY_STATUS)[keyof typeof LOBBY_STATUS];

export const PLAYER_CONNECTION_STATE = {
  connected: 'connected',
  disconnected: 'disconnected',
} as const;

export type PlayerConnectionState =
  (typeof PLAYER_CONNECTION_STATE)[keyof typeof PLAYER_CONNECTION_STATE];

export interface PlayerInfo {
  id: string;
  nickname: string;
  carId: string;
  ready: boolean;
  connectionState: PlayerConnectionState;
}

export interface LobbySettings {
  maxPlayers: number;
  trackId?: string | null;
  botCount?: number;
  rounds?: number | null;
  laps?: number | null;
  raceMode?: DragSprintMode | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface PartyLobbyState {
  code: string;
  hostId: string;
  mode: PartyMode;
  selectedGame: PartyGame;
  selectedVariant: PartyGameVariant;
  players: PlayerInfo[];
  settings: LobbySettings;
  status: LobbyStatus;
}

export type LobbyState = PartyLobbyState;

export function isLobbySelectionStartable(
  game: PartyGame,
  variant: PartyGameVariant,
): boolean {
  if (game !== PARTY_GAMES.race) {
    return true;
  }

  return variant === PARTY_GAME_VARIANTS.sprintCircuit;
}
