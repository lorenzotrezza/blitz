import { Link, useLocation, useParams } from 'react-router-dom';

import type { RaceFinishedPayload } from '@blitz/shared';

function formatFinishTime(finishTimeMs: number | null) {
  if (finishTimeMs === null) {
    return 'DNF';
  }

  return `${(finishTimeMs / 1000).toFixed(1)}s`;
}

export function ResultsPage() {
  const location = useLocation();
  const { sessionId = 'pending' } = useParams();
  const locationPayload = (location.state as RaceFinishedPayload | null) ?? null;
  const storedPayload = window.sessionStorage.getItem(`blitz-results:${sessionId}`);
  const payload =
    locationPayload ??
    (storedPayload ? (JSON.parse(storedPayload) as RaceFinishedPayload) : null);

  return (
    <section className="panel results-panel">
      <p className="eyebrow">Post-Race</p>
      <h1>Classifica Finale</h1>
      <p className="lede">
        Session <strong>{sessionId}</strong> chiusa. Qui restano ordine d’arrivo, tempi e ritorno
        rapido al garage.
      </p>

      {payload ? (
        <ol className="results-list">
          {payload.standings.map((standing) => (
            <li className="results-row" key={standing.entrantId}>
              <span>#{standing.position}</span>
              <strong>{standing.entrantId}</strong>
              <span>{standing.entrantType.toUpperCase()}</span>
              <span>{formatFinishTime(standing.finishTimeMs)}</span>
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
        <Link className="button button-primary" to="/hub">
          Torna all Hub
        </Link>
        <Link className="button button-secondary" to="/lobby/new">
          Nuova Lobby
        </Link>
      </div>
    </section>
  );
}
