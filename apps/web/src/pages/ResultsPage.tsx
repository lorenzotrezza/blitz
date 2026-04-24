import { Link, useParams } from 'react-router-dom';

export function ResultsPage() {
  const { sessionId = 'pending' } = useParams();

  return (
    <section className="panel">
      <p className="eyebrow">Post-Race</p>
      <h1>Results Board</h1>
      <p className="lede">
        Session <strong>{sessionId}</strong> will show the final order, rematch, and fast travel
        back to the hub when the race state is wired in.
      </p>
      <div className="action-row">
        <Link className="button button-primary" to="/hub">
          Back to hub
        </Link>
      </div>
    </section>
  );
}
