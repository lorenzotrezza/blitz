import { LegacyGameFrame } from '../components/LegacyGameFrame';

export function LandingPage() {
  return (
    <div className="legacy-shell">
      <LegacyGameFrame src="/legacy/index.html" title="Subrata Race Club" />
    </div>
  );
}
