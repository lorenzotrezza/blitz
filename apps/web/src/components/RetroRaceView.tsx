import { useEffect, useRef } from 'react';

import { RetroHud } from './RetroHud';
import { type RaceMode } from '../game/raceData';
import { useRetroRace } from '../game/useRetroRace';

interface RetroRaceViewProps {
  mode: RaceMode;
  label: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function RetroRaceView({ mode, label }: RetroRaceViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { state, setSteer, setBrake, reset } = useRetroRace(mode);

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
    const horizon = Math.floor(height * 0.28);
    const curve = Math.sin(state.player.distance / 420) * 30;

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#07070f';
    context.fillRect(0, 0, width, horizon);
    context.fillStyle = '#0a2410';
    context.fillRect(0, horizon, width, height - horizon);

    for (let i = 0; i < 48; i += 1) {
      const progress = i / 48;
      const y = horizon + progress * (height - horizon);
      const roadWidth = 90 + progress * 170;
      const centerX = width / 2 + curve * (1 - progress);
      const left = centerX - roadWidth / 2;
      const right = centerX + roadWidth / 2;

      context.fillStyle = i % 2 === 0 ? '#26262f' : '#2c2c35';
      context.fillRect(left, y, roadWidth, height / 48 + 2);
      context.fillStyle = i % 2 === 0 ? '#ffffff' : '#cc2200';
      context.fillRect(left - 8, y, 8, height / 48 + 2);
      context.fillRect(right, y, 8, height / 48 + 2);

      if (i % 4 < 2) {
        context.fillStyle = '#ddeeff';
        context.fillRect(centerX - 2, y, 4, height / 48 + 2);
      }
    }

    const drawEntrant = (
      x: number,
      y: number,
      widthPx: number,
      heightPx: number,
      color: string,
      labelText: string,
    ) => {
      context.fillStyle = 'rgba(0, 0, 0, 0.38)';
      context.fillRect(x + 3, y + heightPx, widthPx - 6, 6);
      context.fillStyle = color;
      context.fillRect(x, y, widthPx, heightPx);
      context.fillStyle = '#111';
      context.fillRect(x + 5, y + 6, widthPx - 10, 10);
      context.fillStyle = '#ddeeff';
      context.font = '10px "Press Start 2P", monospace';
      context.textAlign = 'center';
      context.fillText(labelText, x + widthPx / 2, y + heightPx / 2 + 3);
    };

    state.bots.forEach((bot, index) => {
      const relative = clamp((bot.distance - state.player.distance) / 800, -0.1, 1);
      if (relative <= 0 || relative > 1) return;
      const y = horizon + (1 - relative) * (height - horizon - 100);
      const x = width * bot.x - 20 + Math.sin((state.elapsedMs + index * 90) / 300) * 3;
      drawEntrant(x, y, 40, 56, bot.color, bot.label);
    });

    drawEntrant(width * state.player.x - 26, height - 94, 52, 68, state.player.color, state.player.label);
  }, [state]);

  return (
    <div className="race-screen">
      <RetroHud label={label} state={state} />
      <div className="race-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="race-canvas-native"
          width={420}
          height={560}
          aria-label="Retro race canvas"
        />
      </div>
      <div className="race-controls">
        <button
          className="btn"
          onMouseDown={() => setSteer(-1)}
          onMouseUp={() => setSteer(0)}
          onMouseLeave={() => setSteer(0)}
          onTouchStart={(event) => {
            event.preventDefault();
            setSteer(-1);
          }}
          onTouchEnd={() => setSteer(0)}
        >
          ◄ SX
        </button>
        <button
          className="btn btn-red"
          onMouseDown={() => setBrake(true)}
          onMouseUp={() => setBrake(false)}
          onMouseLeave={() => setBrake(false)}
          onTouchStart={(event) => {
            event.preventDefault();
            setBrake(true);
          }}
          onTouchEnd={() => setBrake(false)}
        >
          ■ FRENO
        </button>
        <button
          className="btn"
          onMouseDown={() => setSteer(1)}
          onMouseUp={() => setSteer(0)}
          onMouseLeave={() => setSteer(0)}
          onTouchStart={(event) => {
            event.preventDefault();
            setSteer(1);
          }}
          onTouchEnd={() => setSteer(0)}
        >
          DX ►
        </button>
      </div>
      <div className="race-controls race-controls-secondary">
        <button className="btn btn-green" onClick={reset}>
          ↻ RESET
        </button>
      </div>
    </div>
  );
}
