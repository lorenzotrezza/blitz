import { useCallback, useEffect, useRef, useState } from 'react';

import { type StraightObstacleInput } from '@blitz/shared';

interface DodgeRaceControlsOptions {
  enabled?: boolean;
  onInput: (input: StraightObstacleInput) => void;
}

const LEFT_KEYS = new Set(['ArrowLeft', 'a']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd']);

function normalizeKey(key: string) {
  return key.length === 1 ? key.toLowerCase() : key;
}

function clampSteerX(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(-1, value));
}

function keySetHasAny(keys: Set<string>, candidates: Set<string>) {
  for (const candidate of candidates) {
    if (keys.has(candidate)) {
      return true;
    }
  }

  return false;
}

function combineKeyboardSteer(keys: Set<string>) {
  const steerLeft = keySetHasAny(keys, LEFT_KEYS);
  const steerRight = keySetHasAny(keys, RIGHT_KEYS);

  if (steerLeft === steerRight) {
    return 0;
  }

  return steerLeft ? -1 : 1;
}

export function useDodgeRaceControls({
  enabled = true,
  onInput,
}: DodgeRaceControlsOptions) {
  const [steerX, setSteerXState] = useState(0);
  const sequenceRef = useRef(0);
  const steerXRef = useRef(0);
  const enabledRef = useRef(enabled);
  const onInputRef = useRef(onInput);
  const pressedKeysRef = useRef(new Set<string>());

  useEffect(() => {
    enabledRef.current = enabled;
    onInputRef.current = onInput;
  }, [enabled, onInput]);

  const emitSteer = useCallback((nextSteerX: number) => {
    if (!enabledRef.current) {
      return;
    }

    const normalized = clampSteerX(nextSteerX);
    sequenceRef.current += 1;
    steerXRef.current = normalized;
    setSteerXState(normalized);
    onInputRef.current({
      mode: 'straight-obstacle',
      kind: 'steer',
      steerX: normalized,
      sequence: sequenceRef.current,
      clientTimeMs: Date.now(),
    });
  }, []);

  const setSteerX = useCallback(
    (nextSteerX: number) => {
      emitSteer(nextSteerX);
    },
    [emitSteer],
  );

  const resetSteering = useCallback(() => {
    pressedKeysRef.current.clear();

    if (steerXRef.current !== 0) {
      emitSteer(0);
      return;
    }

    steerXRef.current = 0;
    setSteerXState(0);
  }, [emitSteer]);

  useEffect(() => {
    if (!enabled) {
      resetSteering();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabledRef.current) {
        return;
      }

      const key = normalizeKey(event.key);
      if (!LEFT_KEYS.has(key) && !RIGHT_KEYS.has(key)) {
        return;
      }

      event.preventDefault();
      pressedKeysRef.current.add(key);
      emitSteer(combineKeyboardSteer(pressedKeysRef.current));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key);
      if (!LEFT_KEYS.has(key) && !RIGHT_KEYS.has(key)) {
        return;
      }

      event.preventDefault();
      pressedKeysRef.current.delete(key);
      emitSteer(combineKeyboardSteer(pressedKeysRef.current));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        resetSteering();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetSteering);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetSteering);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resetSteering();
    };
  }, [emitSteer, enabled, resetSteering]);

  return {
    steerX,
    setSteerX,
    resetSteering,
  };
}
