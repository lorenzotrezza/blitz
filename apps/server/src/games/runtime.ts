import type {
  GameInputPayload,
  GameSessionEnvelope,
  LobbyState,
  SessionFinishedPayload,
} from '@blitz/shared';

export interface RuntimeCallbacks<TState = unknown | null> {
  onState?: (payload: GameSessionEnvelope<TState>) => void;
  onFinished?: (payload: SessionFinishedPayload) => void;
}

export interface GameRuntimeInstance<TState = unknown | null> {
  sessionId: string;
  lobbyCode: string;
  start(): GameSessionEnvelope<TState>;
  applyInput(playerId: string, input: GameInputPayload): GameSessionEnvelope<TState> | null;
  removePlayer(playerId: string): void;
  dispose(): void;
}

export interface GameRuntimeFactory {
  (
    lobby: LobbyState,
    sessionId: string,
    callbacks: RuntimeCallbacks<unknown | null>,
  ): GameRuntimeInstance;
}
