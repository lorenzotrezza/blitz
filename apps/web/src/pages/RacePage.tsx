import { useParams } from 'react-router-dom';

export function RacePage() {
  const { sessionId = 'pending' } = useParams();

  return (
    <section className="panel">
      <p className="eyebrow">Realtime Session</p>
      <h1>Live Race</h1>
      <p className="lede">
        Session <strong>{sessionId}</strong> is where the serious shared track will render once the
        authoritative race loop lands.
      </p>
    </section>
  );
}
