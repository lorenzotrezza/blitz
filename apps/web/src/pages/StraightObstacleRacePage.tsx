import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  RACE_STATUS,
  type StraightObstacleInput,
  type StraightObstacleSnapshot,
} from '@blitz/shared';

import { DodgeHud } from '../components/game/DodgeHud';
import { DodgeRoadView } from '../components/game/DodgeRoadView';
import { DodgeSteeringPad } from '../components/game/DodgeSteeringPad';
import { FullscreenGameShell } from '../components/game/FullscreenGameShell';
import { GameViewport } from '../components/game/GameViewport';
import { useDodgeRaceControls } from '../components/game/useDodgeRaceControls';
import { useGameSessionSocket } from '../lib/useGameSessionSocket';

function isStraightObstacleSnapshot(input: unknown): input is StraightObstacleSnapshot {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const snapshot = input as Partial<StraightObstacleSnapshot>;

  return (
    snapshot.trackId === 'straight-obstacle' &&
    snapshot.mode === 'straight-obstacle' &&
    Array.isArray(snapshot.playersState) &&
    Array.isArray(snapshot.activeObstacles)
  );
}

function DodgeEmptyState() {
  return (
    <div className="game-state" role="status">
      <h2>Waiting for dodge race</h2>
      <p>No live dodge snapshot yet. Keep this screen open; the countdown appears when the server starts the session.</p>
    </div>
  );
}

function DodgeErrorState() {
  return (
    <div className="game-state game-state--error" role="alert">
      <p>Connection lost. Rejoin from the lobby or refresh this session.</p>
    </div>
  );
}

export function StraightObstacleRacePage() {
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const inputSequenceRef = useRef(Date.now());
  const { isConnected, socketId, session, finished, submitInput } =
    useGameSessionSocket(sessionId);
  const snapshot =
    session?.game === 'race' &&
    session.variant === 'straight-obstacle' &&
    isStraightObstacleSnapshot(session.state)
      ? session.state
      : null;
  const controlsEnabled = Boolean(
    isConnected && snapshot?.status === RACE_STATUS.racing && !finished,
  );

  const submitStraightObstacleInput = useCallback(
    (input: StraightObstacleInput) => {
      inputSequenceRef.current += 1;
      submitInput({
        ...input,
        sequence: inputSequenceRef.current,
      });
    },
    [submitInput],
  );

  const { resetSteering, setSteerX, steerX } = useDodgeRaceControls({
    enabled: controlsEnabled,
    onInput: submitStraightObstacleInput,
  });

  const submitNeutralSteering = useCallback(() => {
    submitInput({
      mode: 'straight-obstacle',
      kind: 'steer',
      steerX: 0,
      sequence: inputSequenceRef.current + 1,
      clientTimeMs: Date.now(),
    });
    inputSequenceRef.current += 1;
    resetSteering();
  }, [resetSteering, submitInput]);

  useEffect(() => {
    if (!finished) {
      return;
    }

    window.sessionStorage.setItem(`blitz-results:${finished.sessionId}`, JSON.stringify(finished));
    navigate(`/results/${finished.sessionId}`, {
      replace: true,
      state: finished,
    });
    submitNeutralSteering();
  }, [finished, navigate, submitNeutralSteering]);

  useEffect(() => {
    if (isConnected) {
      return;
    }

    submitNeutralSteering();
  }, [isConnected, submitNeutralSteering]);

  useEffect(() => {
    return () => {
      submitNeutralSteering();
    };
  }, [submitNeutralSteering]);

  const stateOverlay = useMemo(() => {
    if (!isConnected) {
      return <DodgeErrorState />;
    }

    if (!snapshot) {
      return <DodgeEmptyState />;
    }

    return null;
  }, [isConnected, snapshot]);

  return (
    <FullscreenGameShell
      hud={<DodgeHud snapshot={snapshot} playerId={socketId} />}
      viewport={
        <GameViewport label="Straight obstacle race">
          <DodgeRoadView snapshot={snapshot} playerId={socketId} />
        </GameViewport>
      }
      controls={
        <DodgeSteeringPad
          disabled={!controlsEnabled}
          onSteerChange={setSteerX}
          steerX={steerX}
        />
      }
      stateOverlay={stateOverlay}
    />
  );
}
