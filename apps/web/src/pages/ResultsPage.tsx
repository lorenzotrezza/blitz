import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import type { RaceFinishedPayload, SessionFinishedPayload } from '@blitz/shared';

import { resolveSessionRoute } from '../lib/sessionRoutes';
import { usePostGameActions } from '../lib/usePostGameActions';

function formatFinishTime(finishTimeMs: number | null) {
  if (finishTimeMs === null) {
    return 'DNF';
  }

  return `${(finishTimeMs / 1000).toFixed(1)}s`;
}

function normalizePayload(payload: SessionFinishedPayload | RaceFinishedPayload | null): SessionFinishedPayload | null {
  if (!payload) {
    return null;
  }

  if ('results' in payload) {
    return payload;
  }

  return {
    sessionId: payload.sessionId,
    lobbyCode: payload.lobbyCode,
    game: 'race',
    variant: null,
    results: {
      rankings: payload.standings.map((standing) => ({
        playerId: standing.entrantId,
        rank: standing.position,
        label: formatFinishTime(standing.finishTimeMs),
        value: standing.finishTimeMs,
      })),
    },
  };
}

function readLobbyRoster() {
  const raw = window.localStorage.getItem('blitz-active-lobby');

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as {
      players?: Array<{ id: string; nickname: string }>;
    };
  } catch {
    return null;
  }
}

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = 'pending' } = useParams();
  const locationPayload =
    (location.state as SessionFinishedPayload | RaceFinishedPayload | null) ?? null;
  const storedPayload = window.sessionStorage.getItem(`blitz-results:${sessionId}`);
  const payload = normalizePayload(
    locationPayload ??
      (storedPayload
        ? (JSON.parse(storedPayload) as SessionFinishedPayload | RaceFinishedPayload)
        : null),
  );
  const roster = readLobbyRoster();
  const { lobby, isHost, pendingAction, postGameUpdate, sessionStarted, submitAction } =
    usePostGameActions(payload?.lobbyCode ?? null);

  useEffect(() => {
    if (!postGameUpdate?.lobby.code) {
      return;
    }

    navigate(`/lobby/${postGameUpdate.lobby.code}`, { replace: true });
  }, [navigate, postGameUpdate]);

  useEffect(() => {
    if (!sessionStarted) {
      return;
    }

    navigate(resolveSessionRoute(sessionStarted), {
      replace: true,
      state: sessionStarted,
    });
  }, [navigate, sessionStarted]);

  return (
    <section className="panel results-panel">
      <p className="eyebrow">Post-Game</p>
      <h1>Risultati Finali</h1>
      <p className="lede">
        Session <strong>{sessionId}</strong> chiusa. La board finale e comune a ogni gioco della
        party arcade.
      </p>

      {payload ? (
        <ol className="results-list">
          {payload.results.rankings.map((entry) => (
            <li className="results-row" key={entry.playerId}>
              <span>#{entry.rank}</span>
              <strong>
                {roster?.players?.find((player) => player.id === entry.playerId)?.nickname ?? entry.playerId}
              </strong>
              <span>{entry.label ?? entry.value ?? 'ND'}</span>
            </li>
          ))}
        </ol>
      ) : (
        <article className="card">
          <h2>Nessun Dato</h2>
          <p>Apri una gara live dalla lobby per riempire la board finale.</p>
        </article>
      )}

      <div className="action-row">
        {isHost && lobby ? (
          <>
            <button
              className="button button-primary"
              type="button"
              disabled={pendingAction !== null}
              onClick={() => submitAction('rematch')}
            >
              {pendingAction === 'rematch' ? 'Rigioca...' : 'Rigioca'}
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={pendingAction !== null}
              onClick={() => submitAction('return-to-lobby')}
            >
              Torna alla Lobby
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={pendingAction !== null}
              onClick={() => submitAction('change-game')}
            >
              Cambia Gioco
            </button>
          </>
        ) : lobby ? (
          <p className="lobby-meta">In attesa della decisione host per il prossimo giro.</p>
        ) : null}
        <Link className="button button-secondary" to="/hub">
          Torna all Hub
        </Link>
      </div>
    </section>
  );
}
