import '@testing-library/jest-dom/vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { type RaceAnalogVector } from '@blitz/shared';

import { AnalogPad } from './AnalogPad';

function mockPadRect(element: HTMLElement) {
  element.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    top: 10,
    left: 20,
    bottom: 154,
    right: 164,
    width: 144,
    height: 144,
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

describe('AnalogPad', () => {
  test('emits normalized analog vector from pointer movement', () => {
    const vectors: RaceAnalogVector[] = [];

    render(
      <AnalogPad
        label="Steer"
        value={{ x: 0, y: 0, magnitude: 0 }}
        onVectorChange={(vector) => vectors.push(vector)}
      />,
    );

    const pad = screen.getByRole('slider', { name: /steer/i });
    mockPadRect(pad);
    const setPointerCapture = vi.fn();
    Object.defineProperty(pad, 'setPointerCapture', {
      configurable: true,
      value: setPointerCapture,
    });

    dispatchPointerEvent(pad, 'pointerdown', { pointerId: 7, clientX: 164, clientY: 82 });
    expect(setPointerCapture).toHaveBeenCalled();
    expect(vectors.at(-1)).toEqual({ x: 1, y: 0, magnitude: 1 });

    dispatchPointerEvent(pad, 'pointermove', { pointerId: 7, clientX: 92, clientY: 154 });
    expect(vectors.at(-1)).toEqual({ x: 0, y: 1, magnitude: 1 });

    dispatchPointerEvent(pad, 'pointerup', { pointerId: 7 });
    expect(vectors.at(-1)).toEqual({ x: 0, y: 0, magnitude: 0 });

    dispatchPointerEvent(pad, 'pointerdown', { pointerId: 8, clientX: 20, clientY: 10 });
    expect(vectors.at(-1)).toEqual({
      x: -0.707,
      y: -0.707,
      magnitude: 1,
    });

    dispatchPointerEvent(pad, 'pointercancel', { pointerId: 8 });
    expect(vectors.at(-1)).toEqual({ x: 0, y: 0, magnitude: 0 });

    dispatchPointerEvent(pad, 'pointerdown', { pointerId: 9, clientX: 92, clientY: 82 });
    dispatchPointerEvent(pad, 'lostpointercapture', { pointerId: 9 });
    expect(vectors.at(-1)).toEqual({ x: 0, y: 0, magnitude: 0 });
  });
});
