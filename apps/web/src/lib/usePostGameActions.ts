import { useEffect, useMemo, useState } from 'react';

import type {
  LobbyState,
  PostGameActionPayload,
  PostGameUpdatePayload,
  SessionStartedPayload,
} from '@blitz/shared';
import { SOCKET_EVENTS } from '@blitz/shared';

import { getBlitzSocket } from './socket';
import { persistActiveLobby, readStoredActiveLobby } from './useLobbySocket';

export interface PostGameActionsState {
  isConnected: boolean;
  lobby: LobbyState | null;
  isHost: boolean;
  pendingAction: PostGameActionPayload['action'] | null;
  postGameUpdate: PostGameUpdatePayload | null;
  sessionStarted: SessionStartedPayload | null;
  submitAction: (action: PostGameActionPayload['action']) => void;
}

export function usePostGameActions(lobbyCode: string | null): PostGameActionsState {
  const socket = useMemo(() => getBlitzSocket(), []);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [lobby, setLobby] = useState<LobbyState | null>(() => {
    const storedLobby = readStoredActiveLobby();

    if (!storedLobby) {
      return null;
    }

    if (lobbyCode && storedLobby.code !== lobbyCode) {
      return null;
    }

    return storedLobby;
  });
  const [pendingAction, setPendingAction] = useState<PostGameActionPayload['action'] | null>(null);
  const [postGameUpdate, setPostGameUpdate] = useState<PostGameUpdatePayload | null>(null);
  const [sessionStarted, setSessionStarted] = useState<SessionStartedPayload | null>(null);

  useEffect(() => {
    if (!socket.connected && !socket.active) {
      socket.connect();
    }

    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id ?? null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    const handleLobbyUpdated = (payload: LobbyState) => {
      if (lobbyCode && payload.code !== lobbyCode) {
        return;
      }

      setLobby(payload);
      persistActiveLobby(payload);
      setPendingAction(null);
    };

    const handlePostGameUpdated = (payload: PostGameUpdatePayload) => {
      if (lobbyCode && payload.lobby.code !== lobbyCode) {
        return;
      }

      setLobby(payload.lobby);
      persistActiveLobby(payload.lobby);
      setPostGameUpdate(payload);
      setPendingAction(null);
    };

    const handleSessionStarted = (payload: SessionStartedPayload) => {
      if (lobbyCode && payload.lobbyCode !== lobbyCode) {
        return;
      }

      setSessionStarted(payload);
      setPendingAction(null);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.server.lobbyUpdated, handleLobbyUpdated);
    socket.on(SOCKET_EVENTS.server.postGameUpdated, handlePostGameUpdated);
    socket.on(SOCKET_EVENTS.server.sessionStarted, handleSessionStarted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.server.lobbyUpdated, handleLobbyUpdated);
      socket.off(SOCKET_EVENTS.server.postGameUpdated, handlePostGameUpdated);
      socket.off(SOCKET_EVENTS.server.sessionStarted, handleSessionStarted);
    };
  }, [lobbyCode, socket]);

  const isHost = Boolean(lobby && socketId && lobby.hostId === socketId);

  return {
    isConnected,
    lobby,
    isHost,
    pendingAction,
    postGameUpdate,
    sessionStarted,
    submitAction(action) {
      if (!lobby || !isHost) {
        return;
      }

      setPendingAction(action);
      socket.emit(SOCKET_EVENTS.client.postGameAction, {
        code: lobby.code,
        action,
      });
    },
  };
}
