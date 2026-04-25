import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
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
  DragSprintSnapshot,
  LobbyState,
  PartyLobbyState,
  PlayerInfo,
  PlayerInput,
  RaceBotState,
  RacePlayerState,
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
    },
  };

  assert.equal(lobby.mode, 'multiplayer');
  assert.equal(lobby.selectedGame, 'lights');
  assert.equal(lobby.selectedVariant, null);
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
  const snapshot: DragSprintSnapshot = {
    sessionId: 'session-drag',
    lobbyCode: 'ABCD12',
    trackId: 'drag-strip',
    mode: 'finish-line',
    status: RACE_STATUS.racing,
    tick: 12,
    countdown: 0,
    startedAt: 1_713_980_000_000,
    distanceTarget: 1200,
    playersState: [
      {
        playerId: 'player-1',
        nickname: 'Host',
        lane: 1,
        distance: 420,
        speed: 18,
        status: 'racing',
        activePowerUp: 'nitro',
      },
    ],
    obstacles: [
      {
        id: 'obstacle-1',
        type: 'construction',
        lane: 2,
        distance: 560,
        speed: 4,
      },
    ],
    pickups: [
      {
        id: 'pickup-1',
        type: 'shield',
        lane: 0,
        distance: 610,
      },
    ],
  };

  assert.equal(snapshot.mode, 'finish-line');
  assert.equal(snapshot.trackId, 'drag-strip');
  assert.equal(snapshot.playersState[0]?.status, 'racing');
  assert.equal(snapshot.playersState[0]?.lane, 1);
  assert.equal(snapshot.obstacles[0]?.type, 'construction');
  assert.equal(snapshot.pickups[0]?.type, 'shield');
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
    },
    [SOCKET_EVENTS.client.startSession]: (payload) => {
      assert.equal(payload.code, 'ABCD12');
    },
    [SOCKET_EVENTS.client.gameInput]: (payload) => {
      assert.equal(payload.reactionAtMs, 180);
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
