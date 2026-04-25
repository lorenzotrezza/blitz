import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import test from 'node:test';

import {
  LOBBY_STATUS,
  SOCKET_EVENTS,
  type LobbyErrorPayload,
  type LobbyState,
} from '@blitz/shared';

import { createLobbyService } from '../lobby/service.js';
import { registerSockets } from './register.js';

interface FakeSocketEmit {
  event: string;
  payload: unknown;
}

interface FakeRoomEmit extends FakeSocketEmit {
  room: string;
}

type RegisteredHandler = (payload?: unknown) => Promise<void> | void;

function createFakeSocket(id: string) {
  const handlers = new Map<string, RegisteredHandler>();
  const emitted: FakeSocketEmit[] = [];
  const joinedRooms: string[] = [];
  const leftRooms: string[] = [];

  return {
    socket: {
      id,
      on(event: string, handler: RegisteredHandler) {
        handlers.set(event, handler);
        return this;
      },
      emit(event: string, payload: unknown) {
        emitted.push({ event, payload });
        return true;
      },
      async join(room: string) {
        joinedRooms.push(room);
      },
      async leave(room: string) {
        leftRooms.push(room);
      },
    },
    emitted,
    joinedRooms,
    leftRooms,
    async trigger(event: string, payload?: unknown) {
      const handler = handlers.get(event);

      assert.ok(handler, `Expected socket handler for ${event}`);
      await handler(payload);
    },
  };
}

function captureRoomBroadcasts() {
  const roomEmits: FakeRoomEmit[] = [];

  return {
    roomEmits,
    install(io: { to: (room: string) => { emit: (event: string, payload: unknown) => void } }) {
      io.to = (room: string) => ({
        emit(event: string, payload: unknown) {
          roomEmits.push({ room, event, payload });
        },
      });
    },
  };
}

function getConnectionHandler(io: ReturnType<typeof registerSockets>) {
  const handlers = io.of('/').listeners('connection');

  assert.equal(handlers.length, 1);
  return handlers[0] as (socket: unknown) => void;
}

test('registerSockets removes disconnected players from their lobby and broadcasts the snapshot', async () => {
  const httpServer = createHttpServer();
  const io = registerSockets(
    httpServer,
    { socketCorsOrigin: '*' },
    {
      lobbyService: createLobbyService({
        generateLobbyCode: () => 'ABCD12',
      }),
    },
  );
  const { roomEmits, install } = captureRoomBroadcasts();
  install(io as unknown as { to: (room: string) => { emit: (event: string, payload: unknown) => void } });

  try {
    const connectionHandler = getConnectionHandler(io);
    const host = createFakeSocket('socket-host');
    const guest = createFakeSocket('socket-guest');

    connectionHandler(host.socket);
    connectionHandler(guest.socket);

    await host.trigger(SOCKET_EVENTS.client.createLobby, {
      nickname: 'Host',
      carId: 'car-red',
    });
    await guest.trigger(SOCKET_EVENTS.client.joinLobby, {
      code: 'ABCD12',
      nickname: 'Guest',
      carId: 'car-blue',
    });

    roomEmits.length = 0;

    await host.trigger('disconnect');

    assert.equal(roomEmits.length, 1);
    assert.equal(roomEmits[0]?.room, 'ABCD12');
    assert.equal(roomEmits[0]?.event, SOCKET_EVENTS.server.lobbyUpdated);

    const snapshot = roomEmits[0]?.payload as LobbyState;
    assert.equal(snapshot.hostId, 'socket-guest');
    assert.deepEqual(
      snapshot.players.map((player) => player.id),
      ['socket-guest'],
    );
  } finally {
    io.close();
  }
});

test('registerSockets emits a lobby error instead of broadcasting when a non-member leaves', async () => {
  const httpServer = createHttpServer();
  const io = registerSockets(
    httpServer,
    { socketCorsOrigin: '*' },
    {
      lobbyService: createLobbyService({
        generateLobbyCode: () => 'ABCD12',
      }),
    },
  );
  const { roomEmits, install } = captureRoomBroadcasts();
  install(io as unknown as { to: (room: string) => { emit: (event: string, payload: unknown) => void } });

  try {
    const connectionHandler = getConnectionHandler(io);
    const host = createFakeSocket('socket-host');
    const intruder = createFakeSocket('socket-intruder');

    connectionHandler(host.socket);
    connectionHandler(intruder.socket);

    await host.trigger(SOCKET_EVENTS.client.createLobby, {
      nickname: 'Host',
      carId: 'car-red',
    });

    roomEmits.length = 0;

    await intruder.trigger(SOCKET_EVENTS.client.leaveLobby, {
      code: 'ABCD12',
    });

    assert.deepEqual(roomEmits, []);
    assert.equal(intruder.emitted.length, 1);
    assert.equal(intruder.emitted[0]?.event, SOCKET_EVENTS.server.lobbyError);
    assert.deepEqual(intruder.emitted[0]?.payload as LobbyErrorPayload, {
      code: 'player-not-in-lobby',
      message: 'Player is not in this lobby',
    });
  } finally {
    io.close();
  }
});

test('registerSockets lets the host kick a guest and broadcasts the updated lobby', async () => {
  const httpServer = createHttpServer();
  const io = registerSockets(
    httpServer,
    { socketCorsOrigin: '*' },
    {
      lobbyService: createLobbyService({
        generateLobbyCode: () => 'ABCD12',
      }),
    },
  );
  const { roomEmits, install } = captureRoomBroadcasts();
  install(io as unknown as { to: (room: string) => { emit: (event: string, payload: unknown) => void } });

  try {
    const connectionHandler = getConnectionHandler(io);
    const host = createFakeSocket('socket-host');
    const guest = createFakeSocket('socket-guest');

    connectionHandler(host.socket);
    connectionHandler(guest.socket);

    await host.trigger(SOCKET_EVENTS.client.createLobby, {
      nickname: 'Host',
      carId: 'car-red',
    });
    await guest.trigger(SOCKET_EVENTS.client.joinLobby, {
      code: 'ABCD12',
      nickname: 'Guest',
      carId: 'car-blue',
    });

    roomEmits.length = 0;

    await host.trigger(SOCKET_EVENTS.client.kickPlayer, {
      code: 'ABCD12',
      playerId: 'socket-guest',
    });

    assert.equal(roomEmits.length, 1);
    assert.equal(roomEmits[0]?.event, SOCKET_EVENTS.server.lobbyUpdated);
    assert.deepEqual(
      (roomEmits[0]?.payload as LobbyState).players.map((player) => player.id),
      ['socket-host'],
    );
  } finally {
    io.close();
  }
});

test('registerSockets starts a neutral session for the selected game in a ready lobby', async () => {
  const httpServer = createHttpServer();
  const io = registerSockets(
    httpServer,
    { socketCorsOrigin: '*' },
    {
      lobbyService: createLobbyService({
        generateLobbyCode: () => 'ABCD12',
      }),
    },
  );
  const { roomEmits, install } = captureRoomBroadcasts();
  install(io as unknown as { to: (room: string) => { emit: (event: string, payload: unknown) => void } });

  try {
    const connectionHandler = getConnectionHandler(io);
    const host = createFakeSocket('socket-host');
    const guest = createFakeSocket('socket-guest');

    connectionHandler(host.socket);
    connectionHandler(guest.socket);

    await host.trigger(SOCKET_EVENTS.client.createLobby, {
      nickname: 'Host',
      carId: 'car-red',
    });
    await guest.trigger(SOCKET_EVENTS.client.joinLobby, {
      code: 'ABCD12',
      nickname: 'Guest',
      carId: 'car-blue',
    });
    await host.trigger(SOCKET_EVENTS.client.selectGame, {
      code: 'ABCD12',
      game: 'penalty',
      variant: null,
    });
    await host.trigger(SOCKET_EVENTS.client.setReady, { ready: true });
    await guest.trigger(SOCKET_EVENTS.client.setReady, { ready: true });

    roomEmits.length = 0;

    await host.trigger(SOCKET_EVENTS.client.startSession, {
      code: 'ABCD12',
    });
    assert.equal(
      roomEmits.some((entry) => entry.event === SOCKET_EVENTS.server.sessionStarted),
      true,
    );

    const startedEvent = roomEmits.find((entry) => entry.event === SOCKET_EVENTS.server.sessionStarted);
    assert.equal(
      (startedEvent?.payload as { game: string }).game,
      'penalty',
    );
  } finally {
    io.close();
  }
});

test('registerSockets returns the room to the lobby when the host chooses return-to-lobby', async () => {
  const httpServer = createHttpServer();
  const lobbyService = createLobbyService({
    generateLobbyCode: () => 'ABCD12',
  });
  const io = registerSockets(
    httpServer,
    { socketCorsOrigin: '*' },
    {
      lobbyService,
    },
  );
  const { roomEmits, install } = captureRoomBroadcasts();
  install(io as unknown as { to: (room: string) => { emit: (event: string, payload: unknown) => void } });

  try {
    const connectionHandler = getConnectionHandler(io);
    const host = createFakeSocket('socket-host');
    const guest = createFakeSocket('socket-guest');

    connectionHandler(host.socket);
    connectionHandler(guest.socket);

    await host.trigger(SOCKET_EVENTS.client.createLobby, {
      nickname: 'Host',
      carId: 'car-red',
    });
    await guest.trigger(SOCKET_EVENTS.client.joinLobby, {
      code: 'ABCD12',
      nickname: 'Guest',
      carId: 'car-blue',
    });

    lobbyService.setStatus({
      code: 'ABCD12',
      status: LOBBY_STATUS.results,
    });
    roomEmits.length = 0;

    await host.trigger(SOCKET_EVENTS.client.postGameAction, {
      code: 'ABCD12',
      action: 'return-to-lobby',
    });

    const lobbyUpdate = roomEmits.find((entry) => entry.event === SOCKET_EVENTS.server.lobbyUpdated);
    const postGameUpdate = roomEmits.find((entry) => entry.event === SOCKET_EVENTS.server.postGameUpdated);

    assert.equal((lobbyUpdate?.payload as LobbyState).status, LOBBY_STATUS.waiting);
    assert.equal((postGameUpdate?.payload as { action: string }).action, 'return-to-lobby');
  } finally {
    io.close();
  }
});

test('registerSockets starts a rematch session when the host chooses rigioca', async () => {
  const httpServer = createHttpServer();
  const lobbyService = createLobbyService({
    generateLobbyCode: () => 'ABCD12',
  });
  const io = registerSockets(
    httpServer,
    { socketCorsOrigin: '*' },
    {
      lobbyService,
    },
  );
  const { roomEmits, install } = captureRoomBroadcasts();
  install(io as unknown as { to: (room: string) => { emit: (event: string, payload: unknown) => void } });

  try {
    const connectionHandler = getConnectionHandler(io);
    const host = createFakeSocket('socket-host');
    const guest = createFakeSocket('socket-guest');

    connectionHandler(host.socket);
    connectionHandler(guest.socket);

    await host.trigger(SOCKET_EVENTS.client.createLobby, {
      nickname: 'Host',
      carId: 'car-red',
    });
    await guest.trigger(SOCKET_EVENTS.client.joinLobby, {
      code: 'ABCD12',
      nickname: 'Guest',
      carId: 'car-blue',
    });
    await host.trigger(SOCKET_EVENTS.client.selectGame, {
      code: 'ABCD12',
      game: 'lights',
      variant: null,
    });
    await host.trigger(SOCKET_EVENTS.client.setReady, { ready: true });
    await guest.trigger(SOCKET_EVENTS.client.setReady, { ready: true });

    lobbyService.setStatus({
      code: 'ABCD12',
      status: LOBBY_STATUS.results,
    });
    roomEmits.length = 0;

    await host.trigger(SOCKET_EVENTS.client.postGameAction, {
      code: 'ABCD12',
      action: 'rematch',
    });

    assert.equal(
      roomEmits.some((entry) => entry.event === SOCKET_EVENTS.server.sessionStarted),
      true,
    );
  } finally {
    io.close();
  }
});
