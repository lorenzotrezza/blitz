import type { PlayerInput, RaceSnapshot } from './game.js';
import type {
  LobbySettings,
  LobbyState,
  PartyGame,
  PartyGameVariant,
} from './lobby.js';

export const SOCKET_EVENTS = {
  client: {
    createLobby: 'client:create-lobby',
    joinLobby: 'client:join-lobby',
    leaveLobby: 'client:leave-lobby',
    setReady: 'client:set-ready',
    kickPlayer: 'client:kick-player',
    selectGame: 'client:select-game',
    updateLobbySettings: 'client:update-lobby-settings',
    startSession: 'client:start-session',
    gameInput: 'client:game-input',
    postGameAction: 'client:post-game-action',
    startRace: 'client:start-race',
    playerInput: 'client:player-input',
  },
  server: {
    lobbyUpdated: 'server:lobby-updated',
    lobbyError: 'server:lobby-error',
    sessionStarted: 'server:session-started',
    sessionState: 'server:session-state',
    sessionFinished: 'server:session-finished',
    postGameUpdated: 'server:post-game-updated',
    raceStarted: 'server:race-started',
    raceSnapshot: 'server:race-snapshot',
    raceFinished: 'server:race-finished',
  },
} as const;

export interface CreateLobbyPayload {
  nickname: string;
  carId: string;
}

export interface JoinLobbyPayload extends CreateLobbyPayload {
  code: string;
}

export interface LeaveLobbyPayload {
  code: string;
}

export interface SetReadyPayload {
  ready: boolean;
}

export interface KickPlayerPayload {
  code: string;
  playerId: string;
}

export interface SelectGamePayload {
  code: string;
  game: PartyGame;
  variant: PartyGameVariant;
}

export interface UpdateLobbySettingsPayload {
  code: string;
  settings: Partial<LobbySettings>;
}

export interface StartSessionPayload {
  code: string;
}

export interface StartRacePayload {
  code: string;
}

export type GameInputPayload = Record<string, unknown>;

export interface LobbyErrorPayload {
  code: string;
  message: string;
}

export const GAME_SESSION_STATUS = {
  countdown: 'countdown',
  active: 'active',
  finished: 'finished',
} as const;

export type GameSessionStatus =
  (typeof GAME_SESSION_STATUS)[keyof typeof GAME_SESSION_STATUS];

export interface GameResultEntry {
  playerId: string;
  rank: number;
  label?: string | null;
  value?: number | null;
}

export interface GameResults {
  rankings: GameResultEntry[];
  summary?: Record<string, string | number | boolean | null>;
}

export interface GameSessionEnvelope<TState = GameInputPayload | null> {
  sessionId: string;
  lobbyCode: string;
  game: PartyGame;
  variant: PartyGameVariant;
  status: GameSessionStatus;
  countdown: number | null;
  state: TState;
  results: GameResults | null;
}

export interface SessionStartedPayload {
  sessionId: string;
  lobbyCode: string;
  game: PartyGame;
  variant: PartyGameVariant;
  countdown: number | null;
}

export interface PostGameActionPayload {
  code: string;
  action: 'rematch' | 'return-to-lobby' | 'change-game';
}

export interface PostGameUpdatePayload {
  action: PostGameActionPayload['action'];
  lobby: LobbyState;
}

export interface SessionFinishedPayload {
  sessionId: string;
  lobbyCode: string;
  game: PartyGame;
  variant: PartyGameVariant;
  results: GameResults;
}

export interface RaceStartedPayload {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  countdown: number | null;
}

export interface RaceStanding {
  entrantId: string;
  entrantType: 'player' | 'bot';
  position: number;
  finishTimeMs: number | null;
}

export interface RaceFinishedPayload {
  sessionId: string;
  lobbyCode: string;
  standings: RaceStanding[];
}

export type ClientToServerEvents = {
  [SOCKET_EVENTS.client.createLobby]: (payload: CreateLobbyPayload) => void;
  [SOCKET_EVENTS.client.joinLobby]: (payload: JoinLobbyPayload) => void;
  [SOCKET_EVENTS.client.leaveLobby]: (payload: LeaveLobbyPayload) => void;
  [SOCKET_EVENTS.client.setReady]: (payload: SetReadyPayload) => void;
  [SOCKET_EVENTS.client.kickPlayer]: (payload: KickPlayerPayload) => void;
  [SOCKET_EVENTS.client.selectGame]: (payload: SelectGamePayload) => void;
  [SOCKET_EVENTS.client.updateLobbySettings]: (payload: UpdateLobbySettingsPayload) => void;
  [SOCKET_EVENTS.client.startSession]: (payload: StartSessionPayload) => void;
  [SOCKET_EVENTS.client.gameInput]: (payload: GameInputPayload) => void;
  [SOCKET_EVENTS.client.postGameAction]: (payload: PostGameActionPayload) => void;
  [SOCKET_EVENTS.client.startRace]: (payload: StartRacePayload) => void;
  [SOCKET_EVENTS.client.playerInput]: (payload: PlayerInput) => void;
};

export type ServerToClientEvents = {
  [SOCKET_EVENTS.server.lobbyUpdated]: (payload: LobbyState) => void;
  [SOCKET_EVENTS.server.lobbyError]: (payload: LobbyErrorPayload) => void;
  [SOCKET_EVENTS.server.sessionStarted]: (payload: SessionStartedPayload) => void;
  [SOCKET_EVENTS.server.sessionState]: (payload: GameSessionEnvelope) => void;
  [SOCKET_EVENTS.server.sessionFinished]: (payload: SessionFinishedPayload) => void;
  [SOCKET_EVENTS.server.postGameUpdated]: (payload: PostGameUpdatePayload) => void;
  [SOCKET_EVENTS.server.raceStarted]: (payload: RaceStartedPayload) => void;
  [SOCKET_EVENTS.server.raceSnapshot]: (payload: RaceSnapshot) => void;
  [SOCKET_EVENTS.server.raceFinished]: (payload: RaceFinishedPayload) => void;
};
