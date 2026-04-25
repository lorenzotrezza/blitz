import { type KeyboardEvent, type PointerEvent } from 'react';

import {
  RACE_GAME_BUTTONS,
  type RaceGameButton,
} from '@blitz/shared';

interface ActionButtonProps {
  label: string;
  button: RaceGameButton;
  pressed?: boolean;
  disabled?: boolean;
  onPressedChange: (pressed: boolean) => void;
}

function isActivationKey(key: string) {
  return key === ' ' || key === 'Enter' || key === 'Spacebar';
}

export function ActionButton({
  label,
  button,
  pressed = false,
  disabled = false,
  onPressedChange,
}: ActionButtonProps) {
  const emitPressed = (nextPressed: boolean) => {
    if (!disabled) {
      onPressedChange(nextPressed);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    emitPressed(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isActivationKey(event.key) || event.repeat) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    emitPressed(true);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isActivationKey(event.key)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    emitPressed(false);
  };

  const buttonClass =
    button === RACE_GAME_BUTTONS.primary
      ? 'game-action-button--primary'
      : 'game-action-button--secondary';

  return (
    <button
      aria-pressed={pressed}
      className={[
        'game-action-button',
        buttonClass,
        pressed ? 'is-pressed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onLostPointerCapture={() => emitPressed(false)}
      onPointerCancel={() => emitPressed(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={() => emitPressed(false)}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      type="button"
    >
      {label}
    </button>
  );
}
