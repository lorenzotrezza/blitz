import { Link } from 'react-router-dom';

import { LegacyGameFrame } from '../components/LegacyGameFrame';

export function MinigameLightsPage() {
  return (
    <section className="panel embed-panel">
      <div className="embed-copy">
        <p className="eyebrow">Minigame Bay</p>
        <h1>Reaction Lights</h1>
        <p className="lede">
          This launches the real semaforo from the classic site, but from the hub route so you can
          replay it without rerunning the full intro flow.
        </p>
        <div className="action-row">
          <Link className="button button-secondary" to="/hub/minigames/penalty">
            Next minigame
          </Link>
          <Link className="button button-secondary" to="/hub">
            Back to hub
          </Link>
        </div>
      </div>
      <div className="embed-frame-wrap">
        <LegacyGameFrame src="/legacy/index.html?screen=lights" title="Reaction Lights" />
      </div>
    </section>
  );
}
