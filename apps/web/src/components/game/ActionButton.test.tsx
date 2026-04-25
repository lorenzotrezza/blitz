import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { RACE_GAME_BUTTONS } from '@blitz/shared';

import { ActionButton } from './ActionButton';

describe('ActionButton', () => {
  test('emits action button press and release states', () => {
    const onPressedChange = vi.fn();

    const { rerender } = render(
      <ActionButton
        label="GO"
        button={RACE_GAME_BUTTONS.primary}
        onPressedChange={onPressedChange}
      />,
    );

    const button = screen.getByRole('button', { name: /go/i });
    const setPointerCapture = vi.fn();
    Object.defineProperty(button, 'setPointerCapture', {
      configurable: true,
      value: setPointerCapture,
    });

    fireEvent.pointerDown(button, { pointerId: 11 });
    expect(setPointerCapture).toHaveBeenCalled();
    expect(onPressedChange).toHaveBeenLastCalledWith(true);

    fireEvent.pointerUp(button, { pointerId: 11 });
    expect(onPressedChange).toHaveBeenLastCalledWith(false);

    fireEvent.pointerDown(button, { pointerId: 12 });
    fireEvent.pointerCancel(button, { pointerId: 12 });
    expect(onPressedChange).toHaveBeenLastCalledWith(false);

    fireEvent.pointerDown(button, { pointerId: 13 });
    fireEvent.lostPointerCapture(button, { pointerId: 13 });
    expect(onPressedChange).toHaveBeenLastCalledWith(false);

    fireEvent.keyDown(button, { key: ' ' });
    expect(onPressedChange).toHaveBeenLastCalledWith(true);

    fireEvent.keyUp(button, { key: ' ' });
    expect(onPressedChange).toHaveBeenLastCalledWith(false);

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onPressedChange).toHaveBeenLastCalledWith(true);

    fireEvent.keyUp(button, { key: 'Enter' });
    expect(onPressedChange).toHaveBeenLastCalledWith(false);

    onPressedChange.mockClear();
    rerender(
      <ActionButton
        label="BRAKE"
        button={RACE_GAME_BUTTONS.secondary}
        disabled={true}
        onPressedChange={onPressedChange}
      />,
    );

    const disabledButton = screen.getByRole('button', { name: /brake/i });
    fireEvent.pointerDown(disabledButton, { pointerId: 14 });
    fireEvent.keyDown(disabledButton, { key: 'Enter' });
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});
