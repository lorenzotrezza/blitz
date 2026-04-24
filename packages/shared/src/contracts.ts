import type { PlayerInput, RaceSnapshot } from './game.js';
import type { LobbyState } from './lobby.js';

export const SOCKET_EVENTS = {
  client: {
    createLobby: 'client:create-lobby',
    joinLobby: 'client:join-lobby',
    leaveLobby: 'client:leave-lobby',
    setReady: 'client:set-ready',
    startRace: 'client:start-race',
    playerInput: 'client:player-input',
  },
  server: {
    lobbyUpdated: 'server:lobby-updated',
    lobbyError: 'server:lobby-error',
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

export interface StartRacePayload {
  code: string;
}

export interface LobbyErrorPayload {
  code: string;
  message: string;
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
  [SOCKET_EVENTS.client.startRace]: (payload: StartRacePayload) => void;
  [SOCKET_EVENTS.client.playerInput]: (payload: PlayerInput) => void;
};

export type ServerToClientEvents = {
  [SOCKET_EVENTS.server.lobbyUpdated]: (payload: LobbyState) => void;
  [SOCKET_EVENTS.server.lobbyError]: (payload: LobbyErrorPayload) => void;
  [SOCKET_EVENTS.server.raceStarted]: (payload: RaceStartedPayload) => void;
  [SOCKET_EVENTS.server.raceSnapshot]: (payload: RaceSnapshot) => void;
  [SOCKET_EVENTS.server.raceFinished]: (payload: RaceFinishedPayload) => void;
};
