import { useRef, type PointerEvent } from 'react';

interface DodgeSteeringPadProps {
  steerX: number;
  disabled?: boolean;
  onSteerChange: (steerX: number) => void;
}

function clampSteer(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(-1, value));
}

function calculateSteerX(element: HTMLElement, clientX: number) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const radius = Math.max(1, rect.width / 2);

  return clampSteer((clientX - centerX) / radius);
}

export function DodgeSteeringPad({
  steerX,
  disabled = false,
  onSteerChange,
}: DodgeSteeringPadProps) {
  const activePointerIdRef = useRef<number | null>(null);
  const clampedSteerX = clampSteer(steerX);

  const reset = () => {
    if (!disabled) {
      activePointerIdRef.current = null;
      onSteerChange(0);
    }
  };

  const updateSteer = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    onSteerChange(calculateSteerX(event.currentTarget, event.clientX));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSteerChange(calculateSteerX(event.currentTarget, event.clientX));
  };

  const classes = [
    'dodge-steering-pad',
    clampedSteerX < -0.05 ? 'is-active-left' : '',
    clampedSteerX > 0.05 ? 'is-active-right' : '',
    disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      aria-disabled={disabled}
      aria-label="Steer"
      aria-valuemax={1}
      aria-valuemin={-1}
      aria-valuenow={Number(clampedSteerX.toFixed(3))}
      className={classes}
      onLostPointerCapture={reset}
      onPointerCancel={reset}
      onPointerDown={handlePointerDown}
      onPointerMove={updateSteer}
      onPointerUp={reset}
      role="slider"
      tabIndex={disabled ? -1 : 0}
    >
      <span aria-hidden="true" className="dodge-steering-pad__track" />
      <span
        aria-hidden="true"
        className="dodge-steering-pad__knob"
        style={{ transform: `translateX(${clampedSteerX * 64}px)` }}
      />
    </div>
  );
}
