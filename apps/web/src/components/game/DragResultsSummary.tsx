interface DragResultsSummaryProps {
  summary: Record<string, string | number | boolean | null> | undefined;
  rankingLabel: string | number | boolean | null | undefined;
}

const SHIFT_KEYS = [
  'perfectShifts',
  'goodShifts',
  'earlyShifts',
  'lateShifts',
  'totalShifts',
] as const;

function getNumber(
  summary: DragResultsSummaryProps['summary'],
  key: (typeof SHIFT_KEYS)[number] | 'finishTimeMs',
) {
  const value = summary?.[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatFinishTime(
  summary: DragResultsSummaryProps['summary'],
  rankingLabel: DragResultsSummaryProps['rankingLabel'],
) {
  if (rankingLabel !== null && rankingLabel !== undefined) {
    return String(rankingLabel);
  }

  const finishTimeMs = getNumber(summary, 'finishTimeMs');

  return finishTimeMs === null ? 'DNF' : `${(finishTimeMs / 1000).toFixed(3)}s`;
}

export function DragResultsSummary({ summary, rankingLabel }: DragResultsSummaryProps) {
  const counts = {
    perfect: getNumber(summary, 'perfectShifts'),
    good: getNumber(summary, 'goodShifts'),
    early: getNumber(summary, 'earlyShifts'),
    late: getNumber(summary, 'lateShifts'),
    total: getNumber(summary, 'totalShifts'),
  };

  if (
    counts.perfect === null ||
    counts.good === null ||
    counts.early === null ||
    counts.late === null ||
    counts.total === null
  ) {
    return null;
  }

  return (
    <article className="drag-results-summary">
      <h2>Shift Summary</h2>
      <dl className="drag-results-summary__grid">
        <div>
          <dt>Finish Time</dt>
          <dd>{formatFinishTime(summary, rankingLabel)}</dd>
        </div>
        <div>
          <dt>PERFECT</dt>
          <dd>{counts.perfect}</dd>
        </div>
        <div>
          <dt>GOOD</dt>
          <dd>{counts.good}</dd>
        </div>
        <div>
          <dt>EARLY</dt>
          <dd>{counts.early}</dd>
        </div>
        <div>
          <dt>LATE</dt>
          <dd>{counts.late}</dd>
        </div>
        <div>
          <dt>Total Shifts</dt>
          <dd>{counts.total}</dd>
        </div>
      </dl>
    </article>
  );
}
