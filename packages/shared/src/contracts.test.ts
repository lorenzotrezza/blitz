import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  clampRaceAnalogVector,
  isLobbySelectionStartable,
  isRaceGameInput,
  LOBBY_RACE_MODES,
  LOBBY_STATUS,
  MAX_LOBBY_PLAYERS,
  RACE_STATUS,
  SOCKET_EVENTS,
  SOFT_COLLISION_PUSHBACK,
  SOFT_COLLISION_RECOVERY_MS,
  SOFT_COLLISION_SPEED_PENALTY,
} from './index.js';
import type {
  ClientToServerEvents,
  DragSprintLane,
  DragSprintMode,
  DragSprintObstacleState,
  DragSprintObstacleType,
  DragSprintPickupState,
  DragSprintPlayerState,
  DragSprintPlayerStatus,
  DragSprintPowerUpType,
  DragSprintSnapshot,
  GameInputPayload,
  LobbyState,
  PartyLobbyState,
  PlayerInfo,
  PlayerInput,
  RaceBotState,
  RaceGameInput,
  RaceGameInputKind,
  RacePlayerState,
  RaceShellModeId,
  RaceShellSnapshot,
  RaceShellStatus,
  RaceSnapshot,
  ServerToClientEvents,
} from './index.js';

function createPlayer(): PlayerInfo {
  return {
    id: 'player-1',
    nickname: 'Host',
    carId: 'car-red',
    ready: true,
    connectionState: 'connected',
  };
}

function createLobby(host: PlayerInfo): LobbyState {
  return {
    code: 'ABCD12',
    hostId: host.id,
    mode: 'multiplayer',
    selectedGame: 'lights',
    selectedVariant: null,
    players: [host],
    settings: {
      trackId: 'track-oval',
      botCount: 2,
      maxPlayers: MAX_LOBBY_PLAYERS,
    },
    status: LOBBY_STATUS.waiting,
  };
}

test('exports the valid lobby and race status values', () => {
  assert.deepEqual(LOBBY_STATUS, {
    waiting: 'waiting',
    countdown: 'countdown',
    inSession: 'in-session',
    results: 'results',
  });
  assert.equal(MAX_LOBBY_PLAYERS, 8);
  assert.equal(RACE_STATUS.racing, 'racing');
});

test('exports stable socket event names', () => {
  assert.equal(SOCKET_EVENTS.client.createLobby, 'client:create-lobby');
  assert.equal(SOCKET_EVENTS.client.joinLobby, 'client:join-lobby');
  assert.equal(SOCKET_EVENTS.client.leaveLobby, 'client:leave-lobby');
  assert.equal(SOCKET_EVENTS.client.setReady, 'client:set-ready');
  assert.equal(SOCKET_EVENTS.client.kickPlayer, 'client:kick-player');
  assert.equal(SOCKET_EVENTS.client.selectGame, 'client:select-game');
  assert.equal(SOCKET_EVENTS.client.updateLobbySettings, 'client:update-lobby-settings');
  assert.equal(SOCKET_EVENTS.client.startSession, 'client:start-session');
  assert.equal(SOCKET_EVENTS.client.postGameAction, 'client:post-game-action');
  assert.equal(SOCKET_EVENTS.server.lobbyUpdated, 'server:lobby-updated');
  assert.equal(SOCKET_EVENTS.server.sessionStarted, 'server:session-started');
  assert.equal(SOCKET_EVENTS.server.sessionState, 'server:session-state');
  assert.equal(SOCKET_EVENTS.server.sessionFinished, 'server:session-finished');
  assert.equal(SOCKET_EVENTS.server.raceSnapshot, 'server:race-snapshot');
});

test('exports a party lobby shape with selected game metadata', () => {
  const lobby: PartyLobbyState = {
    code: 'ABCD12',
    hostId: 'host',
    mode: 'multiplayer',
    selectedGame: 'lights',
    selectedVariant: null,
    status: 'waiting',
    players: [],
    settings: {
      maxPlayers: MAX_LOBBY_PLAYERS,
      raceMode: LOBBY_RACE_MODES.finishLine,
    },
  };

  assert.equal(lobby.mode, 'multiplayer');
  assert.equal(lobby.selectedGame, 'lights');
  assert.equal(lobby.selectedVariant, null);
  assert.equal(lobby.settings.raceMode, LOBBY_RACE_MODES.finishLine);
});

test('exports stable drag sprint race mode values for lobby settings', () => {
  assert.equal(LOBBY_RACE_MODES.finishLine, 'finish-line');
  assert.equal(LOBBY_RACE_MODES.bestOf3, 'best-of-3');
  assert.equal(LOBBY_RACE_MODES.survival, 'survival');
});

test('exports the current lobby selection startability policy', () => {
  assert.equal(isLobbySelectionStartable('lights', null), true);
  assert.equal(isLobbySelectionStartable('penalty', null), true);
  assert.equal(isLobbySelectionStartable('race', 'sprint-circuit'), true);
  assert.equal(
    isLobbySelectionStartable('race', 'drag-sprint', LOBBY_RACE_MODES.finishLine, 3),
    true,
  );
  assert.equal(
    isLobbySelectionStartable('race', 'drag-sprint', LOBBY_RACE_MODES.finishLine, 4),
    false,
  );
  assert.equal(
    isLobbySelectionStartable('race', 'drag-sprint', LOBBY_RACE_MODES.bestOf3, 3),
    true,
  );
  assert.equal(
    isLobbySelectionStartable('race', 'drag-sprint', LOBBY_RACE_MODES.survival, 3),
    false,
  );
  assert.equal(isLobbySelectionStartable('race', 'drag-sprint', null, 3), false);
  assert.equal(isLobbySelectionStartable('race', null), false);
});

test('exports the expected race snapshot shape', () => {
  const host = createPlayer();
  const lobby = createLobby(host);

  const playerState: RacePlayerState = {
    playerId: host.id,
    nickname: host.nickname,
    x: 120,
    y: 240,
    vx: 3,
    vy: 1,
    angle: 0.3,
    lap: 1,
    checkpoint: 2,
    progress: 0.54,
    penalties: 0,
    speed: 4,
  };

  const botState: RaceBotState = {
    botId: 'bot-1',
    nickname: 'BOT ALFA',
    x: 96,
    y: 180,
    vx: 2,
    vy: 0,
    angle: 0.2,
    lap: 1,
    checkpoint: 1,
    progress: 0.4,
    penalties: 0,
    speed: 3,
  };

  const snapshot: RaceSnapshot = {
    sessionId: 'session-1',
    lobbyCode: lobby.code,
    trackId: lobby.settings.trackId ?? 'track-oval',
    status: RACE_STATUS.racing,
    tick: 12,
    startedAt: 1_713_980_000_000,
    countdown: 0,
    playersState: [playerState],
    botsState: [botState],
  };

  assert.equal(snapshot.playersState[0]?.playerId, host.id);
  assert.equal(snapshot.botsState[0]?.botId, 'bot-1');
  assert.equal(snapshot.playersState[0]?.progress, 0.54);
  assert.equal('playerId' in snapshot.botsState[0]!, false);
});

test('exports the expected drag sprint snapshot shape', () => {
  const mode: DragSprintMode = 'finish-line';
  const bestOf3Mode: DragSprintMode = 'best-of-3';
  const survivalMode: DragSprintMode = 'survival';
  const leftLane: DragSprintLane = 0;
  const centerLane: DragSprintLane = 1;
  const rightLane: DragSprintLane = 2;
  const nitro: DragSprintPowerUpType = 'nitro';
  const shield: DragSprintPowerUpType = 'shield';
  const magnet: DragSprintPowerUpType = 'magnet';
  const repair: DragSprintPowerUpType = 'repair';
  const construction: DragSprintObstacleType = 'construction';
  const cone: DragSprintObstacleType = 'cone';
  const oil: DragSprintObstacleType = 'oil';
  const slowCar: DragSprintObstacleType = 'slow-car';
  const racingStatus: DragSprintPlayerStatus = 'racing';
  const finishedStatus: DragSprintPlayerStatus = 'finished';
  const eliminatedStatus: DragSprintPlayerStatus = 'eliminated';
  const playerState: DragSprintPlayerState = {
    playerId: 'player-1',
    nickname: 'Host',
    lane: centerLane,
    distance: 420,
    speed: 18,
    status: racingStatus,
    activePowerUp: nitro,
  };
  const idlePlayerState: DragSprintPlayerState = {
    playerId: 'player-2',
    nickname: 'Guest',
    lane: leftLane,
    distance: 120,
    speed: 0,
    status: finishedStatus,
    activePowerUp: null,
  };
  const obstacleState: DragSprintObstacleState = {
    id: 'obstacle-1',
    type: construction,
    lane: rightLane,
    distance: 560,
    speed: 4,
  };
  const pickupState: DragSprintPickupState = {
    id: 'pickup-1',
    type: shield,
    lane: leftLane,
    distance: 610,
  };
  const bestOf3Snapshot: DragSprintSnapshot = {
    sessionId: 'session-drag-best-of-3',
    lobbyCode: 'ABCD12',
    trackId: 'drag-strip',
    mode: bestOf3Mode,
    status: RACE_STATUS.racing,
    tick: 0,
    countdown: 0,
    startedAt: 1_713_980_001_000,
    distanceTarget: 360,
    round: 2,
    totalRounds: 3,
    standings: [
      {
        playerId: 'player-1',
        nickname: 'Host',
        points: 4,
        roundWins: 1,
        cumulativeTimeMs: 540,
      },
    ],
    playersState: [playerState],
    obstacles: [obstacleState],
    pickups: [pickupState],
  };
  const snapshot: DragSprintSnapshot = {
    sessionId: 'session-drag',
    lobbyCode: 'ABCD12',
    trackId: 'drag-strip',
    mode,
    status: RACE_STATUS.racing,
    tick: 12,
    countdown: 0,
    startedAt: 1_713_980_000_000,
    distanceTarget: 1200,
    playersState: [playerState],
    obstacles: [obstacleState],
    pickups: [pickupState],
  };
  const pendingSnapshot: DragSprintSnapshot = {
    sessionId: 'session-drag-pending',
    lobbyCode: 'ABCD12',
    trackId: 'drag-strip',
    mode: survivalMode,
    status: RACE_STATUS.countdown,
    tick: 0,
    countdown: null,
    startedAt: null,
    distanceTarget: null,
    playersState: [idlePlayerState],
    obstacles: [],
    pickups: [],
  };

  assert.equal(mode, 'finish-line');
  assert.equal(bestOf3Mode, 'best-of-3');
  assert.equal(survivalMode, 'survival');
  assert.equal(leftLane, 0);
  assert.equal(centerLane, 1);
  assert.equal(rightLane, 2);
  assert.equal(nitro, 'nitro');
  assert.equal(magnet, 'magnet');
  assert.equal(repair, 'repair');
  assert.equal(cone, 'cone');
  assert.equal(oil, 'oil');
  assert.equal(slowCar, 'slow-car');
  assert.equal(finishedStatus, 'finished');
  assert.equal(eliminatedStatus, 'eliminated');
  assert.equal(snapshot.mode, 'finish-line');
  assert.equal(snapshot.trackId, 'drag-strip');
  assert.equal(snapshot.playersState[0]?.status, racingStatus);
  assert.equal(snapshot.playersState[0]?.lane, centerLane);
  assert.equal(snapshot.playersState[0]?.activePowerUp, nitro);
  assert.equal(snapshot.obstacles[0]?.type, construction);
  assert.equal(snapshot.pickups[0]?.type, shield);
  assert.equal(bestOf3Snapshot.mode, 'best-of-3');
  assert.equal(bestOf3Snapshot.round, 2);
  assert.equal(bestOf3Snapshot.totalRounds, 3);
  assert.equal(bestOf3Snapshot.standings?.[0]?.roundWins, 1);
  assert.equal(pendingSnapshot.mode, 'survival');
  assert.equal(pendingSnapshot.status, RACE_STATUS.countdown);
  assert.equal(pendingSnapshot.playersState[0]?.activePowerUp, null);
  assert.equal(pendingSnapshot.startedAt, null);
  assert.equal(pendingSnapshot.countdown, null);
  assert.equal(pendingSnapshot.distanceTarget, null);
});

test('keeps host ownership in lobby state rather than duplicating it in player info', () => {
  const host = createPlayer();
  const lobby = createLobby(host);

  assert.equal(lobby.hostId, host.id);
  assert.equal('isHost' in host, false);
});

test('exports the expected player input packet shape without client identity', () => {
  const input: PlayerInput = {
    tick: 13,
    steer: 1,
    accelerate: true,
    brake: false,
  };

  assert.equal('playerId' in input, false);
  assert.equal(input.steer, 1);
  assert.equal(input.accelerate, true);
  assert.equal(input.brake, false);
});

test('exports discriminated race game input contract shapes', () => {
  const analogKind: RaceGameInputKind = 'analog';
  const circleMode: RaceShellModeId = 'circle';
  const analogInput: RaceGameInput = {
    kind: 'analog',
    sequence: 1,
    clientTimeMs: 1_713_980_000_123,
    modeId: circleMode,
    vector: {
      x: 0.5,
      y: -0.25,
      magnitude: 0.56,
    },
  };

  const buttonInput: RaceGameInput = {
    kind: 'button',
    sequence: 2,
    clientTimeMs: 1_713_980_000_223,
    modeId: 'drag',
    button: 'primary',
    state: 'pressed',
  };

  const actionInput: RaceGameInput = {
    kind: 'action',
    sequence: 3,
    clientTimeMs: 1_713_980_000_323,
    modeId: 'drag',
    action: 'shift',
  };

  const legacyInput: PlayerInput = {
    tick: 13,
    steer: 1,
    accelerate: true,
    brake: false,
  };
  const existingPayload: GameInputPayload = { reactionAtMs: 123 };
  const legacyReactionAtMs: unknown = existingPayload.reactionAtMs;

  assert.equal(analogInput.kind, 'analog');
  assert.equal(analogInput.kind, analogKind);
  assert.equal(analogInput.modeId, 'circle');
  assert.equal(analogInput.vector.x, 0.5);
  assert.equal(analogInput.vector.y, -0.25);
  assert.equal(analogInput.vector.magnitude, 0.56);
  assert.equal('playerId' in analogInput, false);
  assert.equal(buttonInput.kind, 'button');
  assert.equal(buttonInput.button, 'primary');
  assert.equal(buttonInput.state, 'pressed');
  assert.equal(actionInput.kind, 'action');
  assert.equal(actionInput.action, 'shift');
  assert.equal(actionInput.sequence, 3);
  assert.equal(legacyInput.steer, 1);
  assert.equal(legacyReactionAtMs, 123);
  assert.deepEqual(existingPayload, { reactionAtMs: 123 });
});

test('exports race shell snapshot contract shape', () => {
  const modeId: RaceShellModeId = 'figure-eight';
  const status: RaceShellStatus = 'racing';
  const snapshot: RaceShellSnapshot = {
    sessionId: 'session-shell',
    lobbyCode: 'ABCD12',
    modeId: 'figure-eight',
    status,
    countdown: 0,
    tick: 24,
    players: [
      {
        playerId: 'player-1',
        nickname: 'Host',
        progress: 0.42,
        speed: 38,
        penalty: null,
      },
    ],
    hud: {
      objective: 'Hit every crossing gate',
      progressLabel: 'Lap 1 / 3',
      speedLabel: '38 km/h',
      penaltyLabel: 'Clean',
      inputLabel: 'Analog 56%',
      modeMetricLabel: 'Next gate',
      modeMetricValue: 'North',
    },
    mode: {},
  };

  assert.equal(snapshot.modeId, 'figure-eight');
  assert.equal(snapshot.modeId, modeId);
  assert.equal(snapshot.status, 'racing');
  assert.equal(snapshot.countdown, 0);
  assert.equal(snapshot.players[0]?.playerId, 'player-1');
  assert.equal(snapshot.hud.objective, 'Hit every crossing gate');
  assert.equal(snapshot.hud.inputLabel, 'Analog 56%');
  assert.deepEqual(snapshot.mode, {});
});

test('exports race input guard and analog clamp helpers', () => {
  assert.deepEqual(
    clampRaceAnalogVector({
      x: 1.2345,
      y: Number.POSITIVE_INFINITY,
      magnitude: -0.2,
    }),
    {
      x: 1,
      y: 0,
      magnitude: 0,
    },
  );

  assert.equal(
    isRaceGameInput({
      kind: 'analog',
      sequence: 1,
      clientTimeMs: 1_713_980_000_123,
      modeId: 'circle',
      vector: {
        x: 0.4,
        y: -0.2,
        magnitude: 0.45,
      },
    }),
    true,
  );
  assert.equal(
    isRaceGameInput({
      kind: 'button',
      sequence: 2,
      clientTimeMs: 1_713_980_000_223,
      modeId: 'drag',
      button: 'secondary',
      state: 'released',
    }),
    true,
  );
  assert.equal(
    isRaceGameInput({
      kind: 'action',
      sequence: 3,
      clientTimeMs: 1_713_980_000_323,
      modeId: 'drag',
      action: 'shift',
    }),
    true,
  );
  assert.equal(
    isRaceGameInput({
      kind: 'analog',
      sequence: -1,
      clientTimeMs: 1_713_980_000_123,
      modeId: 'circle',
      vector: {
        x: 0,
        y: 0,
        magnitude: 0,
      },
    }),
    false,
  );
  for (const badValue of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.equal(
      isRaceGameInput({
        kind: 'analog',
        sequence: 4,
        clientTimeMs: 1_713_980_000_123,
        modeId: 'circle',
        vector: {
          x: badValue,
          y: 0,
          magnitude: 0,
        },
      }),
      false,
    );
  }
  assert.equal(
    isRaceGameInput({
      kind: 'button',
      sequence: 5,
      clientTimeMs: 1_713_980_000_423,
      modeId: 'drag',
      button: 'primary',
      state: 'held',
    }),
    false,
  );
});

test('exports typed socket contracts for client and server event payloads', () => {
  const host = createPlayer();
  const lobby = createLobby(host);
  const snapshot: RaceSnapshot = {
    sessionId: 'session-1',
    lobbyCode: lobby.code,
    trackId: lobby.settings.trackId ?? 'track-oval',
    status: RACE_STATUS.racing,
    tick: 14,
    startedAt: 1_713_980_000_000,
    countdown: 0,
    playersState: [
      {
        playerId: host.id,
        nickname: host.nickname,
        x: 120,
        y: 240,
        vx: 3,
        vy: 1,
        angle: 0.3,
        lap: 1,
        checkpoint: 2,
        progress: 0.54,
        penalties: 0,
        speed: 4,
      },
    ],
    botsState: [
      {
        botId: 'bot-1',
        nickname: 'BOT ALFA',
        x: 96,
        y: 180,
        vx: 2,
        vy: 0,
        angle: 0.2,
        lap: 1,
        checkpoint: 1,
        progress: 0.4,
        penalties: 0,
        speed: 3,
      },
    ],
  };

  const clientEvents: ClientToServerEvents = {
    [SOCKET_EVENTS.client.createLobby]: (payload) => {
      assert.equal(payload.nickname, 'Host');
      assert.equal(payload.carId, 'car-red');
    },
    [SOCKET_EVENTS.client.joinLobby]: (payload) => {
      assert.equal(payload.code, 'ABCD12');
      assert.equal(payload.nickname, 'Guest');
    },
    [SOCKET_EVENTS.client.leaveLobby]: (payload) => {
      assert.equal(payload.code, 'ABCD12');
    },
    [SOCKET_EVENTS.client.setReady]: (payload) => {
      assert.equal(payload.ready, true);
    },
    [SOCKET_EVENTS.client.kickPlayer]: (payload) => {
      assert.equal(payload.code, 'ABCD12');
      assert.equal(payload.playerId, 'socket-guest');
    },
    [SOCKET_EVENTS.client.selectGame]: (payload) => {
      assert.equal(payload.game, 'lights');
      assert.equal(payload.variant, null);
    },
    [SOCKET_EVENTS.client.updateLobbySettings]: (payload) => {
      assert.equal(payload.code, 'ABCD12');
      assert.equal(payload.settings.rounds, 3);
      assert.equal(payload.settings.raceMode, LOBBY_RACE_MODES.bestOf3);
    },
    [SOCKET_EVENTS.client.startSession]: (payload) => {
      assert.equal(payload.code, 'ABCD12');
    },
    [SOCKET_EVENTS.client.gameInput]: (payload) => {
      assert.equal('reactionAtMs' in payload, true);
      assert.equal((payload as { reactionAtMs?: unknown }).reactionAtMs, 180);
    },
    [SOCKET_EVENTS.client.postGameAction]: (payload) => {
      assert.equal(payload.action, 'return-to-lobby');
    },
    [SOCKET_EVENTS.client.startRace]: (payload) => {
      assert.equal(payload.code, 'ABCD12');
    },
    [SOCKET_EVENTS.client.playerInput]: (payload) => {
      assert.equal('playerId' in payload, false);
      assert.equal(payload.tick, 13);
    },
  };

  const serverEvents: ServerToClientEvents = {
    [SOCKET_EVENTS.server.lobbyUpdated]: (payload) => {
      assert.equal(payload.hostId, host.id);
    },
    [SOCKET_EVENTS.server.lobbyError]: (payload) => {
      assert.equal(payload.code, 'lobby-full');
      assert.equal(payload.message, 'Lobby is full');
    },
    [SOCKET_EVENTS.server.sessionStarted]: (payload) => {
      assert.equal(payload.game, 'lights');
      assert.equal(payload.variant, null);
    },
    [SOCKET_EVENTS.server.sessionState]: (payload) => {
      assert.equal(payload.status, 'active');
      assert.equal(payload.game, 'lights');
    },
    [SOCKET_EVENTS.server.sessionFinished]: (payload) => {
      assert.equal(payload.results.rankings[0]?.playerId, host.id);
    },
    [SOCKET_EVENTS.server.postGameUpdated]: (payload) => {
      assert.equal(payload.action, 'return-to-lobby');
      assert.equal(payload.lobby.code, lobby.code);
    },
    [SOCKET_EVENTS.server.raceStarted]: (payload) => {
      assert.equal(payload.sessionId, 'session-1');
      assert.equal(payload.trackId, 'track-oval');
    },
    [SOCKET_EVENTS.server.raceSnapshot]: (payload) => {
      assert.equal(payload.playersState[0]?.playerId, host.id);
      assert.equal(payload.botsState[0]?.botId, 'bot-1');
    },
    [SOCKET_EVENTS.server.raceFinished]: (payload) => {
      assert.equal(payload.standings[0]?.entrantType, 'player');
    },
  };

  clientEvents[SOCKET_EVENTS.client.createLobby]({ nickname: 'Host', carId: 'car-red' });
  clientEvents[SOCKET_EVENTS.client.joinLobby]({
    code: 'ABCD12',
    nickname: 'Guest',
    carId: 'car-blue',
  });
  clientEvents[SOCKET_EVENTS.client.leaveLobby]({ code: 'ABCD12' });
  clientEvents[SOCKET_EVENTS.client.setReady]({ ready: true });
  clientEvents[SOCKET_EVENTS.client.kickPlayer]({
    code: 'ABCD12',
    playerId: 'socket-guest',
  });
  clientEvents[SOCKET_EVENTS.client.selectGame]({
    code: 'ABCD12',
    game: 'lights',
    variant: null,
  });
  clientEvents[SOCKET_EVENTS.client.updateLobbySettings]({
    code: 'ABCD12',
    settings: {
      rounds: 3,
      raceMode: LOBBY_RACE_MODES.bestOf3,
    },
  });
  clientEvents[SOCKET_EVENTS.client.startSession]({ code: 'ABCD12' });
  clientEvents[SOCKET_EVENTS.client.gameInput]({ reactionAtMs: 180 });
  clientEvents[SOCKET_EVENTS.client.postGameAction]({
    code: 'ABCD12',
    action: 'return-to-lobby',
  });
  clientEvents[SOCKET_EVENTS.client.startRace]({ code: 'ABCD12' });
  clientEvents[SOCKET_EVENTS.client.playerInput]({
    tick: 13,
    steer: 1,
    accelerate: true,
    brake: false,
  });

  serverEvents[SOCKET_EVENTS.server.lobbyUpdated](lobby);
  serverEvents[SOCKET_EVENTS.server.lobbyError]({
    code: 'lobby-full',
    message: 'Lobby is full',
  });
  serverEvents[SOCKET_EVENTS.server.sessionStarted]({
    sessionId: 'session-1',
    lobbyCode: lobby.code,
    game: 'lights',
    variant: null,
    countdown: 3,
  });
  serverEvents[SOCKET_EVENTS.server.sessionState]({
    sessionId: 'session-1',
    lobbyCode: lobby.code,
    game: 'lights',
    variant: null,
    status: 'active',
    countdown: 0,
    state: {
      round: 1,
    },
    results: null,
  });
  serverEvents[SOCKET_EVENTS.server.sessionFinished]({
    sessionId: 'session-1',
    lobbyCode: lobby.code,
    game: 'lights',
    variant: null,
    results: {
      rankings: [
        {
          playerId: host.id,
          rank: 1,
        },
      ],
    },
  });
  serverEvents[SOCKET_EVENTS.server.postGameUpdated]({
    action: 'return-to-lobby',
    lobby,
  });
  serverEvents[SOCKET_EVENTS.server.raceStarted]({
    sessionId: 'session-1',
    lobbyCode: lobby.code,
    trackId: lobby.settings.trackId ?? 'track-oval',
    countdown: 3,
  });
  serverEvents[SOCKET_EVENTS.server.raceSnapshot](snapshot);
  serverEvents[SOCKET_EVENTS.server.raceFinished]({
    sessionId: 'session-1',
    lobbyCode: lobby.code,
    standings: [
      {
        entrantId: host.id,
        entrantType: 'player',
        position: 1,
        finishTimeMs: 57_321,
      },
    ],
  });
});

test('exports soft collision tuning constants', () => {
  assert.equal(typeof SOFT_COLLISION_PUSHBACK, 'number');
  assert.equal(typeof SOFT_COLLISION_SPEED_PENALTY, 'number');
  assert.equal(typeof SOFT_COLLISION_RECOVERY_MS, 'number');
  assert.ok(SOFT_COLLISION_PUSHBACK > 0);
  assert.ok(SOFT_COLLISION_SPEED_PENALTY > 0 && SOFT_COLLISION_SPEED_PENALTY < 1);
  assert.ok(SOFT_COLLISION_RECOVERY_MS > 0);
});

test('uses a build tsconfig that excludes test files from dist output', () => {
  const buildConfig = JSON.parse(
    readFileSync(new URL('../tsconfig.build.json', import.meta.url), 'utf8'),
  ) as { exclude?: string[] };

  assert.deepEqual(buildConfig.exclude, ['src/**/*.test.ts']);
});
