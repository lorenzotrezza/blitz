import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  LobbySettings,
  LobbyState,
  PlayerInfo,
  SessionStartedPayload,
} from '@blitz/shared';
import { SOCKET_EVENTS } from '@blitz/shared';

import { getBlitzSocket } from './socket';

export interface LobbyDraft {
  nickname: string;
  carId: string;
}

export interface LobbySocketState {
  draft: LobbyDraft;
  error: string | null;
  isBusy: boolean;
  isConnected: boolean;
  isHost: boolean;
  joinedLobby: LobbyState | null;
  me: PlayerInfo | null;
  sessionStarted: SessionStartedPayload | null;
  copiedInvite: boolean;
  setNickname: (value: string) => void;
  setCarId: (value: string) => void;
  submit: () => void;
  toggleReady: () => void;
  leave: () => void;
  selectGame: (game: LobbyState['selectedGame'], variant: LobbyState['selectedVariant']) => void;
  updateSettings: (settings: Partial<LobbySettings>) => void;
  startSession: () => void;
  kickPlayer: (playerId: string) => void;
  copyInviteLink: () => Promise<void>;
}

const CREATE_ROUTE_CODE = 'NEW';

const DEFAULT_DRAFT: LobbyDraft = {
  nickname: '',
  carId: 'f812',
};

const ACTIVE_LOBBY_STORAGE_KEY = 'blitz-active-lobby';

function normalizeLobbyCode(value: string) {
  return value.trim().toUpperCase();
}

export function readStoredActiveLobby(): LobbyState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(ACTIVE_LOBBY_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as LobbyState;

    return parsed;
  } catch {
    return null;
  }
}

function readPersistedLobby(code: string): LobbyState | null {
  const storedLobby = readStoredActiveLobby();

  return storedLobby?.code === code ? storedLobby : null;
}

export function persistActiveLobby(lobby: LobbyState | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!lobby) {
    window.localStorage.removeItem(ACTIVE_LOBBY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ACTIVE_LOBBY_STORAGE_KEY, JSON.stringify(lobby));
}

export function useLobbySocket(lobbyCode: string): LobbySocketState {
  const requestedCode = normalizeLobbyCode(lobbyCode || CREATE_ROUTE_CODE);
  const isCreateRoute = requestedCode === CREATE_ROUTE_CODE;
  const socket = useMemo(() => getBlitzSocket(), []);
  const inviteResetRef = useRef<number | null>(null);

  const [draft, setDraft] = useState<LobbyDraft>(DEFAULT_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [joinedLobby, setJoinedLobby] = useState<LobbyState | null>(
    isCreateRoute ? null : readPersistedLobby(requestedCode),
  );
  const [sessionStarted, setSessionStarted] = useState<SessionStartedPayload | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    if (isCreateRoute) {
      return;
    }

    setError(null);
    setSessionStarted(null);
    setJoinedLobby(readPersistedLobby(requestedCode));
  }, [isCreateRoute, requestedCode]);

  useEffect(() => {
    if (socket.connected) {
      setIsConnected(true);
      setSocketId(socket.id ?? null);
    } else if (!socket.active) {
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
      if (!isCreateRoute && payload.code !== requestedCode && payload.code !== joinedLobby?.code) {
        return;
      }

      setJoinedLobby(payload);
      persistActiveLobby(payload);
      setIsBusy(false);
      setError(null);
    };

    const handleLobbyError = (payload: { message: string }) => {
      setError(payload.message);
      setIsBusy(false);
    };

    const handleSessionStarted = (payload: SessionStartedPayload) => {
      if (joinedLobby && payload.lobbyCode !== joinedLobby.code && !isCreateRoute) {
        return;
      }

      setSessionStarted(payload);
      setIsBusy(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.server.lobbyUpdated, handleLobbyUpdated);
    socket.on(SOCKET_EVENTS.server.lobbyError, handleLobbyError);
    socket.on(SOCKET_EVENTS.server.sessionStarted, handleSessionStarted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.server.lobbyUpdated, handleLobbyUpdated);
      socket.off(SOCKET_EVENTS.server.lobbyError, handleLobbyError);
      socket.off(SOCKET_EVENTS.server.sessionStarted, handleSessionStarted);

      if (inviteResetRef.current) {
        window.clearTimeout(inviteResetRef.current);
      }
    };
  }, [isCreateRoute, joinedLobby, requestedCode, socket]);

  const me =
    socketId && joinedLobby
      ? joinedLobby.players.find((player) => player.id === socketId) ?? null
      : null;
  const isHost = Boolean(joinedLobby && socketId && joinedLobby.hostId === socketId);

  return {
    draft,
    error,
    isBusy,
    isConnected,
    isHost,
    joinedLobby,
    me,
    sessionStarted,
    copiedInvite,
    setNickname(value) {
      setDraft((current) => ({
        ...current,
        nickname: value,
      }));
    },
    setCarId(value) {
      setDraft((current) => ({
        ...current,
        carId: value,
      }));
    },
    submit() {
      const nickname = draft.nickname.trim();

      if (!nickname) {
        setError('Inserisci un nickname prima di entrare in pista.');
        return;
      }

      setError(null);
      setIsBusy(true);

      if (isCreateRoute) {
        socket.emit(SOCKET_EVENTS.client.createLobby, {
          nickname,
          carId: draft.carId,
        });
        return;
      }

      socket.emit(SOCKET_EVENTS.client.joinLobby, {
        code: requestedCode,
        nickname,
        carId: draft.carId,
      });
    },
    toggleReady() {
      if (!me) {
        return;
      }

      setIsBusy(true);
      socket.emit(SOCKET_EVENTS.client.setReady, {
        ready: !me.ready,
      });
    },
    leave() {
      if (!joinedLobby) {
        return;
      }

      socket.emit(SOCKET_EVENTS.client.leaveLobby, {
        code: joinedLobby.code,
      });
      setJoinedLobby(null);
      setSessionStarted(null);
      setIsBusy(false);
      setCopiedInvite(false);
      persistActiveLobby(null);
    },
    selectGame(game, variant) {
      if (!joinedLobby || !isHost) {
        return;
      }

      setIsBusy(true);
      socket.emit(SOCKET_EVENTS.client.selectGame, {
        code: joinedLobby.code,
        game,
        variant,
      });
    },
    updateSettings(settings) {
      if (!joinedLobby || !isHost) {
        return;
      }

      setIsBusy(true);
      socket.emit(SOCKET_EVENTS.client.updateLobbySettings, {
        code: joinedLobby.code,
        settings,
      });
    },
    startSession() {
      if (!joinedLobby) {
        return;
      }

      setIsBusy(true);
      socket.emit(SOCKET_EVENTS.client.startSession, {
        code: joinedLobby.code,
      });
    },
    kickPlayer(playerId) {
      if (!joinedLobby || !isHost) {
        return;
      }

      setIsBusy(true);
      socket.emit(SOCKET_EVENTS.client.kickPlayer, {
        code: joinedLobby.code,
        playerId,
      });
    },
    async copyInviteLink() {
      if (!joinedLobby) {
        return;
      }

      const inviteUrl = `${window.location.origin}/lobby/${joinedLobby.code}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);

      if (inviteResetRef.current) {
        window.clearTimeout(inviteResetRef.current);
      }

      inviteResetRef.current = window.setTimeout(() => {
        setCopiedInvite(false);
      }, 1500);
    },
  };
}
