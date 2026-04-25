import { useRef, type PointerEvent } from 'react';

import {
  clampRaceAnalogVector,
  type RaceAnalogVector,
} from '@blitz/shared';

import { createNeutralAnalogVector } from './useGameControls';

interface AnalogPadProps {
  label?: string;
  value: RaceAnalogVector;
  disabled?: boolean;
  onVectorChange: (vector: RaceAnalogVector) => void;
}

function calculateAnalogVector(element: HTMLElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const rawX = (clientX - centerX) / radius;
  const rawY = (clientY - centerY) / radius;
  const distance = Math.hypot(rawX, rawY);
  const divisor = distance > 1 ? distance : 1;

  return clampRaceAnalogVector({
    x: rawX / divisor,
    y: rawY / divisor,
    magnitude: Math.min(distance, 1),
  });
}

export function AnalogPad({
  label = 'Analog control',
  value,
  disabled = false,
  onVectorChange,
}: AnalogPadProps) {
  const activePointerIdRef = useRef<number | null>(null);

  const reset = () => {
    if (!disabled) {
      activePointerIdRef.current = null;
      onVectorChange(createNeutralAnalogVector());
    }
  };

  const updateVector = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    onVectorChange(calculateAnalogVector(event.currentTarget, event.clientX, event.clientY));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onVectorChange(calculateAnalogVector(event.currentTarget, event.clientX, event.clientY));
  };

  return (
    <div
      aria-disabled={disabled}
      aria-label={label}
      aria-valuemax={1}
      aria-valuemin={0}
      aria-valuenow={Number(value.magnitude.toFixed(3))}
      className="game-analog-pad"
      onLostPointerCapture={reset}
      onPointerCancel={reset}
      onPointerDown={handlePointerDown}
      onPointerMove={updateVector}
      onPointerUp={reset}
      role="slider"
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      tabIndex={disabled ? -1 : 0}
    >
      <span
        aria-hidden="true"
        className="game-analog-knob"
        style={{
          transform: `translate(${value.x * 42}px, ${value.y * 42}px)`,
        }}
      />
    </div>
  );
}
