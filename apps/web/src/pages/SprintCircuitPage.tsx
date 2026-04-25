import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  RACE_GAME_BUTTONS,
  RACE_STATUS,
  type RaceAnalogVector,
  type RaceShellSnapshot,
  type RaceSnapshot,
  type SessionStartedPayload,
} from '@blitz/shared';

import { ActionButton } from '../components/game/ActionButton';
import { AnalogPad } from '../components/game/AnalogPad';
import { FullscreenGameShell } from '../components/game/FullscreenGameShell';
import { GameHud } from '../components/game/GameHud';
import { GameEmptyState, GameErrorState } from '../components/game/GameStates';
import { GameViewport } from '../components/game/GameViewport';
import { useGameControls } from '../components/game/useGameControls';
import { drawSprintCircuitTrack, SPRINT_CIRCUIT_SIZE } from '../game/sprintCircuitTrack';
import { useLiveRaceSocket } from '../lib/useLiveRaceSocket';

function formatProgress(progress: number) {
  return `${Math.round(progress * 100)}%`;
}

function formatSpeed(speed: number) {
  return `${Math.round(speed * 58)} km/h`;
}

function formatInputLabel(
  analog: RaceAnalogVector,
  primaryPressed: boolean,
  secondaryPressed: boolean,
) {
  const activeButtons = [
    primaryPressed ? 'GO' : null,
    secondaryPressed ? 'BRAKE' : null,
  ].filter(Boolean);

  if (activeButtons.length > 0) {
    return activeButtons.join(' + ');
  }

  if (analog.magnitude > 0) {
    return `Steer ${analog.x.toFixed(1)}, ${analog.y.toFixed(1)}`;
  }

  return 'Neutral';
}

function createShellSnapshot(
  snapshot: RaceSnapshot | null,
  fallbackSessionId: string,
  fallbackLobbyCode: string,
  fallbackCountdown: number | null,
  inputLabel: string,
): RaceShellSnapshot | null {
  if (!snapshot) {
    if (fallbackCountdown === null) {
      return null;
    }

    return {
      sessionId: fallbackSessionId,
      lobbyCode: fallbackLobbyCode,
      modeId: 'circle',
      status: RACE_STATUS.countdown,
      countdown: fallbackCountdown,
      tick: 0,
      players: [],
      hud: {
        objective: 'Prepare to race',
        progressLabel: '0%',
        speedLabel: '0 km/h',
        penaltyLabel: 'Clear',
        inputLabel,
        modeMetricLabel: 'Start',
        modeMetricValue: String(fallbackCountdown),
      },
      mode: {},
    };
  }

  const leadPlayer =
    [...snapshot.playersState].sort((left, right) => right.progress - left.progress)[0] ?? null;
  const penaltyLabel = leadPlayer && leadPlayer.penalties > 0 ? 'Penalty' : 'Clear';

  return {
    sessionId: snapshot.sessionId ?? fallbackSessionId,
    lobbyCode: snapshot.lobbyCode,
    modeId: 'circle',
    status: snapshot.status,
    countdown: snapshot.countdown ?? fallbackCountdown,
    tick: snapshot.tick,
    players: snapshot.playersState.map((entrant) => ({
      playerId: entrant.playerId,
      nickname: entrant.nickname,
      progress: entrant.progress,
      speed: entrant.speed,
      penalty: entrant.penalties > 0 ? 'Penalty' : null,
    })),
    hud: {
      objective: 'Reach the finish',
      progressLabel: leadPlayer ? formatProgress(leadPlayer.progress) : '0%',
      speedLabel: leadPlayer ? formatSpeed(leadPlayer.speed) : '0 km/h',
      penaltyLabel,
      inputLabel,
      modeMetricLabel: 'Checkpoint',
      modeMetricValue: leadPlayer ? String(leadPlayer.checkpoint) : '0',
    },
    mode: {
      trackId: snapshot.trackId,
    },
  };
}

export function SprintCircuitPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialState = (location.state as SessionStartedPayload | null) ?? null;
  const [countdown, setCountdown] = useState<number | null>(initialState?.countdown ?? null);
  const { isConnected, snapshot, finished, submitInput } = useLiveRaceSocket(sessionId);
  const {
    state: controlState,
    setAnalogVector,
    setButtonState,
    resetInput,
  } = useGameControls({
    modeId: 'circle',
    enabled: snapshot?.status === RACE_STATUS.racing,
    onInput: submitInput,
  });
  const { analog, primaryPressed, secondaryPressed } = controlState;
  const shellSnapshot = useMemo(
    () =>
      createShellSnapshot(
        snapshot,
        sessionId,
        initialState?.lobbyCode ?? 'pending',
        countdown,
        formatInputLabel(analog, primaryPressed, secondaryPressed),
      ),
    [
      analog,
      countdown,
      initialState?.lobbyCode,
      primaryPressed,
      secondaryPressed,
      sessionId,
      snapshot,
    ],
  );
  const controlsEnabled = snapshot?.status === RACE_STATUS.racing;

  useEffect(() => {
    if (!countdown || countdown <= 0 || snapshot) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current === null || current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [countdown, snapshot]);

  useEffect(() => {
    return () => {
      resetInput();
    };
  }, [resetInput]);

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
    const canvas = canvasRef.current;

    if (!canvas || !snapshot) {
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;

    try {
      context = canvas.getContext('2d');
    } catch {
      return;
    }

    if (!context) {
      return;
    }

    drawSprintCircuitTrack(context);

    snapshot.playersState.forEach((entrant, index) => {
      const colors = ['#ffd700', '#00aadd', '#ff3333', '#33ff66'];

      context.save();
      context.translate(entrant.x, entrant.y);
      context.rotate(entrant.angle);
      context.fillStyle = colors[index % colors.length]!;
      context.fillRect(-11, -17, 22, 34);
      context.fillStyle = '#050505';
      context.fillRect(-7, -11, 14, 8);
      context.restore();

      context.fillStyle = '#ddeeff';
      context.font = '8px "Press Start 2P", monospace';
      context.textAlign = 'center';
      context.fillText(entrant.nickname.slice(0, 6), entrant.x, entrant.y - 24);
    });
  }, [snapshot]);

  return (
    <FullscreenGameShell
      hud={<GameHud snapshot={shellSnapshot} fallbackSessionId={sessionId} />}
      viewport={
        <GameViewport
          label="Sprint circuit track"
          aspectRatio={`${SPRINT_CIRCUIT_SIZE.width} / ${SPRINT_CIRCUIT_SIZE.height}`}
        >
          <canvas
            ref={canvasRef}
            className="race-canvas-native"
            width={SPRINT_CIRCUIT_SIZE.width}
            height={SPRINT_CIRCUIT_SIZE.height}
            aria-label="Sprint circuit canvas"
          />
          <ol className="game-race-roster" aria-label="Race entrants">
            {(snapshot?.playersState ?? []).map((entrant) => (
              <li key={entrant.playerId}>
                <strong>{entrant.nickname}</strong>
                <span>
                  {formatProgress(entrant.progress)} / CP {entrant.checkpoint} / {formatSpeed(entrant.speed)}
                </span>
              </li>
            ))}
          </ol>
        </GameViewport>
      }
      controls={
        <>
          <div className="game-control-zone game-control-zone--left">
            <span className="game-control-zone__label">STEER</span>
            <AnalogPad
              label="STEER"
              value={analog}
              disabled={!controlsEnabled}
              onVectorChange={setAnalogVector}
            />
          </div>
          <div className="game-control-zone game-control-zone--right">
            <ActionButton
              label="GO"
              button={RACE_GAME_BUTTONS.primary}
              pressed={primaryPressed}
              disabled={!controlsEnabled}
              onPressedChange={(pressed) =>
                setButtonState(RACE_GAME_BUTTONS.primary, pressed)
              }
            />
            <ActionButton
              label="BRAKE"
              button={RACE_GAME_BUTTONS.secondary}
              pressed={secondaryPressed}
              disabled={!controlsEnabled}
              onPressedChange={(pressed) =>
                setButtonState(RACE_GAME_BUTTONS.secondary, pressed)
              }
            />
          </div>
        </>
      }
      stateOverlay={!isConnected ? <GameErrorState /> : shellSnapshot ? null : <GameEmptyState />}
    />
  );
}
