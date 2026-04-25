import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import type { SessionStartedPayload } from '@blitz/shared';

import { useGameSessionSocket } from '../lib/useGameSessionSocket';

interface PenaltyPlayerView {
  playerId: string;
  nickname: string;
  goals: number;
  saves: number;
}

interface PenaltySessionView {
  phase: 'countdown' | 'select' | 'reveal' | 'finished';
  turn: number;
  totalTurns: number;
  activeKickerId: string | null;
  activeKeeperId: string | null;
  waitingFor: string[];
  lockedChoices: {
    kicker: boolean;
    keeper: boolean;
  };
  players: PenaltyPlayerView[];
  lastResolution: {
    lane: 'left' | 'center' | 'right';
    shot: 'power' | 'placement';
    dive: 'left' | 'center' | 'right';
    goal: boolean;
    save: boolean;
  } | null;
}

const KICK_OPTIONS = [
  { lane: 'left', shot: 'power', label: 'Sinistra Power' },
  { lane: 'center', shot: 'power', label: 'Centro Power' },
  { lane: 'right', shot: 'power', label: 'Destra Power' },
  { lane: 'left', shot: 'placement', label: 'Sinistra Piazza' },
  { lane: 'center', shot: 'placement', label: 'Centro Piazza' },
  { lane: 'right', shot: 'placement', label: 'Destra Piazza' },
] as const;

const DIVE_OPTIONS = [
  { dive: 'left', label: 'Tuffo Sinistra' },
  { dive: 'center', label: 'Tuffo Centro' },
  { dive: 'right', label: 'Tuffo Destra' },
] as const;

export function PenaltySessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const initialPayload = (location.state as SessionStartedPayload | null) ?? null;
  const { isConnected, socketId, session, finished, submitInput } = useGameSessionSocket(sessionId);
  const state = (session?.state as PenaltySessionView | null) ?? null;

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

  const isKicker = Boolean(state && socketId && state.activeKickerId === socketId);
  const isKeeper = Boolean(state && socketId && state.activeKeeperId === socketId);

  return (
    <section className="panel live-panel">
      <p className="eyebrow">Realtime Session</p>
      <h1>Rigori Multiplayer</h1>
      <p className="lede">
        Scelta nascosta, reveal server-side e tabellone corto da party room. Nessuno vede la mossa
        dell’altro prima della risoluzione.
      </p>

      <div className="retro-hud">
        <div className="retro-hud-box">
          <span className="retro-hud-label">SESSIONE</span>
          <strong>{sessionId}</strong>
        </div>
        <div className="retro-hud-box">
          <span className="retro-hud-label">SOCKET</span>
          <strong>{isConnected ? 'online' : 'offline'}</strong>
        </div>
        <div className="retro-hud-box">
          <span className="retro-hud-label">TURNO</span>
          <strong>{state ? `${state.turn} / ${state.totalTurns}` : `1 / ${initialPayload?.countdown ?? 3}`}</strong>
        </div>
        <div className="retro-hud-box">
          <span className="retro-hud-label">FASE</span>
          <strong>{state?.phase ?? 'countdown'}</strong>
        </div>
      </div>

      <div className="live-grid">
        <article className="card live-card">
          <h2>Turno {state ? `${state.turn} / ${state.totalTurns}` : '1 / 6'}</h2>
          <p className="lobby-meta">
            {isKicker
              ? 'Sei il tiratore'
              : isKeeper
                ? 'Sei il portiere'
                : 'Aspetta la risoluzione del turno'}
          </p>

          {state?.phase === 'select' && isKicker ? (
            <div className="action-row">
              {KICK_OPTIONS.map((option) => (
                <button
                  className="button button-secondary"
                  key={`${option.lane}-${option.shot}`}
                  type="button"
                  disabled={state.lockedChoices.kicker}
                  onClick={() => submitInput(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          {state?.phase === 'select' && isKeeper ? (
            <div className="action-row">
              {DIVE_OPTIONS.map((option) => (
                <button
                  className="button button-secondary"
                  key={option.dive}
                  type="button"
                  disabled={state.lockedChoices.keeper}
                  onClick={() => submitInput(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          {state?.lastResolution ? (
            <p className="lobby-meta">
              {state.lastResolution.goal
                ? `Gol su ${state.lastResolution.lane} con ${state.lastResolution.shot}`
                : `Parata su ${state.lastResolution.dive}`}
            </p>
          ) : (
            <p className="lobby-meta">
              {state?.waitingFor?.length ? `In attesa di ${state.waitingFor.length} scelta/e` : 'Countdown live'}
            </p>
          )}
        </article>

        <article className="card live-card">
          <h2>Tabellone</h2>
          <ul className="lobby-roster">
            {(state?.players ?? []).map((player) => (
              <li className="lobby-player" key={player.playerId}>
                <div>
                  <strong>{player.nickname}</strong>
                  <span className="lobby-player-meta">
                    {player.goals} gol · {player.saves} parate
                  </span>
                </div>
                <span className={`lobby-pill ${player.playerId === state?.activeKickerId ? 'is-ready' : ''}`}>
                  {player.playerId === state?.activeKickerId
                    ? 'KICK'
                    : player.playerId === state?.activeKeeperId
                      ? 'KEEP'
                      : 'WAIT'}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
