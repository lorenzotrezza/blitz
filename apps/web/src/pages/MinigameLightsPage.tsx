import { Link } from 'react-router-dom';

export function MinigameLightsPage() {
  return (
    <section className="panel">
      <p className="eyebrow">Minigame Bay</p>
      <h1>Reaction Lights</h1>
      <p className="lede">
        This route is reserved for the F1-style lights game, now detached from the old result screen
        shortcut so it can be replayed from the hub or before a race.
      </p>
      <div className="action-row">
        <Link className="button button-secondary" to="/hub/minigames/penalty">
          Next minigame
        </Link>
      </div>
    </section>
  );
}
