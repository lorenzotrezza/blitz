import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import type { SessionStartedPayload } from '@blitz/shared';

import { useGameSessionSocket } from '../lib/useGameSessionSocket';

interface LightsPlayerView {
  playerId: string;
  nickname: string;
  status: 'waiting' | 'reacted' | 'false-start' | 'timeout';
  lastReactionMs: number | null;
  falseStarts: number;
  totalScoreMs: number;
  roundWins?: number;
}

interface LightsSessionView {
  phase: 'countdown' | 'armed' | 'go' | 'round-result' | 'finished';
  round: number;
  totalRounds: number;
  goAtMs: number | null;
  players: LightsPlayerView[];
  roundResults: Array<{
    playerId: string;
    nickname: string;
    rank: number;
    label: string;
  }> | null;
}

function phaseCopy(phase: LightsSessionView['phase']) {
  if (phase === 'armed') {
    return 'Tieni il sangue freddo';
  }

  if (phase === 'go') {
    return 'GO';
  }

  if (phase === 'round-result') {
    return 'Manche chiusa';
  }

  if (phase === 'finished') {
    return 'Sessione finita';
  }

  return 'Countdown';
}

export function LightsSessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const anchorRef = useRef<number | null>(null);
  const { sessionId = 'pending' } = useParams();
  const initialPayload = (location.state as SessionStartedPayload | null) ?? null;
  const [submittedRound, setSubmittedRound] = useState<number | null>(null);
  const { isConnected, socketId, session, finished, submitInput } = useGameSessionSocket(sessionId);
  const state = (session?.state as LightsSessionView | null) ?? null;

  const myPlayer = useMemo(
    () => state?.players.find((player) => player.playerId === socketId) ?? null,
    [socketId, state],
  );

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.phase === 'armed') {
      anchorRef.current = performance.now();
      setSubmittedRound(null);
      return;
    }

    if (state.phase === 'finished') {
      anchorRef.current = null;
    }
  }, [state]);

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

  const canReact = Boolean(
    state &&
      myPlayer &&
      (state.phase === 'armed' || state.phase === 'go') &&
      myPlayer.status === 'waiting' &&
      submittedRound !== state.round,
  );

  return (
    <section className="panel live-panel">
      <p className="eyebrow">Realtime Session</p>
      <h1>Semaforo Multiplayer</h1>
      <p className="lede">
        Tutti condividono lo stesso verde. Anticipa e bruci la manche, aspetta troppo e molli
        terreno.
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
          <span className="retro-hud-label">ROUND</span>
          <strong>
            {state ? `${state.round} / ${state.totalRounds}` : `1 / ${initialPayload?.countdown ?? 3}`}
          </strong>
        </div>
        <div className="retro-hud-box">
          <span className="retro-hud-label">FASE</span>
          <strong>{state ? phaseCopy(state.phase) : 'Countdown'}</strong>
        </div>
      </div>

      <div className="live-grid">
        <article className="card live-card">
          <h2>Round {state ? `${state.round} / ${state.totalRounds}` : '1 / 3'}</h2>
          <p className="lobby-meta">
            {state
              ? phaseCopy(state.phase)
              : `Countdown ${initialPayload?.countdown ?? 3}`}
          </p>
          <button
            className="button button-primary"
            type="button"
            disabled={!canReact}
            onClick={() => {
              if (!state) {
                return;
              }

              if (anchorRef.current === null) {
                anchorRef.current = performance.now();
              }

              submitInput({
                reactionAtMs: Math.max(0, Math.round(performance.now() - anchorRef.current)),
              });
              setSubmittedRound(state.round);
            }}
          >
            Reagisci
          </button>
          <p className="lobby-meta">
            {myPlayer?.status === 'reacted' && myPlayer.lastReactionMs !== null
              ? `${myPlayer.lastReactionMs} ms registrati`
              : myPlayer?.status === 'false-start'
                ? 'Hai anticipato il verde'
                : myPlayer?.status === 'timeout'
                  ? 'Nessuna reazione valida'
                  : 'Aspetta il momento giusto'}
          </p>
        </article>

        <article className="card live-card">
          <h2>Griglia</h2>
          <ul className="lobby-roster">
            {(state?.players ?? []).map((player) => (
              <li className="lobby-player" key={player.playerId}>
                <div>
                  <strong>{player.nickname}</strong>
                  <span className="lobby-player-meta">
                    {player.status} · false start {player.falseStarts}
                  </span>
                </div>
                <span className={`lobby-pill ${player.status === 'reacted' ? 'is-ready' : ''}`}>
                  {player.lastReactionMs !== null ? `${player.lastReactionMs} ms` : `${player.totalScoreMs} total`}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {state?.roundResults ? (
        <article className="card live-card">
          <h2>Classifica Manche</h2>
          <ol className="results-list">
            {state.roundResults.map((entry) => (
              <li className="results-row" key={entry.playerId}>
                <span>#{entry.rank}</span>
                <strong>{entry.nickname}</strong>
                <span>{entry.label}</span>
              </li>
            ))}
          </ol>
        </article>
      ) : null}
    </section>
  );
}
