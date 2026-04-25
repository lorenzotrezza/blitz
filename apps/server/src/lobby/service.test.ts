import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOBBY_STATUS,
  MAX_LOBBY_PLAYERS,
  PLAYER_CONNECTION_STATE,
} from '@blitz/shared';

import { createInMemoryLobbyStore } from './store.js';
import { createLobbyService } from './service.js';

function createServiceHarness(codes: string[] = ['ABCD12']) {
  let index = 0;
  const store = createInMemoryLobbyStore();

  const service = createLobbyService({
    store,
    generateLobbyCode: () => {
      const nextCode = codes[index];

      if (!nextCode) {
        throw new Error('Ran out of test lobby codes');
      }

      index += 1;
      return nextCode;
    },
  });

  return {
    service,
    store,
  };
}

function createService(codes: string[] = ['ABCD12']) {
  return createServiceHarness(codes).service;
}

test('createLobby creates a lobby with the caller as host', () => {
  const service = createService();

  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  assert.equal(lobby.code, 'ABCD12');
  assert.equal(lobby.hostId, 'socket-host');
  assert.equal(lobby.mode, 'multiplayer');
  assert.equal(lobby.selectedGame, 'lights');
  assert.equal(lobby.selectedVariant, null);
  assert.equal(lobby.status, LOBBY_STATUS.waiting);
  assert.equal(lobby.settings.maxPlayers, MAX_LOBBY_PLAYERS);
  assert.deepEqual(lobby.players, [
    {
      id: 'socket-host',
      nickname: 'Host',
      carId: 'car-red',
      ready: false,
      connectionState: PLAYER_CONNECTION_STATE.connected,
    },
  ]);
});

test('joinLobby adds a player by nickname to an existing lobby', () => {
  const service = createService();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  const updatedLobby = service.joinLobby({
    code: lobby.code,
    playerId: 'socket-guest',
    nickname: 'Guest',
    carId: 'car-blue',
  });

  assert.equal(updatedLobby.hostId, 'socket-host');
  assert.deepEqual(
    updatedLobby.players.map((player: { id: string; nickname: string; ready: boolean }) => ({
      id: player.id,
      nickname: player.nickname,
      ready: player.ready,
    })),
    [
      { id: 'socket-host', nickname: 'Host', ready: false },
      { id: 'socket-guest', nickname: 'Guest', ready: false },
    ],
  );
});

test('host can select a game before starting the session', () => {
  const service = createService();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  const updatedLobby = service.selectGame({
    code: lobby.code,
    hostId: 'socket-host',
    game: 'penalty',
    variant: null,
  });

  assert.equal(updatedLobby.selectedGame, 'penalty');
  assert.equal(updatedLobby.selectedVariant, null);
});

test('host can update neutral lobby settings before the session starts', () => {
  const service = createService();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  const updatedLobby = service.updateSettings({
    code: lobby.code,
    hostId: 'socket-host',
    settings: {
      rounds: 3,
    },
  });

  assert.equal(updatedLobby.settings.rounds, 3);
});

test('joinLobby rejects a join when the lobby is already full', () => {
  const service = createService();
  const lobby = service.createLobby({
    playerId: 'socket-1',
    nickname: 'Player 1',
    carId: 'car-1',
  });

  for (let index = 2; index <= MAX_LOBBY_PLAYERS; index += 1) {
    service.joinLobby({
      code: lobby.code,
      playerId: `socket-${index}`,
      nickname: `Player ${index}`,
      carId: `car-${index}`,
    });
  }

  assert.throws(
    () =>
      service.joinLobby({
        code: lobby.code,
        playerId: 'socket-9',
        nickname: 'Player 9',
        carId: 'car-9',
      }),
    (error: unknown) => {
      assert.notEqual(error, null);
      assert.equal(typeof error, 'object');
      assert.equal((error as { code: string }).code, 'lobby-full');
      return true;
    },
  );
});

test('leaveLobby reassigns the host when the current host leaves', () => {
  const service = createService();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  service.joinLobby({
    code: lobby.code,
    playerId: 'socket-guest',
    nickname: 'Guest',
    carId: 'car-blue',
  });

  const updatedLobby = service.leaveLobby({
    code: lobby.code,
    playerId: 'socket-host',
  });

  assert.ok(updatedLobby);
  assert.equal(updatedLobby.hostId, 'socket-guest');
  assert.deepEqual(
    updatedLobby.players.map((player: { id: string }) => player.id),
    ['socket-guest'],
  );
});

test('setReady toggles the ready state for a player in the lobby', () => {
  const service = createService();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  service.joinLobby({
    code: lobby.code,
    playerId: 'socket-guest',
    nickname: 'Guest',
    carId: 'car-blue',
  });

  const readyLobby = service.setReady({
    playerId: 'socket-guest',
    ready: true,
  });

  assert.equal(
    readyLobby.players.find((player: { id: string; ready: boolean }) => player.id === 'socket-guest')
      ?.ready,
    true,
  );

  const waitingLobby = service.setReady({
    playerId: 'socket-guest',
    ready: false,
  });

  assert.equal(
    waitingLobby.players.find((player: { id: string; ready: boolean }) => player.id === 'socket-guest')
      ?.ready,
    false,
  );
});

test('joinLobby rejects when the lobby is not in the waiting state', () => {
  const { service, store } = createServiceHarness();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  store.saveLobby({
    ...lobby,
    status: LOBBY_STATUS.countdown,
  });

  assert.throws(
    () =>
      service.joinLobby({
        code: lobby.code,
        playerId: 'socket-guest',
        nickname: 'Guest',
        carId: 'car-blue',
      }),
    (error: unknown) => {
      assert.notEqual(error, null);
      assert.equal(typeof error, 'object');
      assert.equal((error as { code: string }).code, 'lobby-not-waiting');
      return true;
    },
  );
});

test('setReady rejects when the lobby is not in the waiting state', () => {
  const { service, store } = createServiceHarness();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  store.saveLobby({
    ...lobby,
    status: LOBBY_STATUS.inSession,
  });

  assert.throws(
    () =>
      service.setReady({
        playerId: 'socket-host',
        ready: true,
      }),
    (error: unknown) => {
      assert.notEqual(error, null);
      assert.equal(typeof error, 'object');
      assert.equal((error as { code: string }).code, 'lobby-not-waiting');
      return true;
    },
  );
});

test('leaveLobby rejects when the player is not a member of the lobby', () => {
  const service = createService();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  assert.throws(
    () =>
      service.leaveLobby({
        code: lobby.code,
        playerId: 'socket-intruder',
      }),
    (error: unknown) => {
      assert.notEqual(error, null);
      assert.equal(typeof error, 'object');
      assert.equal((error as { code: string }).code, 'player-not-in-lobby');
      return true;
    },
  );
});

test('disconnectPlayer removes the disconnected player and reassigns host', () => {
  const service = createService();
  const lobby = service.createLobby({
    playerId: 'socket-host',
    nickname: 'Host',
    carId: 'car-red',
  });

  service.joinLobby({
    code: lobby.code,
    playerId: 'socket-guest',
    nickname: 'Guest',
    carId: 'car-blue',
  });

  const updatedLobby = service.disconnectPlayer('socket-host');

  assert.ok(updatedLobby);
  assert.equal(updatedLobby.hostId, 'socket-guest');
  assert.deepEqual(
    updatedLobby.players.map((player: { id: string }) => player.id),
    ['socket-guest'],
  );
});
