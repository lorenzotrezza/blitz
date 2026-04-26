import { type StraightObstacleSnapshot } from '@blitz/shared';

interface DodgeHudProps {
  snapshot: StraightObstacleSnapshot | null;
  playerId?: string | null;
}

function selectPlayer(snapshot: StraightObstacleSnapshot | null, playerId?: string | null) {
  if (!snapshot || snapshot.playersState.length === 0) {
    return null;
  }

  return (
    snapshot.playersState.find((player) => player.playerId === playerId) ??
    snapshot.playersState[0] ??
    null
  );
}

function isSlowed(snapshot: StraightObstacleSnapshot | null, player: ReturnType<typeof selectPlayer>) {
  return Boolean(
    snapshot &&
      player &&
      player.slowdownUntilMs !== null &&
      player.slowdownUntilMs > snapshot.serverTimeMs,
  );
}

function formatDistance(snapshot: StraightObstacleSnapshot | null, player: ReturnType<typeof selectPlayer>) {
  return `${Math.round(player?.distance ?? 0)} / ${Math.round(snapshot?.distanceTarget ?? 0)}`;
}

function formatSpeed(player: ReturnType<typeof selectPlayer>) {
  return `${Math.round(player?.speed ?? 0)}`;
}

function liveText(snapshot: StraightObstacleSnapshot | null, player: ReturnType<typeof selectPlayer>) {
  if (!snapshot) {
    return 'Waiting for dodge race';
  }

  const updates: string[] = [];
  const warning = snapshot.warning;
  const slowed = isSlowed(snapshot, player);

  if (warning === 'Obstacle ahead' || warning === 'Hit - recovering') {
    updates.push(warning);
  }

  if (slowed || warning === 'Slowdown') {
    updates.push('Slowdown');
  }

  if (player?.finishedAtMs !== null && player?.finishedAtMs !== undefined) {
    updates.push('finished');
  }

  return updates.length > 0 ? updates.join(' · ') : 'Road clear';
}

export function DodgeHud({ snapshot, playerId = null }: DodgeHudProps) {
  const player = selectPlayer(snapshot, playerId);
  const slowed = isSlowed(snapshot, player);
  const warning = snapshot?.warning ?? 'Road clear';

  return (
    <div className="dodge-hud" aria-label="Dodge race status">
      <div className="dodge-hud__objective">Dodge obstacles</div>
      <dl className="dodge-hud__grid">
        <div className="dodge-hud__chip">
          <dt>Distance</dt>
          <dd>{formatDistance(snapshot, player)}</dd>
        </div>
        <div className="dodge-hud__chip">
          <dt>Speed</dt>
          <dd>{formatSpeed(player)}</dd>
        </div>
        <div className={['dodge-hud__chip', warning === 'Obstacle ahead' ? 'is-warning' : ''].filter(Boolean).join(' ')}>
          <dt>{warning}</dt>
          <dd>{warning === 'Road clear' ? 'Clear' : 'Watch'}</dd>
        </div>
        <div className={['dodge-hud__chip', (player?.obstacleHits ?? 0) > 0 ? 'is-hit' : ''].filter(Boolean).join(' ')}>
          <dt>Hits</dt>
          <dd>{player?.obstacleHits ?? 0}</dd>
        </div>
        <div className={['dodge-hud__chip', slowed ? 'is-slowdown' : ''].filter(Boolean).join(' ')}>
          <dt>Slowdown</dt>
          <dd>{slowed ? 'Active' : 'Clear'}</dd>
        </div>
      </dl>
      <p className="dodge-hud__live" aria-live="polite">
        {liveText(snapshot, player)}
      </p>
    </div>
  );
}
