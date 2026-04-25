export const RACE_STATUS = {
  countdown: 'countdown',
  racing: 'racing',
  finished: 'finished',
} as const;

export type RaceStatus = (typeof RACE_STATUS)[keyof typeof RACE_STATUS];

export type SteeringInput = -1 | 0 | 1;

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
  playersState: DragSprintPlayerState[];
  obstacles: DragSprintObstacleState[];
  pickups: DragSprintPickupState[];
}

export interface PlayerInput {
  tick: number;
  steer: SteeringInput;
  accelerate: boolean;
  brake: boolean;
}

export const SOFT_COLLISION_PUSHBACK = 18;
export const SOFT_COLLISION_SPEED_PENALTY = 0.85;
export const SOFT_COLLISION_RECOVERY_MS = 250;
