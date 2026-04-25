import { RpmShiftMeter, type DragShiftWindow } from './RpmShiftMeter';
import { ShiftQualityBadge, type DragShiftQuality } from './ShiftQualityBadge';

export interface DragShiftSummary {
  early: number;
  good: number;
  perfect: number;
  late: number;
  total: number;
}

export interface DragGearPlayerState {
  playerId: string;
  nickname: string;
  gear: number;
  maxGear: number;
  rpm: number;
  speedKmh: number;
  distanceM: number;
  distanceTargetM: number;
  throttlePressed: boolean;
  lastShiftQuality: DragShiftQuality | null;
  shiftSummary: DragShiftSummary;
  finished: boolean;
  finishTimeMs: number | null;
  rank: number | null;
}

export interface DragGearSnapshot {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  status: 'countdown' | 'racing' | 'finished';
  tick: number;
  startedAt: number | null;
  countdown: number | null;
  distanceTargetM: number;
  shiftWindow: DragShiftWindow;
  playersState: DragGearPlayerState[];
}

interface DragGearHudProps {
  snapshot: DragGearSnapshot | null;
  playerId: string | null;
}

function selectPlayer(
  snapshot: DragGearSnapshot | null,
  playerId: string | null,
): DragGearPlayerState | null {
  if (!snapshot || snapshot.playersState.length === 0) {
    return null;
  }

  return (
    snapshot.playersState.find((player) => player.playerId === playerId) ??
    snapshot.playersState[0] ??
    null
  );
}

function formatDistance(player: DragGearPlayerState | null) {
  if (!player) {
    return '0 / 0 M';
  }

  return `${Math.round(player.distanceM)} / ${Math.round(player.distanceTargetM)} M`;
}

function formatStatus(snapshot: DragGearSnapshot | null, player: DragGearPlayerState | null) {
  if (!snapshot) {
    return 'waiting';
  }

  if (player?.finished) {
    return 'finished';
  }

  if (snapshot.countdown !== null) {
    return `${snapshot.status} ${snapshot.countdown}`;
  }

  return snapshot.status;
}

export function DragGearHud({ snapshot, playerId }: DragGearHudProps) {
  const player = selectPlayer(snapshot, playerId);
  const gear = player ? `GEAR ${player.gear}/${player.maxGear}` : 'GEAR 1/4';
  const rpm = player ? Math.round(player.rpm) : 0;
  const speed = player ? Math.round(player.speedKmh) : 0;
  const status = formatStatus(snapshot, player);

  return (
    <div className="drag-gear-hud" aria-label="Drag gear race status">
      <div className="drag-gear-hud__topline">
        <span>Time the shift window</span>
        <span aria-live="polite">{status}</span>
      </div>

      {snapshot ? (
        <RpmShiftMeter rpm={rpm} window={snapshot.shiftWindow} />
      ) : (
        <div className="drag-rpm-meter">
          <div className="drag-rpm-meter__readout">
            <span>RPM</span>
            <strong>{rpm}</strong>
          </div>
          <div className="drag-rpm-meter__rail" aria-hidden="true">
            <span className="drag-rpm-meter__window" />
            <span className="drag-rpm-meter__needle" />
          </div>
        </div>
      )}

      <dl className="drag-gear-hud__grid">
        <div className="drag-gear-hud__item">
          <dt>RPM</dt>
          <dd>{rpm}</dd>
        </div>
        <div className="drag-gear-hud__item">
          <dt>GEAR</dt>
          <dd>{gear}</dd>
        </div>
        <div className="drag-gear-hud__item">
          <dt>KM/H</dt>
          <dd>{speed}</dd>
        </div>
        <div className="drag-gear-hud__item">
          <dt>M</dt>
          <dd>{formatDistance(player)}</dd>
        </div>
        <div className="drag-gear-hud__item">
          <dt>LAST SHIFT</dt>
          <dd>
            <ShiftQualityBadge quality={player?.lastShiftQuality ?? null} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
