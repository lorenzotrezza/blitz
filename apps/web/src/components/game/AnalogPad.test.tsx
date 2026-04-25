import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

    fireEvent.pointerDown(pad, { pointerId: 7, clientX: 164, clientY: 82 });
    expect(setPointerCapture).toHaveBeenCalledWith(7);
    expect(vectors.at(-1)).toEqual({ x: 1, y: 0, magnitude: 1 });

    fireEvent.pointerMove(pad, { pointerId: 7, clientX: 92, clientY: 154 });
    expect(vectors.at(-1)).toEqual({ x: 0, y: 1, magnitude: 1 });

    fireEvent.pointerUp(pad, { pointerId: 7 });
    expect(vectors.at(-1)).toEqual({ x: 0, y: 0, magnitude: 0 });

    fireEvent.pointerDown(pad, { pointerId: 8, clientX: 20, clientY: 10 });
    expect(vectors.at(-1)).toEqual({
      x: -0.707,
      y: -0.707,
      magnitude: 1,
    });

    fireEvent.pointerCancel(pad, { pointerId: 8 });
    expect(vectors.at(-1)).toEqual({ x: 0, y: 0, magnitude: 0 });

    fireEvent.pointerDown(pad, { pointerId: 9, clientX: 92, clientY: 82 });
    fireEvent.lostPointerCapture(pad, { pointerId: 9 });
    expect(vectors.at(-1)).toEqual({ x: 0, y: 0, magnitude: 0 });
  });
});
