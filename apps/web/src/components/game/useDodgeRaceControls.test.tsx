import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { type StraightObstacleInput } from '@blitz/shared';

import { useDodgeRaceControls } from './useDodgeRaceControls';

function keyDown(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function keyUp(key: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

function latestInput(inputs: StraightObstacleInput[]) {
  const input = inputs.at(-1);
  expect(input).toBeDefined();
  return input as StraightObstacleInput;
}

describe('useDodgeRaceControls', () => {
  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  test('maps keyboard steering to straight obstacle input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_777_203_000_000);
    const inputs: StraightObstacleInput[] = [];

    const { rerender, unmount } = renderHook(
      ({ enabled }) =>
        useDodgeRaceControls({
          enabled,
          onInput: (input) => inputs.push(input),
        }),
      { initialProps: { enabled: true } },
    );

    act(() => keyDown('ArrowLeft'));
    expect(latestInput(inputs)).toMatchObject({
      mode: 'straight-obstacle',
      kind: 'steer',
      steerX: -1,
      sequence: 1,
      clientTimeMs: 1_777_203_000_000,
    });

    act(() => keyDown('d'));
    expect(latestInput(inputs)).toMatchObject({
      mode: 'straight-obstacle',
      kind: 'steer',
      steerX: 0,
      sequence: 2,
    });

    act(() => keyUp('ArrowLeft'));
    expect(latestInput(inputs)).toMatchObject({
      mode: 'straight-obstacle',
      kind: 'steer',
      steerX: 1,
      sequence: 3,
    });

    act(() => keyUp('d'));
    expect(latestInput(inputs)).toMatchObject({
      mode: 'straight-obstacle',
      kind: 'steer',
      steerX: 0,
      sequence: 4,
    });

    act(() => keyDown('A'));
    expect(latestInput(inputs).steerX).toBe(-1);

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(latestInput(inputs).steerX).toBe(0);

    act(() => keyDown('ArrowRight'));
    expect(latestInput(inputs).steerX).toBe(1);

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(latestInput(inputs).steerX).toBe(0);

    act(() => keyDown('D'));
    expect(latestInput(inputs).steerX).toBe(1);

    rerender({ enabled: false });
    expect(latestInput(inputs).steerX).toBe(0);

    rerender({ enabled: true });
    act(() => keyDown('ArrowLeft'));
    expect(latestInput(inputs).steerX).toBe(-1);

    unmount();
    expect(latestInput(inputs).steerX).toBe(0);

    expect(inputs.map((input) => input.sequence)).toEqual(
      inputs.map((_, index) => index + 1),
    );
  });
});
