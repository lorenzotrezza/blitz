import { useEffect, useRef, useState } from 'react';

import { BOT_SEEDS, PLAYER_COLOR, TRACK_BOUNDS, TRACK_LENGTH, type RaceMode } from './raceData';

export interface RetroRaceEntrant {
  id: string;
  label: string;
  color: string;
  x: number;
  speed: number;
  distance: number;
}

export interface RetroRaceState {
  mode: RaceMode;
  elapsedMs: number;
  lapProgress: number;
  message: string;
  player: RetroRaceEntrant;
  bots: RetroRaceEntrant[];
}

export interface RetroRaceInput {
  deltaMs: number;
  steer: -1 | 0 | 1;
  accelerate: boolean;
  brake: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createInitialRetroRaceState(mode: RaceMode): RetroRaceState {
  return {
    mode,
    elapsedMs: 0,
    lapProgress: 0,
    message:
      mode === 'bot'
        ? 'RADIO: BOT SCHIERATI · TI ASPETTANO DAVANTI'
        : 'RADIO: PISTA LIBERA · PRENDI MISURA',
    player: {
      id: 'player',
      label: 'BLZ',
      color: PLAYER_COLOR,
      x: 0.5,
      speed: 0,
      distance: 0,
    },
    bots:
      mode === 'bot'
        ? BOT_SEEDS.map((bot, index) => ({
            id: bot.id,
            label: `B${index + 1}`,
            color: bot.color,
            x: 0.32 + bot.lane * 0.18,
            speed: bot.speed,
            distance: bot.distance,
          }))
        : [],
  };
}

export function advanceRaceState(
  state: RetroRaceState,
  input: RetroRaceInput,
): RetroRaceState {
  const accelRate = input.accelerate ? input.deltaMs * 0.0045 : 0;
  const brakeRate = input.brake ? input.deltaMs * 0.007 : 0;
  const dragRate = input.deltaMs * 0.0015;
  const maxSpeed = state.mode === 'bot' ? 4.9 : 4.6;
  const nextSpeed = clamp(state.player.speed + accelRate - brakeRate - dragRate, 0.9, maxSpeed);
  const steerStrength = input.steer * input.deltaMs * 0.0011 * (0.7 + nextSpeed * 0.08);
  const nextPlayerX = clamp(
    state.player.x + steerStrength,
    TRACK_BOUNDS.left,
    TRACK_BOUNDS.right,
  );
  const nextDistance = state.player.distance + nextSpeed * input.deltaMs * 0.92;
  const lapProgress = clamp(nextDistance / TRACK_LENGTH, 0, 1);
  const offRoad =
    nextPlayerX <= TRACK_BOUNDS.left + 0.02 || nextPlayerX >= TRACK_BOUNDS.right - 0.02;

  const bots = state.bots.map((bot, index) => {
    const swing = Math.sin((state.elapsedMs + index * 300) / 900) * 0.018;

    return {
      ...bot,
      x: clamp(bot.x + swing, 0.28, 0.72),
      distance: bot.distance + bot.speed * input.deltaMs * 0.88,
    };
  });

  return {
    ...state,
    elapsedMs: state.elapsedMs + input.deltaMs,
    lapProgress,
    message: offRoad
      ? 'RADIO: OCCHIO AI LIMITI · STAI MANGIANDO ERBA'
      : state.mode === 'bot'
        ? 'RADIO: BOT SCHIERATI · TI ASPETTANO DAVANTI'
        : 'RADIO: PISTA LIBERA · PRENDI MISURA',
    player: {
      ...state.player,
      x: nextPlayerX,
      speed: nextSpeed,
      distance: nextDistance,
    },
    bots,
  };
}

export function useRetroRace(mode: RaceMode) {
  const [state, setState] = useState(() => createInitialRetroRaceState(mode));
  const inputRef = useRef({
    steer: 0 as -1 | 0 | 1,
    accelerate: true,
    brake: false,
  });

  useEffect(() => {
    setState(createInitialRetroRaceState(mode));
  }, [mode]);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const deltaMs = Math.min(40, now - previous || 16);
      previous = now;
      setState((current) =>
        advanceRaceState(current, {
          deltaMs,
          steer: inputRef.current.steer,
          accelerate: inputRef.current.accelerate,
          brake: inputRef.current.brake,
        }),
      );
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') inputRef.current.steer = -1;
      if (event.key === 'ArrowRight') inputRef.current.steer = 1;
      if (event.key === 'ArrowDown') inputRef.current.brake = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && inputRef.current.steer === -1) inputRef.current.steer = 0;
      if (event.key === 'ArrowRight' && inputRef.current.steer === 1) inputRef.current.steer = 0;
      if (event.key === 'ArrowDown') inputRef.current.brake = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return {
    state,
    setSteer(steer: -1 | 0 | 1) {
      inputRef.current.steer = steer;
    },
    setBrake(brake: boolean) {
      inputRef.current.brake = brake;
    },
    reset() {
      setState(createInitialRetroRaceState(mode));
    },
  };
}
