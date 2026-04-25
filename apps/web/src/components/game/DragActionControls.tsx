import { type KeyboardEvent, type PointerEvent, useRef } from 'react';

import { type RACE_GAME_BUTTONS } from '@blitz/shared';

import { type useGameControls } from './useGameControls';

interface DragActionControlsProps {
  controls: ReturnType<typeof useGameControls>;
  disabled?: boolean;
}

type PrimaryButton = typeof RACE_GAME_BUTTONS.primary;

function isThrottleKey(key: string) {
  return key === ' ' || key === 'Spacebar' || key === 'Enter' || key === 'ArrowUp';
}

function isShiftKey(key: string) {
  return key === ' ' || key === 'Spacebar' || key === 'Enter' || key === 'Shift';
}

export function DragActionControls({ controls, disabled = false }: DragActionControlsProps) {
  const shiftPressedRef = useRef(false);
  const ignoreNextShiftClickRef = useRef(false);

  const setThrottlePressed = (pressed: boolean) => {
    if (!disabled) {
      controls.setButtonState('primary' as PrimaryButton, pressed);
    }
  };

  const fireShift = () => {
    if (!disabled && !shiftPressedRef.current) {
      shiftPressedRef.current = true;
      controls.emitAction('shift');
    }
  };

  const releaseShift = () => {
    shiftPressedRef.current = false;
  };

  const handleThrottlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setThrottlePressed(true);
  };

  const handleShiftPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    ignoreNextShiftClickRef.current = true;
    fireShift();
  };

  const handleThrottleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isThrottleKey(event.key) || event.repeat) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setThrottlePressed(true);
  };

  const handleThrottleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isThrottleKey(event.key)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setThrottlePressed(false);
  };

  const handleShiftKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isShiftKey(event.key) || event.repeat) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    fireShift();
  };

  const handleShiftKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isShiftKey(event.key)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    releaseShift();
  };

  return (
    <div className="drag-action-controls">
      <button
        aria-label="THROTTLE"
        aria-pressed={controls.state.primaryPressed}
        className={[
          'drag-action-controls__throttle',
          controls.state.primaryPressed ? 'is-pressed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        onBlur={() => setThrottlePressed(false)}
        onKeyDown={handleThrottleKeyDown}
        onKeyUp={handleThrottleKeyUp}
        onLostPointerCapture={() => setThrottlePressed(false)}
        onPointerCancel={() => setThrottlePressed(false)}
        onPointerDown={handleThrottlePointerDown}
        onPointerUp={() => setThrottlePressed(false)}
        type="button"
      >
        <span className="drag-action-controls__label">THROTTLE</span>
        <strong>Hold Throttle</strong>
      </button>

      <button
        aria-label="SHIFT"
        className="drag-action-controls__shift"
        disabled={disabled}
        onBlur={releaseShift}
        onClick={() => {
          if (ignoreNextShiftClickRef.current) {
            ignoreNextShiftClickRef.current = false;
            return;
          }

          fireShift();
          releaseShift();
        }}
        onKeyDown={handleShiftKeyDown}
        onKeyUp={handleShiftKeyUp}
        onLostPointerCapture={releaseShift}
        onPointerCancel={releaseShift}
        onPointerDown={handleShiftPointerDown}
        onPointerUp={releaseShift}
        type="button"
      >
        SHIFT
      </button>
    </div>
  );
}
