import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  RACE_GAME_BUTTONS,
  RACE_GAME_BUTTON_STATES,
  RACE_STATUS,
  type RaceGameInput,
  type SessionStartedPayload,
} from '@blitz/shared';

import { DragActionControls } from '../components/game/DragActionControls';
import { DragGearHud, type DragGearSnapshot } from '../components/game/DragGearHud';
import { FullscreenGameShell } from '../components/game/FullscreenGameShell';
import { StraightDragTrack } from '../components/game/StraightDragTrack';
import { useGameControls } from '../components/game/useGameControls';
import { useGameSessionSocket } from '../lib/useGameSessionSocket';

function isDragGearSnapshot(input: unknown): input is DragGearSnapshot {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const snapshot = input as Partial<DragGearSnapshot>;

  return snapshot.trackId === 'straight-drag-gear' && Array.isArray(snapshot.playersState);
}

function isThrottleKey(key: string) {
  return key === ' ' || key === 'Spacebar' || key === 'Space' || key === 'ArrowUp';
}

function isShiftKey(key: string) {
  return key === 'Shift' || key === 'Enter';
}

function DragEmptyState() {
  return (
    <div className="game-state" role="status">
      <h2>Waiting for drag race</h2>
      <p>No live drag snapshot yet. Keep this screen open; the countdown appears when the server starts the race.</p>
    </div>
  );
}

function DragErrorState() {
  return (
    <div className="game-state game-state--error" role="alert">
      <h2>Connection lost</h2>
      <p>Connection lost. Rejoin from the lobby or refresh this race.</p>
    </div>
  );
}

export function DragGearRacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialState = (location.state as SessionStartedPayload | null) ?? null;
  const inputSequenceRef = useRef(0);
  const { isConnected, socketId, session, finished, submitInput } =
    useGameSessionSocket(sessionId);
  const snapshot =
    session?.game === 'race' &&
    session.variant === 'drag-sprint' &&
    isDragGearSnapshot(session.state)
      ? session.state
      : null;
  const controlsEnabled = Boolean(
    isConnected && snapshot?.status === RACE_STATUS.racing && !finished,
  );

  const nextSequence = useCallback(() => {
    inputSequenceRef.current += 1;
    return inputSequenceRef.current;
  }, []);

  const emitThrottle = useCallback(
    (pressed: boolean, sequence = nextSequence(), clientTimeMs = Date.now()) => {
      submitInput({
        kind: 'drag-throttle',
        pressed,
        sequence,
        clientTimeMs,
      });
    },
    [nextSequence, submitInput],
  );

  const emitShift = useCallback(
    (sequence = nextSequence(), clientTimeMs = Date.now()) => {
      submitInput({
        kind: 'drag-shift',
        sequence,
        clientTimeMs,
      });
    },
    [nextSequence, submitInput],
  );

  const handleControlInput = useCallback(
    (input: RaceGameInput) => {
      if (
        input.kind === 'button' &&
        input.button === RACE_GAME_BUTTONS.primary
      ) {
        emitThrottle(
          input.state === RACE_GAME_BUTTON_STATES.pressed,
          input.sequence,
          input.clientTimeMs,
        );
        return;
      }

      if (input.kind === 'action' && input.action === 'shift') {
        emitShift(input.sequence, input.clientTimeMs);
      }
    },
    [emitShift, emitThrottle],
  );

  const controls = useGameControls({
    modeId: 'drag',
    enabled: controlsEnabled,
    onInput: handleControlInput,
  });
  const { emitAction, resetInput, setButtonState } = controls;

  useEffect(() => {
    if (!finished) {
      return;
    }

    window.sessionStorage.setItem(`blitz-results:${finished.sessionId}`, JSON.stringify(finished));
    navigate(`/results/${finished.sessionId}`, {
      replace: true,
      state: finished,
    });
    resetInput();
  }, [finished, navigate, resetInput]);

  useEffect(() => {
    if (controlsEnabled) {
      return;
    }

    resetInput();
  }, [controlsEnabled, resetInput]);

  useEffect(() => {
    return () => {
      resetInput();
    };
  }, [resetInput]);

  useEffect(() => {
    // Space and ArrowUp held throttle; Shift and Enter one-shot shift; key-repeat ignored for shift.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!controlsEnabled) {
        return;
      }

      if (isThrottleKey(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) {
          setButtonState(RACE_GAME_BUTTONS.primary, true);
        }
        return;
      }

      if (isShiftKey(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) {
          emitAction('shift');
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isThrottleKey(event.key)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      setButtonState(RACE_GAME_BUTTONS.primary, false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        resetInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', resetInput);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', resetInput);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [controlsEnabled, emitAction, resetInput, setButtonState]);

  const stateOverlay = useMemo(() => {
    if (!isConnected) {
      return <DragErrorState />;
    }

    if (!snapshot && !initialState) {
      return <DragEmptyState />;
    }

    return null;
  }, [initialState, isConnected, snapshot]);

  return (
    <FullscreenGameShell
      hud={<DragGearHud snapshot={snapshot} playerId={socketId} />}
      viewport={<StraightDragTrack snapshot={snapshot} playerId={socketId} />}
      controls={<DragActionControls controls={controls} disabled={!controlsEnabled} />}
      stateOverlay={stateOverlay}
    />
  );
}
