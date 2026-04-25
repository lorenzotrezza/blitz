import { useEffect, useMemo, useRef, useState } from 'react';

import {
  type GameSessionEnvelope,
  RACE_STATUS,
  SOCKET_EVENTS,
  type RaceSnapshot,
  type SessionFinishedPayload,
  type SteeringInput,
} from '@blitz/shared';

import { getBlitzSocket } from './socket';

export interface LiveRaceSocketState {
  snapshot: RaceSnapshot | null;
  finished: SessionFinishedPayload | null;
  steer: SteeringInput;
  braking: boolean;
  setSteer: (value: SteeringInput) => void;
  setBrake: (value: boolean) => void;
}

export function useLiveRaceSocket(sessionId: string): LiveRaceSocketState {
  const socket = useMemo(() => getBlitzSocket(), []);
  const tickRef = useRef(0);
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);
  const [finished, setFinished] = useState<SessionFinishedPayload | null>(null);
  const [steer, setSteer] = useState<SteeringInput>(0);
  const [braking, setBrake] = useState(false);

  useEffect(() => {
    if (!socket.connected && !socket.active) {
      socket.connect();
    }

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

    socket.on(SOCKET_EVENTS.server.sessionState, handleSessionState);
    socket.on(SOCKET_EVENTS.server.sessionFinished, handleSessionFinished);

    return () => {
      socket.off(SOCKET_EVENTS.server.sessionState, handleSessionState);
      socket.off(SOCKET_EVENTS.server.sessionFinished, handleSessionFinished);
    };
  }, [sessionId, socket]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setSteer(-1);
      if (event.key === 'ArrowRight') setSteer(1);
      if (event.key === 'ArrowDown') setBrake(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setSteer((current) => (current === -1 ? 0 : current));
      if (event.key === 'ArrowRight') setSteer((current) => (current === 1 ? 0 : current));
      if (event.key === 'ArrowDown') setBrake(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!snapshot || snapshot.status !== RACE_STATUS.racing) {
        return;
      }

      tickRef.current += 1;
      socket.emit(SOCKET_EVENTS.client.gameInput, {
        tick: tickRef.current,
        steer,
        accelerate: !braking,
        brake: braking,
      });
    }, 50);

    return () => {
      window.clearInterval(timer);
    };
  }, [braking, snapshot, socket, steer]);

  return {
    snapshot,
    finished,
    steer,
    braking,
    setSteer,
    setBrake,
  };
}
