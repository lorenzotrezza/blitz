import {
  RACE_STATUS,
  SOFT_COLLISION_SPEED_PENALTY,
  type LobbyState,
  type PlayerInput,
  type RaceFinishedPayload,
  type RacePlayerState,
  type RaceSnapshot,
  type RaceStanding,
} from '@blitz/shared';

const DEFAULT_COUNTDOWN = 3;
const TRACK_CENTER_X = 210;
const TRACK_CENTER_Y = 250;
const TRACK_RADIUS_X = 118;
const TRACK_RADIUS_Y = 168;
const LANE_MIN = 0.22;
const LANE_MAX = 0.78;

export interface RaceSession {
  snapshot: RaceSnapshot;
  laneByPlayerId: Record<string, number>;
  finishTimesMs: Record<string, number | null>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function projectPose(
  progress: number,
  lane: number,
  previous: RacePlayerState,
): RacePlayerState {
  const angle = progress * Math.PI * 2 - Math.PI / 2;
  const laneOffset = (lane - 0.5) * 82;
  const nextX = TRACK_CENTER_X + Math.cos(angle) * (TRACK_RADIUS_X + laneOffset);
  const nextY = TRACK_CENTER_Y + Math.sin(angle) * (TRACK_RADIUS_Y + laneOffset * 0.35);
  const normalizedProgress = clamp(progress, 0, 1);

  return {
    ...previous,
    x: nextX,
    y: nextY,
    vx: nextX - previous.x,
    vy: nextY - previous.y,
    angle,
    lap: normalizedProgress >= 1 ? 1 : 0,
    checkpoint: Math.min(3, Math.floor(normalizedProgress * 4)),
    progress: normalizedProgress,
  };
}

function createPlayerState(lobby: LobbyState, playerIndex: number): RacePlayerState {
  const player = lobby.players[playerIndex]!;
  const lane = clamp(0.4 + playerIndex * 0.14, LANE_MIN, LANE_MAX);
  const seedState: RacePlayerState = {
    playerId: player.id,
    nickname: player.nickname,
    x: TRACK_CENTER_X,
    y: TRACK_CENTER_Y + TRACK_RADIUS_Y,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    lap: 0,
    checkpoint: 0,
    progress: 0,
    penalties: 0,
    speed: 0,
  };

  return projectPose(0, lane, seedState);
}

function sortStandings(
  playersState: RaceSnapshot['playersState'],
  finishTimesMs: Record<string, number | null>,
): RaceStanding[] {
  return [...playersState]
    .sort((left, right) => {
      const leftFinish = finishTimesMs[left.playerId];
      const rightFinish = finishTimesMs[right.playerId];

      if (leftFinish !== null && rightFinish !== null) {
        return leftFinish - rightFinish;
      }

      if (leftFinish !== null) {
        return -1;
      }

      if (rightFinish !== null) {
        return 1;
      }

      return right.progress - left.progress;
    })
    .map((player, index) => ({
      entrantId: player.playerId,
      entrantType: 'player' as const,
      position: index + 1,
      finishTimeMs: finishTimesMs[player.playerId],
    }));
}

function ensureFinishTimes(
  session: RaceSession,
  now: number,
): Record<string, number | null> {
  const startedAt = session.snapshot.startedAt ?? now;
  const finishTimesMs = { ...session.finishTimesMs };

  for (const player of session.snapshot.playersState) {
    if (player.progress >= 1 && finishTimesMs[player.playerId] === null) {
      finishTimesMs[player.playerId] = now - startedAt;
    }
  }

  return finishTimesMs;
}

function applySoftCollision(
  playersState: RaceSnapshot['playersState'],
  laneByPlayerId: Record<string, number>,
  playerId: string,
): { playersState: RaceSnapshot['playersState']; laneByPlayerId: Record<string, number> } {
  const nextPlayers = playersState.map((player) => ({ ...player }));
  const nextLanes = { ...laneByPlayerId };
  const currentIndex = nextPlayers.findIndex((player) => player.playerId === playerId);

  if (currentIndex < 0) {
    return {
      playersState: nextPlayers,
      laneByPlayerId: nextLanes,
    };
  }

  for (let index = 0; index < nextPlayers.length; index += 1) {
    if (index === currentIndex) {
      continue;
    }

    const active = nextPlayers[currentIndex]!;
    const other = nextPlayers[index]!;

    if (active.progress >= 1 || other.progress >= 1) {
      continue;
    }

    const progressGap = Math.abs(active.progress - other.progress);
    const laneGap = Math.abs(nextLanes[active.playerId] - nextLanes[other.playerId]);

    if (progressGap > 0.025 || laneGap > 0.08) {
      continue;
    }

    const direction = nextLanes[active.playerId] <= nextLanes[other.playerId] ? -1 : 1;

    nextLanes[active.playerId] = clamp(nextLanes[active.playerId] + direction * 0.03, LANE_MIN, LANE_MAX);
    nextLanes[other.playerId] = clamp(nextLanes[other.playerId] - direction * 0.03, LANE_MIN, LANE_MAX);

    nextPlayers[currentIndex] = projectPose(active.progress, nextLanes[active.playerId], {
      ...active,
      speed: active.speed * SOFT_COLLISION_SPEED_PENALTY,
      penalties: active.penalties + 1,
    });
    nextPlayers[index] = projectPose(other.progress, nextLanes[other.playerId], {
      ...other,
      speed: other.speed * SOFT_COLLISION_SPEED_PENALTY,
      penalties: other.penalties + 1,
    });
  }

  return {
    playersState: nextPlayers,
    laneByPlayerId: nextLanes,
  };
}

export function createRaceSession(lobby: LobbyState, sessionId: string): RaceSession {
  const playersState = lobby.players.map((_, index) => createPlayerState(lobby, index));
  const laneByPlayerId = Object.fromEntries(
    lobby.players.map((player, index) => [
      player.id,
      clamp(0.4 + index * 0.14, LANE_MIN, LANE_MAX),
    ]),
  );

  return {
    snapshot: {
      sessionId,
      lobbyCode: lobby.code,
      trackId: lobby.settings.trackId ?? 'track-oval',
      status: RACE_STATUS.countdown,
      tick: 0,
      startedAt: null,
      countdown: DEFAULT_COUNTDOWN,
      playersState,
      botsState: [],
    },
    laneByPlayerId,
    finishTimesMs: Object.fromEntries(
      lobby.players.map((player) => [player.id, null]),
    ),
  };
}

export function armRaceSession(session: RaceSession, startedAt: number): RaceSession {
  return {
    ...session,
    snapshot: {
      ...session.snapshot,
      status: RACE_STATUS.racing,
      countdown: 0,
      startedAt,
    },
  };
}

export function applyPlayerInput(
  session: RaceSession,
  playerId: string,
  input: PlayerInput,
  now: number,
): { session: RaceSession; finished: RaceFinishedPayload | null } {
  if (session.snapshot.status !== RACE_STATUS.racing) {
    return {
      session,
      finished: null,
    };
  }

  const playersState = session.snapshot.playersState.map((player) => ({ ...player }));
  const playerIndex = playersState.findIndex((player) => player.playerId === playerId);

  if (playerIndex < 0) {
    return {
      session,
      finished: null,
    };
  }

  const currentPlayer = playersState[playerIndex]!;
  const currentLane = session.laneByPlayerId[playerId] ?? 0.5;
  const nextSpeed = clamp(
    currentPlayer.speed +
      (input.accelerate ? 0.32 : 0) -
      (input.brake ? 0.4 : 0) -
      0.06,
    0,
    5.4,
  );
  const nextLane = clamp(
    currentLane + input.steer * 0.02 * (0.7 + nextSpeed * 0.12),
    LANE_MIN,
    LANE_MAX,
  );
  const nextProgress = clamp(currentPlayer.progress + nextSpeed * 0.0034, 0, 1);

  playersState[playerIndex] = projectPose(nextProgress, nextLane, {
    ...currentPlayer,
    speed: nextSpeed,
  });

  let collisionState = applySoftCollision(
    playersState,
    {
      ...session.laneByPlayerId,
      [playerId]: nextLane,
    },
    playerId,
  );
  const nextSession: RaceSession = {
    ...session,
    laneByPlayerId: collisionState.laneByPlayerId,
    snapshot: {
      ...session.snapshot,
      tick: Math.max(session.snapshot.tick + 1, input.tick),
      playersState: collisionState.playersState,
    },
  };
  const finishTimesMs = ensureFinishTimes(nextSession, now);
  const everyoneFinished = nextSession.snapshot.playersState.every((player) => player.progress >= 1);

  if (!everyoneFinished) {
    return {
      session: {
        ...nextSession,
        finishTimesMs,
      },
      finished: null,
    };
  }

  const finishedSession: RaceSession = {
    ...nextSession,
    finishTimesMs,
    snapshot: {
      ...nextSession.snapshot,
      status: RACE_STATUS.finished,
      countdown: null,
    },
  };

  return {
    session: finishedSession,
    finished: {
      sessionId: finishedSession.snapshot.sessionId,
      lobbyCode: finishedSession.snapshot.lobbyCode,
      standings: sortStandings(finishedSession.snapshot.playersState, finishTimesMs),
    },
  };
}
