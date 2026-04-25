import { useEffect, useMemo, useState } from 'react';

import {
  SOCKET_EVENTS,
  type GameInputPayload,
  type GameSessionEnvelope,
  type SessionFinishedPayload,
} from '@blitz/shared';

import { getBlitzSocket } from './socket';

export interface GameSessionSocketState {
  isConnected: boolean;
  socketId: string | null;
  session: GameSessionEnvelope | null;
  finished: SessionFinishedPayload | null;
  submitInput: (payload: GameInputPayload) => void;
}

export function useGameSessionSocket(sessionId: string): GameSessionSocketState {
  const socket = useMemo(() => getBlitzSocket(), []);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [session, setSession] = useState<GameSessionEnvelope | null>(null);
  const [finished, setFinished] = useState<SessionFinishedPayload | null>(null);

  useEffect(() => {
    if (!socket.connected && !socket.active) {
      socket.connect();
    }

    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id ?? null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    const handleSessionState = (payload: GameSessionEnvelope) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setSession(payload);
    };

    const handleSessionFinished = (payload: SessionFinishedPayload) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setFinished(payload);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.server.sessionState, handleSessionState);
    socket.on(SOCKET_EVENTS.server.sessionFinished, handleSessionFinished);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.server.sessionState, handleSessionState);
      socket.off(SOCKET_EVENTS.server.sessionFinished, handleSessionFinished);
    };
  }, [sessionId, socket]);

  return {
    isConnected,
    socketId,
    session,
    finished,
    submitInput(payload) {
      socket.emit(SOCKET_EVENTS.client.gameInput, payload);
    },
  };
}
