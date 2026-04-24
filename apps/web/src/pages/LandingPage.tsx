import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <section className="hero panel panel-hero">
      <div className="hero-copy">
        <p className="eyebrow">Subrata Race Club</p>
        <h1>Blitz</h1>
        <p className="lede">
          The single-file gag is gone. This is now the launchpad for live lobbies, serious arcade
          races, and minigames that can survive a real URL refresh.
        </p>
        <div className="action-row">
          <Link className="button button-primary" to="/hub">
            Enter the hub
          </Link>
          <Link className="button button-secondary" to="/lobby/GRID44">
            Open a live lobby
          </Link>
        </div>
      </div>
      <aside className="status-stack" aria-label="Highlights">
        <article className="status-card">
          <span className="status-value">8</span>
          <span className="status-label">drivers per grid</span>
        </article>
        <article className="status-card">
          <span className="status-value">2</span>
          <span className="status-label">race modes online now</span>
        </article>
        <article className="status-card">
          <span className="status-value">44</span>
          <span className="status-label">milliseconds Leclerc steals</span>
        </article>
      </aside>
    </section>
  );
}
