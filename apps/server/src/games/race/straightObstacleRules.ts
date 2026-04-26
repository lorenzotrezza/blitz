import type {
  GameResults,
  StraightObstacleObstacle,
  StraightObstaclePlayerState,
  StraightObstacleResultDetails,
  StraightObstacleWarningState,
} from '@blitz/shared';

export const STRAIGHT_OBSTACLE_TUNING = {
  distanceTarget: 900,
  baseSpeed: 34,
  maxSpeed: 46,
  minSpeed: 18,
  steeringSpeedPerSecond: 1.8,
  playerWidth: 0.18,
  playerDepth: 4,
  obstacleDepth: 6,
  warningDistance: 150,
  slowdownDurationMs: 1250,
  hitSpeedMultiplier: 0.58,
  recoverySpeedPerSecond: 14,
} as const;

export interface StraightObstacleRuleState {
  distanceTarget: number;
  baseSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  warning: StraightObstacleWarningState;
  players: StraightObstaclePlayerState[];
  obstacles: StraightObstacleObstacle[];
}

export interface CreateStraightObstacleStateOptions {
  players: Array<{ playerId: string; nickname: string }>;
  obstacles?: StraightObstacleObstacle[];
  distanceTarget?: number;
  baseSpeed?: number;
  maxSpeed?: number;
  minSpeed?: number;
}

export interface StraightObstacleFrame {
  nowMs: number;
  deltaMs: number;
  elapsedMs?: number;
}

export type StraightObstacleIntent =
  | {
      steerX?: unknown;
    }
  | null
  | undefined;

const ROAD_CENTER_LIMIT = 1 - STRAIGHT_OBSTACLE_TUNING.playerWidth;

const OBSTACLE_WAVE_TEMPLATES = [
  [-0.45, 0.35],
  [0, 0.52],
  [-0.6, 0.05, 0.62],
  [-0.7, -0.2, 0.42],
  [-0.38, 0.18, 0.68],
] as const;

export function clampSteerX(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return clamp(value, -1, 1);
}

export function generateStraightObstacleWaves(
  seed: string,
  distanceTarget: number = STRAIGHT_OBSTACLE_TUNING.distanceTarget,
): StraightObstacleObstacle[] {
  const target = Math.max(0, distanceTarget);
  const templateOffset = hashSeed(seed) % OBSTACLE_WAVE_TEMPLATES.length;
  const obstacles: StraightObstacleObstacle[] = [];
  let distance = 180;
  let waveIndex = 0;

  while (distance < target) {
    const template =
      OBSTACLE_WAVE_TEMPLATES[(templateOffset + waveIndex) % OBSTACLE_WAVE_TEMPLATES.length]!;
    const waveId = `wave-${waveIndex + 1}`;

    for (const [obstacleIndex, centerX] of template.entries()) {
      obstacles.push({
        id: `${waveId}-obstacle-${obstacleIndex + 1}`,
        waveId,
        centerX,
        width: 0.24,
        distance,
        depth: STRAIGHT_OBSTACLE_TUNING.obstacleDepth,
        warningDistance: STRAIGHT_OBSTACLE_TUNING.warningDistance,
        hitPlayerIds: [],
      });
    }

    waveIndex += 1;
    distance += 95 + Math.min(waveIndex, 4) * 8;
  }

  return obstacles;
}

export function createInitialStraightObstacleState(
  options: CreateStraightObstacleStateOptions,
): StraightObstacleRuleState {
  const distanceTarget =
    options.distanceTarget ?? STRAIGHT_OBSTACLE_TUNING.distanceTarget;
  const baseSpeed = options.baseSpeed ?? STRAIGHT_OBSTACLE_TUNING.baseSpeed;
  const maxSpeed = options.maxSpeed ?? STRAIGHT_OBSTACLE_TUNING.maxSpeed;
  const minSpeed = options.minSpeed ?? STRAIGHT_OBSTACLE_TUNING.minSpeed;

  return {
    distanceTarget,
    baseSpeed,
    maxSpeed,
    minSpeed,
    warning: 'Road clear',
    players: options.players.map((player) => ({
      playerId: player.playerId,
      nickname: player.nickname,
      x: 0,
      distance: 0,
      speed: baseSpeed,
      progress: 0,
      obstacleHits: 0,
      slowdownUntilMs: null,
      finishedAtMs: null,
      status: 'racing',
    })),
    obstacles: (options.obstacles ?? generateStraightObstacleWaves('straight-obstacle', distanceTarget))
      .map((obstacle) => ({
        ...obstacle,
        hitPlayerIds: [...obstacle.hitPlayerIds],
      })),
  };
}

export function advanceStraightObstacleRace(
  state: StraightObstacleRuleState,
  intents: Map<string, StraightObstacleIntent> | Record<string, StraightObstacleIntent>,
  frame: StraightObstacleFrame,
): StraightObstacleRuleState {
  const deltaMs = clampFinite(frame.deltaMs, 0, 1000);
  const deltaSeconds = deltaMs / 1000;
  const nowMs = Number.isFinite(frame.nowMs) ? frame.nowMs : 0;
  const obstacles = state.obstacles.map((obstacle) => ({
    ...obstacle,
    hitPlayerIds: [...obstacle.hitPlayerIds],
  }));
  let hitThisFrame = false;

  const players = state.players.map((player) => {
    if (player.status === 'finished') {
      return player;
    }

    const intent = getIntent(intents, player.playerId);
    const steerX = clampSteerX(intent?.steerX);
    const recoveredSpeed =
      player.slowdownUntilMs !== null && nowMs >= player.slowdownUntilMs
        ? clamp(
            player.speed + STRAIGHT_OBSTACLE_TUNING.recoverySpeedPerSecond * deltaSeconds,
            state.minSpeed,
            Math.min(state.baseSpeed, state.maxSpeed),
          )
        : clamp(player.speed, state.minSpeed, state.maxSpeed);
    const nextX = clamp(
      player.x + steerX * STRAIGHT_OBSTACLE_TUNING.steeringSpeedPerSecond * deltaSeconds,
      -ROAD_CENTER_LIMIT,
      ROAD_CENTER_LIMIT,
    );
    const nextDistance = clamp(
      player.distance + recoveredSpeed * deltaSeconds,
      0,
      state.distanceTarget,
    );

    let nextPlayer: StraightObstaclePlayerState = {
      ...player,
      x: roundMetric(nextX),
      distance: roundMetric(nextDistance),
      speed: roundMetric(recoveredSpeed),
      progress: roundMetric(nextDistance / state.distanceTarget),
      slowdownUntilMs:
        player.slowdownUntilMs !== null && nowMs >= player.slowdownUntilMs
          ? null
          : player.slowdownUntilMs,
    };

    for (const obstacle of obstacles) {
      if (
        obstacle.hitPlayerIds.includes(nextPlayer.playerId) ||
        !detectObstacleHit(nextPlayer, obstacle)
      ) {
        continue;
      }

      obstacle.hitPlayerIds.push(nextPlayer.playerId);
      hitThisFrame = true;
      nextPlayer = {
        ...nextPlayer,
        obstacleHits: nextPlayer.obstacleHits + 1,
        speed: roundMetric(
          Math.max(
            state.minSpeed,
            nextPlayer.speed * STRAIGHT_OBSTACLE_TUNING.hitSpeedMultiplier,
          ),
        ),
        slowdownUntilMs: nowMs + STRAIGHT_OBSTACLE_TUNING.slowdownDurationMs,
      };
    }

    if (nextPlayer.distance >= state.distanceTarget) {
      const finishTimeMs =
        typeof frame.elapsedMs === 'number' && Number.isFinite(frame.elapsedMs)
          ? Math.max(0, frame.elapsedMs)
          : nowMs;

      nextPlayer = {
        ...nextPlayer,
        distance: state.distanceTarget,
        progress: 1,
        status: 'finished',
        finishedAtMs: nextPlayer.finishedAtMs ?? finishTimeMs,
      };
    }

    return nextPlayer;
  });

  return {
    ...state,
    players,
    obstacles,
    warning: buildWarning(players, obstacles, state.distanceTarget, hitThisFrame, nowMs),
  };
}

export function detectObstacleHit(
  player: Pick<StraightObstaclePlayerState, 'x' | 'distance'>,
  obstacle: Pick<StraightObstacleObstacle, 'centerX' | 'width' | 'distance' | 'depth'>,
): boolean {
  const playerLeft = player.x - STRAIGHT_OBSTACLE_TUNING.playerWidth / 2;
  const playerRight = player.x + STRAIGHT_OBSTACLE_TUNING.playerWidth / 2;
  const obstacleLeft = obstacle.centerX - obstacle.width / 2;
  const obstacleRight = obstacle.centerX + obstacle.width / 2;
  const playerNear = player.distance - STRAIGHT_OBSTACLE_TUNING.playerDepth / 2;
  const playerFar = player.distance + STRAIGHT_OBSTACLE_TUNING.playerDepth / 2;
  const obstacleNear = obstacle.distance - obstacle.depth / 2;
  const obstacleFar = obstacle.distance + obstacle.depth / 2;

  return spansOverlap(playerLeft, playerRight, obstacleLeft, obstacleRight) &&
    spansOverlap(playerNear, playerFar, obstacleNear, obstacleFar);
}

export function buildStraightObstacleResults(state: StraightObstacleRuleState): GameResults {
  const rankings = [...state.players]
    .sort((left, right) => {
      if (left.finishedAtMs !== null && right.finishedAtMs !== null) {
        return left.finishedAtMs - right.finishedAtMs;
      }

      if (left.finishedAtMs !== null) {
        return -1;
      }

      if (right.finishedAtMs !== null) {
        return 1;
      }

      return right.distance - left.distance;
    })
    .map((player, index) => {
      const details: StraightObstacleResultDetails = {
        finishTimeMs: player.finishedAtMs,
        obstacleHits: player.obstacleHits,
      };

      return {
        playerId: player.playerId,
        rank: index + 1,
        label:
          player.finishedAtMs === null
            ? `${Math.round(player.distance)}m · ${player.obstacleHits} hits`
            : `${(player.finishedAtMs / 1000).toFixed(1)}s · ${player.obstacleHits} hits`,
        value: player.finishedAtMs ?? Math.round(player.distance),
        details,
      };
    });

  return {
    rankings,
  };
}

function buildWarning(
  players: StraightObstaclePlayerState[],
  obstacles: StraightObstacleObstacle[],
  distanceTarget: number,
  hitThisFrame: boolean,
  nowMs: number,
): StraightObstacleWarningState {
  if (hitThisFrame) {
    return 'Hit - recovering';
  }

  if (
    players.some(
      (player) => player.slowdownUntilMs !== null && nowMs < player.slowdownUntilMs,
    )
  ) {
    return 'Slowdown';
  }

  const racingPlayers = players.filter((player) => player.status !== 'finished');

  for (const player of racingPlayers) {
    for (const obstacle of obstacles) {
      if (obstacle.hitPlayerIds.includes(player.playerId)) {
        continue;
      }

      const aheadDistance = obstacle.distance - player.distance;

      if (
        aheadDistance >= 0 &&
        aheadDistance <= Math.min(obstacle.warningDistance, distanceTarget)
      ) {
        return 'Obstacle ahead';
      }
    }
  }

  return 'Road clear';
}

function getIntent(
  intents: Map<string, StraightObstacleIntent> | Record<string, StraightObstacleIntent>,
  playerId: string,
): StraightObstacleIntent {
  if (intents instanceof Map) {
    return intents.get(playerId);
  }

  return intents[playerId];
}

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}

function spansOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
) {
  return leftStart <= rightEnd && rightStart <= leftEnd;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampFinite(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return clamp(value, min, max);
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}
