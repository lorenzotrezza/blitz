import { useEffect, useRef } from 'react';

import {
  type DragGearPlayerState,
  type DragGearSnapshot,
} from './DragGearHud';

interface StraightDragTrackProps {
  snapshot: DragGearSnapshot | null;
  playerId: string | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function progressFor(player: DragGearPlayerState | null, fallbackTargetM: number) {
  if (!player) {
    return 0;
  }

  const target = Math.max(1, player.distanceTargetM || fallbackTargetM);

  return clamp(player.distanceM / target, 0, 1);
}

export function StraightDragTrack({ snapshot, playerId }: StraightDragTrackProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const player = selectPlayer(snapshot, playerId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;

    try {
      context = canvas.getContext('2d');
    } catch {
      return;
    }

    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const targetM = Math.max(1, snapshot?.distanceTargetM ?? player?.distanceTargetM ?? 402);
    const stripLeft = 44;
    const stripRight = width - 56;
    const stripTop = 72;
    const stripHeight = 144;
    const stripWidth = stripRight - stripLeft;
    const playerProgress = progressFor(player, targetM);

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#06060d';
    context.fillRect(0, 0, width, height);

    context.fillStyle = '#0f0f1e';
    context.fillRect(stripLeft, stripTop, stripWidth, stripHeight);
    context.strokeStyle = '#273448';
    context.lineWidth = 4;
    context.strokeRect(stripLeft, stripTop, stripWidth, stripHeight);

    for (let marker = 0; marker <= 4; marker += 1) {
      const markerProgress = marker / 4;
      const markerX = stripLeft + markerProgress * stripWidth;
      const label = `${Math.round(markerProgress * targetM)}M`;

      context.strokeStyle = marker === 4 ? '#ffd700' : '#00aadd';
      context.lineWidth = marker === 4 ? 5 : 2;
      context.beginPath();
      context.moveTo(markerX, stripTop - 20);
      context.lineTo(markerX, stripTop + stripHeight + 20);
      context.stroke();

      context.fillStyle = marker === 4 ? '#ffd700' : '#ddeeff';
      context.font = '12px "Press Start 2P", monospace';
      context.textAlign = 'center';
      context.fillText(label, markerX, stripTop + stripHeight + 42);
    }

    const drawCar = (
      racer: DragGearPlayerState,
      index: number,
      color: string,
      isCurrentPlayer: boolean,
    ) => {
      const x = stripLeft + progressFor(racer, targetM) * stripWidth;
      const y = stripTop + 28 + index * 48;
      const carWidth = isCurrentPlayer ? 52 : 44;
      const carHeight = isCurrentPlayer ? 26 : 22;

      context.fillStyle = 'rgba(0, 0, 0, 0.42)';
      context.fillRect(x - carWidth / 2 + 4, y + carHeight, carWidth - 8, 6);
      context.fillStyle = color;
      context.fillRect(x - carWidth / 2, y, carWidth, carHeight);
      context.fillStyle = '#06060d';
      context.fillRect(x - carWidth / 4, y + 5, carWidth / 2, 7);
      context.fillStyle = '#ddeeff';
      context.font = '12px "Press Start 2P", monospace';
      context.textAlign = 'center';
      context.fillText(isCurrentPlayer ? 'YOU' : String(index + 1), x, y + carHeight + 22);
    };

    snapshot?.playersState.forEach((racer, index) => {
      const isCurrentPlayer = racer.playerId === player?.playerId;
      drawCar(racer, index, isCurrentPlayer ? '#ffd700' : '#00aadd', isCurrentPlayer);
    });

    if (!snapshot || snapshot.playersState.length === 0) {
      context.fillStyle = '#ddeeff';
      context.font = '16px "Press Start 2P", monospace';
      context.textAlign = 'center';
      context.fillText('WAITING', width / 2, height / 2);
    }

    const progressX = stripLeft + playerProgress * stripWidth;
    context.fillStyle = '#33ff66';
    context.fillRect(stripLeft, stripTop + stripHeight + 8, progressX - stripLeft, 8);
  }, [player, snapshot]);

  return (
    <div className="straight-drag-track">
      <canvas
        ref={canvasRef}
        className="straight-drag-track__canvas"
        width={720}
        height={320}
        aria-label="Straight drag race track"
      />
    </div>
  );
}
