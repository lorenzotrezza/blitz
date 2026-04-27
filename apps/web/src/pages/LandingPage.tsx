import { useLocation } from 'react-router-dom';

import { LegacyGameFrame } from '../components/LegacyGameFrame';

export function LandingPage() {
  const location = useLocation();
  const legacySrc = location.search
    ? `/legacy/index.html${location.search}`
    : '/legacy/index.html';

  return (
    <div className="legacy-shell">
      <LegacyGameFrame src={legacySrc} title="Subrata Race Club" />
    </div>
  );
}
