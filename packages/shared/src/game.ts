export const RACE_STATUS = {
  countdown: 'countdown',
  racing: 'racing',
  finished: 'finished',
} as const;

export type RaceStatus = (typeof RACE_STATUS)[keyof typeof RACE_STATUS];

export type SteeringInput = -1 | 0 | 1;

export const RACE_SHELL_MODE_IDS = {
  drag: 'drag',
  dodge: 'dodge',
  circle: 'circle',
  figureEight: 'figure-eight',
} as const;

export type RaceShellModeId =
  (typeof RACE_SHELL_MODE_IDS)[keyof typeof RACE_SHELL_MODE_IDS];

export const RACE_SHELL_STATUS = {
  countdown: 'countdown',
  racing: 'racing',
  finished: 'finished',
} as const;

export type RaceShellStatus = (typeof RACE_SHELL_STATUS)[keyof typeof RACE_SHELL_STATUS];

export const RACE_GAME_INPUT_KIND = {
  analog: 'analog',
  button: 'button',
  action: 'action',
} as const;

export type RaceGameInputKind =
  (typeof RACE_GAME_INPUT_KIND)[keyof typeof RACE_GAME_INPUT_KIND];

export const RACE_GAME_BUTTONS = {
  primary: 'primary',
  secondary: 'secondary',
} as const;

export type RaceGameButton = (typeof RACE_GAME_BUTTONS)[keyof typeof RACE_GAME_BUTTONS];

export const RACE_GAME_BUTTON_STATES = {
  pressed: 'pressed',
  released: 'released',
} as const;

export type RaceGameButtonState =
  (typeof RACE_GAME_BUTTON_STATES)[keyof typeof RACE_GAME_BUTTON_STATES];

export interface RaceAnalogVector {
  x: number;
  y: number;
  magnitude: number;
}

export interface RaceInputBase extends Record<string, unknown> {
  kind: RaceGameInputKind;
  sequence: number;
  clientTimeMs: number;
  modeId: RaceShellModeId;
}

export interface RaceAnalogInput extends RaceInputBase {
  kind: 'analog';
  vector: RaceAnalogVector;
}

export interface RaceButtonInput extends RaceInputBase {
  kind: 'button';
  button: RaceGameButton;
  state: RaceGameButtonState;
}

export interface RaceActionInput extends RaceInputBase {
  kind: 'action';
  action: string;
}

export type RaceGameInput = RaceAnalogInput | RaceButtonInput | RaceActionInput;

export interface RaceShellPlayer {
  playerId: string;
  nickname: string;
  progress: number;
  speed: number;
  penalty: string | null;
}

export interface RaceShellHud {
  objective: string;
  progressLabel: string;
  speedLabel: string;
  penaltyLabel: string;
  inputLabel: string;
  modeMetricLabel: string;
  modeMetricValue: string;
}

export interface RaceShellSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  modeId: RaceShellModeId;
  status: RaceShellStatus;
  countdown: number | null;
  tick: number;
  players: RaceShellPlayer[];
  hud: RaceShellHud;
  mode: Record<string, unknown>;
}

export const DRAG_SHIFT_QUALITY = {
  early: 'early',
  good: 'good',
  perfect: 'perfect',
  late: 'late',
} as const;

export type DragShiftQuality =
  (typeof DRAG_SHIFT_QUALITY)[keyof typeof DRAG_SHIFT_QUALITY];

export interface DragShiftSummary {
  early: number;
  good: number;
  perfect: number;
  late: number;
  total: number;
}

export interface DragShiftWindow {
  goodMinRpm: number;
  perfectMinRpm: number;
  perfectMaxRpm: number;
  goodMaxRpm: number;
  redlineRpm: number;
}

export interface DragGearThrottleInput extends Record<string, unknown> {
  kind: 'drag-throttle';
  pressed: boolean;
  sequence: number;
  clientTimeMs: number;
}

export interface DragGearShiftInput extends Record<string, unknown> {
  kind: 'drag-shift';
  sequence: number;
  clientTimeMs: number;
}

export type DragGearInput = DragGearThrottleInput | DragGearShiftInput;

export interface DragGearPlayerState {
  playerId: string;
  nickname: string;
  gear: number;
  maxGear: number;
  rpm: number;
  speedKmh: number;
  distanceM: number;
  distanceTargetM: number;
  throttlePressed: boolean;
  lastShiftQuality: DragShiftQuality | null;
  shiftSummary: DragShiftSummary;
  finished: boolean;
  finishTimeMs: number | null;
  rank: number | null;
}

export interface DragGearSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  status: RaceStatus;
  tick: number;
  startedAt: number | null;
  countdown: number | null;
  distanceTargetM: number;
  shiftWindow: DragShiftWindow;
  playersState: DragGearPlayerState[];
}

export interface RaceEntrantState {
  nickname: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  lap: number;
  checkpoint: number;
  progress: number;
  penalties: number;
  speed: number;
}

export interface RacePlayerState extends RaceEntrantState {
  playerId: string;
}

export interface RaceBotState extends RaceEntrantState {
  botId: string;
}

export interface RaceSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  status: RaceStatus;
  tick: number;
  startedAt: number | null;
  countdown: number | null;
  playersState: RacePlayerState[];
  botsState: RaceBotState[];
}

export type DragSprintMode = 'finish-line' | 'best-of-3' | 'survival';

export type DragSprintLane = 0 | 1 | 2;

export type DragSprintPowerUpType = 'nitro' | 'shield' | 'magnet' | 'repair';

export type DragSprintObstacleType = 'cone' | 'oil' | 'slow-car' | 'construction';

export type DragSprintPlayerStatus = 'racing' | 'finished' | 'eliminated';

export interface DragSprintPlayerState {
  playerId: string;
  nickname: string;
  lane: DragSprintLane;
  distance: number;
  speed: number;
  status: DragSprintPlayerStatus;
  activePowerUp: DragSprintPowerUpType | null;
}

export interface DragSprintObstacleState {
  id: string;
  type: DragSprintObstacleType;
  lane: DragSprintLane;
  distance: number;
  speed: number;
}

export interface DragSprintPickupState {
  id: string;
  type: DragSprintPowerUpType;
  lane: DragSprintLane;
  distance: number;
}

export interface DragSprintStanding {
  playerId: string;
  nickname: string;
  points: number;
  roundWins: number;
  cumulativeTimeMs: number;
}

export interface DragSprintSnapshot extends Record<string, unknown> {
  sessionId: string;
  lobbyCode: string;
  trackId: string;
  mode: DragSprintMode;
  status: RaceStatus;
  tick: number;
  startedAt: number | null;
  countdown: number | null;
  distanceTarget: number | null;
  round?: number;
  totalRounds?: number;
  standings?: DragSprintStanding[];
  playersState: DragSprintPlayerState[];
  obstacles: DragSprintObstacleState[];
  pickups: DragSprintPickupState[];
}

export interface PlayerInput extends Record<string, unknown> {
  tick: number;
  steer: SteeringInput;
  accelerate: boolean;
  brake: boolean;
}

function roundToThousandth(value: number) {
  return Math.round(value * 1000) / 1000;
}

function clampFiniteNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return roundToThousandth(Math.min(max, Math.max(min, value)));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNonNegative(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function hasFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRaceShellModeId(value: unknown): value is RaceShellModeId {
  return Object.values(RACE_SHELL_MODE_IDS).includes(value as RaceShellModeId);
}

export function clampRaceAnalogVector(vector: RaceAnalogVector): RaceAnalogVector {
  return {
    x: clampFiniteNumber(vector.x, -1, 1),
    y: clampFiniteNumber(vector.y, -1, 1),
    magnitude: clampFiniteNumber(vector.magnitude, 0, 1),
  };
}

// Shared guards help runtimes reject malformed race input; Socket.IO types are not server validation.
export function isRaceGameInput(input: unknown): input is RaceGameInput {
  if (!isObjectRecord(input)) {
    return false;
  }

  if (!isRaceShellModeId(input.modeId)) {
    return false;
  }

  if (!isFiniteNonNegative(input.sequence) || !isFiniteNonNegative(input.clientTimeMs)) {
    return false;
  }

  if (input.kind === RACE_GAME_INPUT_KIND.analog) {
    if (!isObjectRecord(input.vector)) {
      return false;
    }

    const vector = input.vector;
    const x = vector.x;
    const y = vector.y;
    const magnitude = vector.magnitude;

    if (
      !hasFiniteNumber(x) ||
      !hasFiniteNumber(y) ||
      !hasFiniteNumber(magnitude)
    ) {
      return false;
    }

    clampRaceAnalogVector({
      x,
      y,
      magnitude,
    });

    return true;
  }

  if (input.kind === RACE_GAME_INPUT_KIND.button) {
    return (
      Object.values(RACE_GAME_BUTTONS).includes(input.button as RaceGameButton) &&
      Object.values(RACE_GAME_BUTTON_STATES).includes(input.state as RaceGameButtonState)
    );
  }

  if (input.kind === RACE_GAME_INPUT_KIND.action) {
    return typeof input.action === 'string' && input.action.length > 0;
  }

  return false;
}

export const SOFT_COLLISION_PUSHBACK = 18;
export const SOFT_COLLISION_SPEED_PENALTY = 0.85;
export const SOFT_COLLISION_RECOVERY_MS = 250;
