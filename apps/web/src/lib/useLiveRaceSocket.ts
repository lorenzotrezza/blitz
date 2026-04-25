import { useEffect, useMemo, useState } from 'react';

import {
  type GameSessionEnvelope,
  SOCKET_EVENTS,
  type RaceGameInput,
  type RaceSnapshot,
  type SessionFinishedPayload,
} from '@blitz/shared';

import { getBlitzSocket } from './socket';

export interface LiveRaceSocketState {
  isConnected: boolean;
  snapshot: RaceSnapshot | null;
  finished: SessionFinishedPayload | null;
  submitInput: (input: RaceGameInput) => void;
}

export function useLiveRaceSocket(sessionId: string): LiveRaceSocketState {
  const socket = useMemo(() => getBlitzSocket(), []);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);
  const [finished, setFinished] = useState<SessionFinishedPayload | null>(null);

  useEffect(() => {
    if (!socket.connected && !socket.active) {
      socket.connect();
    }

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleSessionState = (payload: GameSessionEnvelope) => {
      if (payload.sessionId !== sessionId || payload.game !== 'race') {
        return;
      }

      setSnapshot(payload.state as RaceSnapshot);
    };

    const handleSessionFinished = (payload: SessionFinishedPayload) => {
      if (payload.sessionId !== sessionId || payload.game !== 'race') {
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

  function submitInput(input: RaceGameInput) {
    socket.emit(SOCKET_EVENTS.client.gameInput, input);
  }

  return {
    isConnected,
    snapshot,
    finished,
    submitInput,
  };
}
