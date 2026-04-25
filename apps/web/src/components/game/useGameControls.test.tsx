import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { RACE_GAME_BUTTONS, RACE_GAME_BUTTON_STATES, type RaceGameInput } from '@blitz/shared';

import { useGameControls } from './useGameControls';

function keyDown(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function keyUp(key: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

function latestInput(inputs: RaceGameInput[]) {
  const input = inputs.at(-1);
  expect(input).toBeDefined();
  return input as RaceGameInput;
}

describe('useGameControls', () => {
  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  test('maps keyboard fallback to race game inputs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_777_145_500_000);
    const inputs: RaceGameInput[] = [];

    const { result } = renderHook(() =>
      useGameControls({
        modeId: 'circle',
        onInput: (input) => inputs.push(input),
      }),
    );

    act(() => keyDown('ArrowLeft'));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'analog',
      modeId: 'circle',
      vector: { x: -1, y: 0, magnitude: 1 },
    });

    act(() => keyUp('ArrowLeft'));
    expect(result.current.state.analog).toEqual({ x: 0, y: 0, magnitude: 0 });

    act(() => keyDown('d'));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'analog',
      vector: { x: 1, y: 0, magnitude: 1 },
    });

    act(() => keyUp('d'));
    act(() => keyDown('w'));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'analog',
      vector: { x: 0, y: -1, magnitude: 1 },
    });

    act(() => keyUp('w'));
    act(() => keyDown('ArrowDown'));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'analog',
      vector: { x: 0, y: 1, magnitude: 1 },
    });

    act(() => keyDown(' '));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'button',
      button: RACE_GAME_BUTTONS.primary,
      state: RACE_GAME_BUTTON_STATES.pressed,
    });

    act(() => keyUp(' '));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'button',
      button: RACE_GAME_BUTTONS.primary,
      state: RACE_GAME_BUTTON_STATES.released,
    });

    act(() => keyDown('Enter'));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'button',
      button: RACE_GAME_BUTTONS.primary,
      state: RACE_GAME_BUTTON_STATES.pressed,
    });

    act(() => keyUp('Enter'));
    act(() => keyDown('Shift'));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'button',
      button: RACE_GAME_BUTTONS.secondary,
      state: RACE_GAME_BUTTON_STATES.pressed,
    });

    act(() => keyUp('Shift'));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'button',
      button: RACE_GAME_BUTTONS.secondary,
      state: RACE_GAME_BUTTON_STATES.released,
    });

    act(() => keyDown('Control'));
    expect(latestInput(inputs)).toMatchObject({
      kind: 'button',
      button: RACE_GAME_BUTTONS.secondary,
      state: RACE_GAME_BUTTON_STATES.pressed,
    });

    expect(inputs.map((input) => input.sequence)).toEqual(
      inputs.map((_, index) => index + 1),
    );
    expect(inputs.every((input) => typeof input.clientTimeMs === 'number')).toBe(true);
    expect(inputs.at(0)?.clientTimeMs).toBe(1_777_145_500_000);
  });

  test('resets active input on cancellation lifecycle', () => {
    const inputs: RaceGameInput[] = [];
    const { result, unmount } = renderHook(() =>
      useGameControls({
        modeId: 'dodge',
        onInput: (input) => inputs.push(input),
      }),
    );

    act(() => {
      result.current.setAnalogVector({ x: 0.8, y: 0.2, magnitude: 0.9 });
      result.current.setButtonState(RACE_GAME_BUTTONS.primary, true);
      window.dispatchEvent(new Event('blur'));
    });

    expect(result.current.state).toMatchObject({
      analog: { x: 0, y: 0, magnitude: 0 },
      primaryPressed: false,
      secondaryPressed: false,
    });
    expect(latestInput(inputs)).toMatchObject({
      kind: 'analog',
      vector: { x: 0, y: 0, magnitude: 0 },
    });

    act(() => {
      result.current.setAnalogVector({ x: -0.3, y: 0.6, magnitude: 0.7 });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(latestInput(inputs)).toMatchObject({
      kind: 'analog',
      vector: { x: 0, y: 0, magnitude: 0 },
    });

    act(() => {
      result.current.setAnalogVector({ x: 1, y: 0, magnitude: 1 });
    });
    unmount();

    expect(latestInput(inputs)).toMatchObject({
      kind: 'analog',
      vector: { x: 0, y: 0, magnitude: 0 },
    });
  });
});
