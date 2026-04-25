import { useCallback, useEffect, useRef, useState } from 'react';

import {
  clampRaceAnalogVector,
  RACE_GAME_BUTTONS,
  RACE_GAME_BUTTON_STATES,
  type RaceAnalogVector,
  type RaceGameButton,
  type RaceGameInput,
  type RaceShellModeId,
} from '@blitz/shared';

interface GameControlsOptions {
  modeId: RaceShellModeId;
  enabled?: boolean;
  onInput: (input: RaceGameInput) => void;
}

interface GameControlsState {
  analog: RaceAnalogVector;
  primaryPressed: boolean;
  secondaryPressed: boolean;
}

type RaceInputDraft =
  | { kind: 'analog'; vector: RaceAnalogVector }
  | { kind: 'button'; button: RaceGameButton; state: 'pressed' | 'released' }
  | { kind: 'action'; action: string };

const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const UP_KEYS = new Set(['ArrowUp', 'w', 'W']);
const DOWN_KEYS = new Set(['ArrowDown', 's', 'S']);
const PRIMARY_KEYS = new Set([' ', 'Spacebar', 'Enter']);
const SECONDARY_KEYS = new Set(['Shift', 'Control']);

export function createNeutralAnalogVector(): RaceAnalogVector {
  return { x: 0, y: 0, magnitude: 0 };
}

function normalizeKeyboardAxis(negative: boolean, positive: boolean) {
  if (negative === positive) {
    return 0;
  }

  return negative ? -1 : 1;
}

function isNeutralAnalogVector(vector: RaceAnalogVector) {
  return vector.x === 0 && vector.y === 0 && vector.magnitude === 0;
}

function isPrimaryKey(key: string) {
  return PRIMARY_KEYS.has(key);
}

function isSecondaryKey(key: string) {
  return SECONDARY_KEYS.has(key);
}

function keySetHasAny(keys: Set<string>, candidates: Set<string>) {
  for (const candidate of candidates) {
    if (keys.has(candidate)) {
      return true;
    }
  }

  return false;
}

export function combineKeyboardVector(keys: Set<string>): RaceAnalogVector {
  const rawX = normalizeKeyboardAxis(
    keySetHasAny(keys, LEFT_KEYS),
    keySetHasAny(keys, RIGHT_KEYS),
  );
  const rawY = normalizeKeyboardAxis(keySetHasAny(keys, UP_KEYS), keySetHasAny(keys, DOWN_KEYS));
  const rawMagnitude = Math.hypot(rawX, rawY);

  if (rawMagnitude === 0) {
    return createNeutralAnalogVector();
  }

  const magnitude = Math.min(rawMagnitude, 1);
  const divisor = rawMagnitude > 1 ? rawMagnitude : 1;

  return clampRaceAnalogVector({
    x: rawX / divisor,
    y: rawY / divisor,
    magnitude,
  });
}

export function useGameControls({
  modeId,
  enabled = true,
  onInput,
}: GameControlsOptions) {
  const sequenceRef = useRef(0);
  const onInputRef = useRef(onInput);
  const modeIdRef = useRef(modeId);
  const enabledRef = useRef(enabled);
  const pressedKeysRef = useRef(new Set<string>());
  const analogRef = useRef(createNeutralAnalogVector());
  const primaryPressedRef = useRef(false);
  const secondaryPressedRef = useRef(false);
  const [state, setState] = useState<GameControlsState>({
    analog: createNeutralAnalogVector(),
    primaryPressed: false,
    secondaryPressed: false,
  });

  useEffect(() => {
    onInputRef.current = onInput;
    modeIdRef.current = modeId;
    enabledRef.current = enabled;
  }, [enabled, modeId, onInput]);

  const emitInput = useCallback((input: RaceInputDraft) => {
    if (!enabledRef.current) {
      return;
    }

    sequenceRef.current += 1;
    onInputRef.current({
      ...input,
      modeId: modeIdRef.current,
      sequence: sequenceRef.current,
      clientTimeMs: Date.now(),
    } as RaceGameInput);
  }, []);

  const setAnalogVector = useCallback(
    (vector: RaceAnalogVector) => {
      const next = clampRaceAnalogVector(vector);
      analogRef.current = next;
      setState((current) => ({ ...current, analog: next }));
      emitInput({ kind: 'analog', vector: next });
    },
    [emitInput],
  );

  const setButtonState = useCallback(
    (button: RaceGameButton, pressed: boolean) => {
      const ref = button === RACE_GAME_BUTTONS.primary ? primaryPressedRef : secondaryPressedRef;

      if (ref.current === pressed) {
        return;
      }

      ref.current = pressed;
      setState((current) => ({
        ...current,
        primaryPressed: button === RACE_GAME_BUTTONS.primary ? pressed : current.primaryPressed,
        secondaryPressed: button === RACE_GAME_BUTTONS.secondary ? pressed : current.secondaryPressed,
      }));
      emitInput({
        kind: 'button',
        button,
        state: pressed ? RACE_GAME_BUTTON_STATES.pressed : RACE_GAME_BUTTON_STATES.released,
      });
    },
    [emitInput],
  );

  const emitAction = useCallback(
    (action: string) => {
      emitInput({ kind: 'action', action });
    },
    [emitInput],
  );

  const resetInput = useCallback(() => {
    pressedKeysRef.current.clear();

    const shouldReleasePrimary = primaryPressedRef.current;
    const shouldReleaseSecondary = secondaryPressedRef.current;
    const shouldResetAnalog = !isNeutralAnalogVector(analogRef.current);

    primaryPressedRef.current = false;
    secondaryPressedRef.current = false;
    analogRef.current = createNeutralAnalogVector();
    setState({
      analog: createNeutralAnalogVector(),
      primaryPressed: false,
      secondaryPressed: false,
    });

    if (shouldReleasePrimary) {
      emitInput({
        kind: 'button',
        button: RACE_GAME_BUTTONS.primary,
        state: RACE_GAME_BUTTON_STATES.released,
      });
    }

    if (shouldReleaseSecondary) {
      emitInput({
        kind: 'button',
        button: RACE_GAME_BUTTONS.secondary,
        state: RACE_GAME_BUTTON_STATES.released,
      });
    }

    if (shouldResetAnalog) {
      emitInput({ kind: 'analog', vector: createNeutralAnalogVector() });
    }
  }, [emitInput]);

  useEffect(() => {
    if (!enabled) {
      resetInput();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabledRef.current) {
        return;
      }

      if (LEFT_KEYS.has(event.key) || RIGHT_KEYS.has(event.key) || UP_KEYS.has(event.key) || DOWN_KEYS.has(event.key)) {
        event.preventDefault();
        pressedKeysRef.current.add(event.key);
        setAnalogVector(combineKeyboardVector(pressedKeysRef.current));
        return;
      }

      if (isPrimaryKey(event.key)) {
        event.preventDefault();
        if (!event.repeat) {
          setButtonState(RACE_GAME_BUTTONS.primary, true);
        }
        return;
      }

      if (isSecondaryKey(event.key)) {
        event.preventDefault();
        if (!event.repeat) {
          setButtonState(RACE_GAME_BUTTONS.secondary, true);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (LEFT_KEYS.has(event.key) || RIGHT_KEYS.has(event.key) || UP_KEYS.has(event.key) || DOWN_KEYS.has(event.key)) {
        event.preventDefault();
        pressedKeysRef.current.delete(event.key);
        setAnalogVector(combineKeyboardVector(pressedKeysRef.current));
        return;
      }

      if (isPrimaryKey(event.key)) {
        event.preventDefault();
        setButtonState(RACE_GAME_BUTTONS.primary, false);
        return;
      }

      if (isSecondaryKey(event.key)) {
        event.preventDefault();
        setButtonState(RACE_GAME_BUTTONS.secondary, false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        resetInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetInput);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetInput);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resetInput();
    };
  }, [enabled, resetInput, setAnalogVector, setButtonState]);

  return {
    setAnalogVector,
    setButtonState,
    emitAction,
    resetInput,
    state,
  };
}
