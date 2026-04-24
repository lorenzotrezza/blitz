export const MAX_LOBBY_PLAYERS = 8;

export const LOBBY_STATUS = {
  waiting: 'waiting',
  countdown: 'countdown',
  racing: 'racing',
  finished: 'finished',
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
  trackId: string;
  botCount: number;
  maxPlayers: number;
}

export interface LobbyState {
  code: string;
  hostId: string;
  players: PlayerInfo[];
  settings: LobbySettings;
  status: LobbyStatus;
}
