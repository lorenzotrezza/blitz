import { useEffect, useMemo, useRef, useState } from 'react';

import type { LobbyState, PlayerInfo, RaceStartedPayload } from '@blitz/shared';
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
  raceStarted: RaceStartedPayload | null;
  copiedInvite: boolean;
  setNickname: (value: string) => void;
  setCarId: (value: string) => void;
  submit: () => void;
  toggleReady: () => void;
  leave: () => void;
  startRace: () => void;
  copyInviteLink: () => Promise<void>;
}

const CREATE_ROUTE_CODE = 'NEW';

const DEFAULT_DRAFT: LobbyDraft = {
  nickname: '',
  carId: 'f812',
};

function normalizeLobbyCode(value: string) {
  return value.trim().toUpperCase();
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
  const [joinedLobby, setJoinedLobby] = useState<LobbyState | null>(null);
  const [raceStarted, setRaceStarted] = useState<RaceStartedPayload | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    if (isCreateRoute) {
      return;
    }

    setError(null);
    setRaceStarted(null);
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
      setIsBusy(false);
      setError(null);
    };

    const handleLobbyError = (payload: { message: string }) => {
      setError(payload.message);
      setIsBusy(false);
    };

    const handleRaceStarted = (payload: RaceStartedPayload) => {
      if (joinedLobby && payload.lobbyCode !== joinedLobby.code && !isCreateRoute) {
        return;
      }

      setRaceStarted(payload);
      setIsBusy(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.server.lobbyUpdated, handleLobbyUpdated);
    socket.on(SOCKET_EVENTS.server.lobbyError, handleLobbyError);
    socket.on(SOCKET_EVENTS.server.raceStarted, handleRaceStarted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.server.lobbyUpdated, handleLobbyUpdated);
      socket.off(SOCKET_EVENTS.server.lobbyError, handleLobbyError);
      socket.off(SOCKET_EVENTS.server.raceStarted, handleRaceStarted);

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
    raceStarted,
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
      setRaceStarted(null);
      setIsBusy(false);
      setCopiedInvite(false);
    },
    startRace() {
      if (!joinedLobby) {
        return;
      }

      setIsBusy(true);
      socket.emit(SOCKET_EVENTS.client.startRace, {
        code: joinedLobby.code,
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
