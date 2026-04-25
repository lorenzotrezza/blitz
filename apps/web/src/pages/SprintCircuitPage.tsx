import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { RACE_STATUS, type SessionFinishedPayload, type SessionStartedPayload } from '@blitz/shared';

import { drawSprintCircuitTrack, SPRINT_CIRCUIT_SIZE } from '../game/sprintCircuitTrack';
import { useLiveRaceSocket } from '../lib/useLiveRaceSocket';

export function SprintCircuitPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialState = (location.state as SessionStartedPayload | null) ?? null;
  const [countdown, setCountdown] = useState<number | null>(initialState?.countdown ?? null);
  const { snapshot, finished, steer, braking, setSteer, setBrake } = useLiveRaceSocket(sessionId);

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
    if (!finished) {
      return;
    }

    window.sessionStorage.setItem(`blitz-results:${finished.sessionId}`, JSON.stringify(finished));
    navigate(`/results/${finished.sessionId}`, {
      replace: true,
      state: finished,
    });
  }, [finished, navigate]);

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
    <section className="panel live-panel">
      <p className="eyebrow">Realtime Session</p>
      <h1>Sprint Circuit</h1>
      <p className="lede">
        Pista vera, checkpoint leggibili, giri completi e collisioni soft. L’ovale prototipo non
        esiste piu in questo flow.
      </p>

      {countdown && countdown > 0 && !snapshot ? (
        <article className="card countdown-card">
          <h2>Semaforo Live</h2>
          <p className="status-value">{countdown}</p>
        </article>
      ) : null}

      <div className="retro-hud">
        <div className="retro-hud-box">
          <span className="retro-hud-label">SESSIONE</span>
          <strong>{sessionId}</strong>
        </div>
        <div className="retro-hud-box">
          <span className="retro-hud-label">TRACK</span>
          <strong>{snapshot?.trackId ?? 'sprint-circuit'}</strong>
        </div>
        <div className="retro-hud-box">
          <span className="retro-hud-label">ENTRANTI</span>
          <strong>{snapshot?.playersState.length ?? 0}</strong>
        </div>
        <div className="retro-hud-box">
          <span className="retro-hud-label">TICK</span>
          <strong>{snapshot?.tick ?? 0}</strong>
        </div>
      </div>

      <div className="race-canvas-wrap live-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="race-canvas-native"
          width={SPRINT_CIRCUIT_SIZE.width}
          height={SPRINT_CIRCUIT_SIZE.height}
          aria-label="Sprint circuit canvas"
        />
      </div>

      <div className="live-grid">
        <div className="card live-card">
          <h2>Griglia Live</h2>
          <ul className="lobby-roster">
            {(snapshot?.playersState ?? []).map((entrant) => (
              <li className="lobby-player" key={entrant.playerId}>
                <div>
                  <strong>{entrant.nickname}</strong>
                  <span className="lobby-player-meta">
                    lap {entrant.lap} · checkpoint {entrant.checkpoint} · penalita {entrant.penalties}
                  </span>
                </div>
                <span className={`lobby-pill ${entrant.speed > 0 ? 'is-ready' : ''}`}>
                  {Math.round(entrant.speed * 58)} km/h
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card live-card">
          <h2>Comandi</h2>
          <p className="lobby-meta">
            Sterzo arcade, freno reale, progressione checkpoint-based. Ogni input passa dal server.
          </p>
          <div className="race-controls">
            <button
              className="button button-secondary"
              type="button"
              onMouseDown={() => setSteer(-1)}
              onMouseUp={() => setSteer(0)}
              onMouseLeave={() => setSteer(0)}
              onTouchStart={(event) => {
                event.preventDefault();
                setSteer(-1);
              }}
              onTouchEnd={() => setSteer(0)}
            >
              ◄ SX
            </button>
            <button
              className="button button-secondary"
              type="button"
              onMouseDown={() => setBrake(true)}
              onMouseUp={() => setBrake(false)}
              onMouseLeave={() => setBrake(false)}
              onTouchStart={(event) => {
                event.preventDefault();
                setBrake(true);
              }}
              onTouchEnd={() => setBrake(false)}
            >
              {braking ? 'FRENO ON' : 'FRENO'}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onMouseDown={() => setSteer(1)}
              onMouseUp={() => setSteer(0)}
              onMouseLeave={() => setSteer(0)}
              onTouchStart={(event) => {
                event.preventDefault();
                setSteer(1);
              }}
              onTouchEnd={() => setSteer(0)}
            >
              DX ►
            </button>
          </div>
          <p className="lobby-meta">Sterzo attuale: {steer}</p>
          <p className="lobby-meta">
            {snapshot?.status === RACE_STATUS.racing
              ? 'La gara e live.'
              : snapshot?.status === RACE_STATUS.finished
                ? 'Bandiera a scacchi.'
                : 'In attesa del verde.'}
          </p>
        </div>
      </div>
    </section>
  );
}
