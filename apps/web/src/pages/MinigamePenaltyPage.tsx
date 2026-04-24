import { Link } from 'react-router-dom';

import { LegacyGameFrame } from '../components/LegacyGameFrame';

export function MinigamePenaltyPage() {
  return (
    <section className="panel embed-panel">
      <div className="embed-copy">
        <p className="eyebrow">Minigame Bay</p>
        <h1>Penalty Shootout</h1>
        <p className="lede">
          This route boots straight into the real rigori screen from the legacy game, so the hub is
          not just a menu shell anymore.
        </p>
        <div className="action-row">
          <Link className="button button-secondary" to="/hub/minigames/lights">
            Previous minigame
          </Link>
          <Link className="button button-secondary" to="/hub">
            Back to hub
          </Link>
        </div>
      </div>
      <div className="embed-frame-wrap">
        <LegacyGameFrame src="/legacy/index.html?screen=penalty" title="Penalty Shootout" />
      </div>
    </section>
  );
}
