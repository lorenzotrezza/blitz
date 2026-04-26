import type { SessionFinishedPayload } from '@blitz/shared';

interface DodgeResultDetails {
  finishTimeMs: number;
  obstacleHits: number;
}

interface DodgeSummary {
  bestDodger?: string;
}

function readResultDetails(payload: SessionFinishedPayload): DodgeResultDetails | null {
  const details = payload.results.rankings[0]?.details;
  const finishTimeMs = details?.finishTimeMs;
  const obstacleHits = details?.obstacleHits;

  if (
    typeof finishTimeMs !== 'number' ||
    !Number.isFinite(finishTimeMs) ||
    typeof obstacleHits !== 'number' ||
    !Number.isFinite(obstacleHits)
  ) {
    return null;
  }

  return {
    finishTimeMs,
    obstacleHits,
  };
}

function readSummary(payload: SessionFinishedPayload): DodgeSummary {
  const bestDodger = payload.results.summary?.bestDodger;

  return typeof bestDodger === 'string' ? { bestDodger } : {};
}

function formatFinishTime(finishTimeMs: number) {
  return `${(finishTimeMs / 1000).toFixed(1)}s`;
}

export function DodgeResultsSummary({ payload }: { payload: SessionFinishedPayload }) {
  if (payload.game !== 'race' || payload.variant !== 'straight-obstacle') {
    return null;
  }

  const details = readResultDetails(payload);

  if (!details) {
    return (
      <section className="dodge-results-summary">
        <p>No obstacle summary received. Finish order is still recorded.</p>
      </section>
    );
  }

  const summary = readSummary(payload);

  return (
    <section className="dodge-results-summary">
      <h2>Best dodger</h2>
      <dl className="dodge-results-summary__grid">
        {summary.bestDodger ? (
          <div>
            <dt>Winner</dt>
            <dd>{summary.bestDodger}</dd>
          </div>
        ) : null}
        <div>
          <dt>Finish time</dt>
          <dd>{formatFinishTime(details.finishTimeMs)}</dd>
        </div>
        <div>
          <dt>Obstacle hits</dt>
          <dd>{Math.trunc(details.obstacleHits)}</dd>
        </div>
      </dl>
    </section>
  );
}
