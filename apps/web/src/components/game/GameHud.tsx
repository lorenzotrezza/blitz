import { type RaceShellModeId, type RaceShellSnapshot } from '@blitz/shared';

interface GameHudProps {
  snapshot: RaceShellSnapshot | null;
  fallbackSessionId: string;
}

const MODE_LABELS: Record<RaceShellModeId, string> = {
  drag: 'Drag',
  dodge: 'Dodge',
  circle: 'Circle',
  'figure-eight': 'Figure Eight',
};

function renderValue(value: string | number | null | undefined, fallback = 'Pending') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
}

export function GameHud({ snapshot, fallbackSessionId }: GameHudProps) {
  const hud = snapshot?.hud;
  const sessionId = snapshot?.sessionId ?? fallbackSessionId;
  const modeLabel = snapshot ? MODE_LABELS[snapshot.modeId] : 'Pending';
  const countdown = snapshot?.countdown ?? null;
  const status = snapshot?.status ?? 'waiting';
  const penalty = renderValue(hud?.penaltyLabel);

  return (
    <div className="game-hud" aria-label="Race status">
      <dl className="game-hud__grid">
        <div className="game-hud__item">
          <dt>Mode</dt>
          <dd>{modeLabel}</dd>
        </div>
        <div className="game-hud__item">
          <dt>Objective</dt>
          <dd>{renderValue(hud?.objective)}</dd>
        </div>
        <div className="game-hud__item">
          <dt>Progress</dt>
          <dd>{renderValue(hud?.progressLabel)}</dd>
        </div>
        <div className="game-hud__item">
          <dt>Speed</dt>
          <dd>{renderValue(hud?.speedLabel)}</dd>
        </div>
        <div className="game-hud__item">
          <dt>Penalty</dt>
          <dd>{penalty}</dd>
        </div>
        <div className="game-hud__item">
          <dt>Input</dt>
          <dd>{renderValue(hud?.inputLabel)}</dd>
        </div>
        <div className="game-hud__item game-hud__item--metric">
          <dt>{renderValue(hud?.modeMetricLabel, 'Metric')}</dt>
          <dd>{renderValue(hud?.modeMetricValue)}</dd>
        </div>
        <div className="game-hud__item">
          <dt>Session</dt>
          <dd>{sessionId}</dd>
        </div>
        <div className="game-hud__item">
          <dt>Countdown</dt>
          <dd>{countdown ?? 'Waiting'}</dd>
        </div>
        <div className="game-hud__item">
          <dt>Status</dt>
          <dd>{status}</dd>
        </div>
      </dl>
      <p className="game-hud__live" aria-live="polite">
        {status} · {countdown ?? 'waiting'} · {penalty}
      </p>
    </div>
  );
}
