import { type CSSProperties } from 'react';

import { type StraightObstacleSnapshot } from '@blitz/shared';

interface DodgeRoadViewProps {
  snapshot: StraightObstacleSnapshot | null;
  playerId?: string | null;
}

type DodgeStyleProperties = CSSProperties & Record<`--${string}`, string | number>;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function obstacleProgress(snapshot: StraightObstacleSnapshot, playerDistance: number, obstacleDistance: number) {
  const previewDistance = 180;
  const distanceAhead = obstacleDistance - playerDistance;

  return clamp(1 - distanceAhead / previewDistance, 0, 1);
}

export function DodgeRoadView({ snapshot, playerId = null }: DodgeRoadViewProps) {
  const player = selectPlayer(snapshot, playerId);
  const hasWarning = snapshot?.warning === 'Obstacle ahead';
  const hasSlowdown = Boolean(
    player &&
      snapshot &&
      player.slowdownUntilMs !== null &&
      player.slowdownUntilMs > snapshot.serverTimeMs,
  );
  const hasHit = Boolean(player && (player.obstacleHits > 0 || snapshot?.warning === 'Hit - recovering'));
  const roadClasses = [
    'dodge-road',
    hasWarning ? 'is-warning' : '',
    hasHit ? 'is-hit' : '',
    hasSlowdown ? 'is-slowdown' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div aria-label="Straight obstacle road" className={roadClasses}>
      <div aria-hidden="true" className="dodge-road__surface">
        <span className="dodge-road__lane" />
        <span className="dodge-road__lane" />
        <span className="dodge-road__lane" />

        {snapshot?.activeObstacles.map((obstacle) => {
          const progress = obstacleProgress(snapshot, player?.distance ?? 0, obstacle.distance);
          const style: DodgeStyleProperties = {
            '--obstacle-x': obstacle.centerX,
            '--obstacle-width': obstacle.width,
            '--obstacle-progress': progress.toFixed(3),
          };

          return (
            <span
              key={obstacle.id}
              className="dodge-road__obstacle"
              style={style}
            />
          );
        })}

        <span
          className="dodge-road__car"
          style={{ '--player-x': player?.x ?? 0 } as DodgeStyleProperties}
        />
      </div>
    </div>
  );
}
