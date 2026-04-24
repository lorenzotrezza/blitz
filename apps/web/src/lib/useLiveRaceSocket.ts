import { useEffect, useMemo, useRef, useState } from 'react';

import {
  RACE_STATUS,
  SOCKET_EVENTS,
  type RaceFinishedPayload,
  type RaceSnapshot,
  type SteeringInput,
} from '@blitz/shared';

import { getBlitzSocket } from './socket';

export interface LiveRaceSocketState {
  snapshot: RaceSnapshot | null;
  finished: RaceFinishedPayload | null;
  steer: SteeringInput;
  braking: boolean;
  setSteer: (value: SteeringInput) => void;
  setBrake: (value: boolean) => void;
}

export function useLiveRaceSocket(sessionId: string): LiveRaceSocketState {
  const socket = useMemo(() => getBlitzSocket(), []);
  const tickRef = useRef(0);
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);
  const [finished, setFinished] = useState<RaceFinishedPayload | null>(null);
  const [steer, setSteer] = useState<SteeringInput>(0);
  const [braking, setBrake] = useState(false);

  useEffect(() => {
    if (!socket.connected && !socket.active) {
      socket.connect();
    }

    const handleRaceSnapshot = (payload: RaceSnapshot) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setSnapshot(payload);
    };

    const handleRaceFinished = (payload: RaceFinishedPayload) => {
      if (payload.sessionId !== sessionId) {
        return;
      }

      setFinished(payload);
    };

    socket.on(SOCKET_EVENTS.server.raceSnapshot, handleRaceSnapshot);
    socket.on(SOCKET_EVENTS.server.raceFinished, handleRaceFinished);

    return () => {
      socket.off(SOCKET_EVENTS.server.raceSnapshot, handleRaceSnapshot);
      socket.off(SOCKET_EVENTS.server.raceFinished, handleRaceFinished);
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
      socket.emit(SOCKET_EVENTS.client.playerInput, {
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
