import '@testing-library/jest-dom/vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DodgeSteeringPad } from './DodgeSteeringPad';

function mockPadRect(element: HTMLElement) {
  element.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    top: 20,
    left: 40,
    bottom: 116,
    right: 216,
    width: 176,
    height: 96,
    toJSON: () => ({}),
  }));
}

function dispatchPointerEvent(
  element: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'lostpointercapture',
  options: { pointerId: number; clientX?: number; clientY?: number },
) {
  const eventName = {
    pointerdown: 'pointerDown',
    pointermove: 'pointerMove',
    pointerup: 'pointerUp',
    pointercancel: 'pointerCancel',
    lostpointercapture: 'lostPointerCapture',
  }[type] as 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel' | 'lostPointerCapture';
  const event = createEvent[eventName](element);
  Object.defineProperties(event, {
    clientX: { value: options.clientX ?? 0 },
    clientY: { value: options.clientY ?? 0 },
    pointerId: { value: options.pointerId },
  });
  fireEvent(element, event);
}

describe('DodgeSteeringPad', () => {
  test('emits continuous steerX and resets pointer lifecycle', () => {
    const steerValues: number[] = [];
    render(<DodgeSteeringPad steerX={0} onSteerChange={(steerX) => steerValues.push(steerX)} />);

    const pad = screen.getByRole('slider', { name: 'Steer' });
    mockPadRect(pad);
    const setPointerCapture = vi.fn();
    Object.defineProperty(pad, 'setPointerCapture', {
      configurable: true,
      value: setPointerCapture,
    });

    expect(pad).toHaveClass('dodge-steering-pad');

    dispatchPointerEvent(pad, 'pointerdown', { pointerId: 4, clientX: 160, clientY: 68 });
    expect(setPointerCapture).toHaveBeenCalledWith(4);
    expect(steerValues.at(-1)).toBeGreaterThan(0);
    expect(steerValues.at(-1)).toBeLessThan(1);

    dispatchPointerEvent(pad, 'pointermove', { pointerId: 4, clientX: 196, clientY: 68 });
    expect(steerValues.at(-1)).toBeGreaterThan(0.7);

    dispatchPointerEvent(pad, 'pointerup', { pointerId: 4 });
    expect(steerValues.at(-1)).toBe(0);

    dispatchPointerEvent(pad, 'pointerdown', { pointerId: 5, clientX: 96, clientY: 68 });
    dispatchPointerEvent(pad, 'pointercancel', { pointerId: 5 });
    expect(steerValues.at(-1)).toBe(0);

    dispatchPointerEvent(pad, 'pointerdown', { pointerId: 6, clientX: 120, clientY: 68 });
    dispatchPointerEvent(pad, 'lostpointercapture', { pointerId: 6 });
    expect(steerValues.at(-1)).toBe(0);
  });
});
