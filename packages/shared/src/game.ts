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

export interface PlayerInput {
  tick: number;
  steer: SteeringInput;
  accelerate: boolean;
  brake: boolean;
}

export const SOFT_COLLISION_PUSHBACK = 18;
export const SOFT_COLLISION_SPEED_PENALTY = 0.85;
export const SOFT_COLLISION_RECOVERY_MS = 250;
