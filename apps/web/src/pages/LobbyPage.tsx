import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { type LobbyState } from '@blitz/shared';

import { useLobbySocket } from '../lib/useLobbySocket';

export function LobbyPage() {
  return <Outlet />;
}

const CAR_OPTIONS = [
  { value: 'f812', label: 'Ferrari 812' },
  { value: 'panda', label: 'Panda di Piero' },
  { value: 'tesla', label: 'Tesla iPad' },
  { value: 'nave', label: 'MSC Nave' },
];

function allDriversReady(lobby: LobbyState | null) {
  return Boolean(lobby && lobby.players.length > 0 && lobby.players.every((player) => player.ready));
}

export function LobbyIndexPage() {
  const navigate = useNavigate();
  const { lobbyCode = 'NEW' } = useParams();
  const formattedCode = lobbyCode.toUpperCase();
  const isCreateRoute = formattedCode === 'NEW';
  const {
    draft,
    error,
    isBusy,
    isConnected,
    isHost,
    joinedLobby,
    me,
    raceStarted,
    copiedInvite,
    setNickname,
    setCarId,
    submit,
    toggleReady,
    leave,
    startRace,
    copyInviteLink,
  } = useLobbySocket(formattedCode);
  const effectiveCode = joinedLobby?.code ?? formattedCode;
  const readyToLaunch = allDriversReady(joinedLobby);

  useEffect(() => {
    if (isCreateRoute && joinedLobby?.code && joinedLobby.code !== 'NEW') {
      navigate(`/lobby/${joinedLobby.code}`, { replace: true });
    }
  }, [isCreateRoute, joinedLobby, navigate]);

  useEffect(() => {
    if (raceStarted) {
      navigate(`/race/live/${raceStarted.sessionId}`, {
        replace: true,
        state: raceStarted,
      });
    }
  }, [navigate, raceStarted]);

  return (
    <section className="panel lobby-panel">
      <p className="eyebrow">{isCreateRoute ? 'Parco Chiuso' : 'Griglia Privata'}</p>
      <h1>{isCreateRoute ? 'Crea Lobby Live' : `Lobby ${effectiveCode}`}</h1>
      <p className="lede">
        Qui parte la versione seria: nickname, auto, link vero da girare agli amici e partenza live
        senza tornare alle hash route del prototipo.
      </p>

      <div className="lobby-grid">
        <form
          className="card lobby-card lobby-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <h2>{isCreateRoute ? 'Setup Host' : 'Ingresso Pilota'}</h2>
          <label className="lobby-field">
            <span>Nickname</span>
            <input
              aria-label="Nickname"
              className="lobby-input"
              name="nickname"
              value={draft.nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Blitz"
            />
          </label>
          <label className="lobby-field">
            <span>Macchina</span>
            <select
              aria-label="Macchina"
              className="lobby-input"
              name="carId"
              value={draft.carId}
              onChange={(event) => setCarId(event.target.value)}
            >
              {CAR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="button button-primary" type="submit" disabled={isBusy}>
            {isCreateRoute ? 'Crea Lobby' : 'Entra in Lobby'}
          </button>
          <p className="lobby-meta">
            {isConnected ? 'Socket attivo' : 'Socket offline'} ·{' '}
            {joinedLobby ? `griglia ${joinedLobby.players.length}/${joinedLobby.settings.maxPlayers}` : 'in attesa di join'}
          </p>
        </form>

        <article className="card lobby-card">
          <h2>Invite Link</h2>
          <p className="lobby-meta">{`/lobby/${effectiveCode}`}</p>
          <div className="action-row">
            <button
              className="button button-secondary"
              type="button"
              disabled={!joinedLobby}
              onClick={() => {
                void copyInviteLink();
              }}
            >
              {copiedInvite ? 'Invito Copiato' : 'Copia Invito'}
            </button>
          </div>
        </article>

        <article className="card lobby-card">
          <h2>Roster</h2>
          {joinedLobby ? (
            <ul className="lobby-roster">
              {joinedLobby.players.map((player) => (
                <li className="lobby-player" key={player.id}>
                  <div>
                    <strong>{player.nickname}</strong>
                    <span className="lobby-player-meta">
                      {player.carId} · {joinedLobby.hostId === player.id ? 'HOST' : 'GRID'}
                    </span>
                  </div>
                  <span className={`lobby-pill ${player.ready ? 'is-ready' : ''}`}>
                    {player.ready ? 'PRONTO' : 'BOX'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="lobby-meta">
              Nessun pilota in sessione ancora. Crea la stanza o entra con il codice giusto.
            </p>
          )}
        </article>
      </div>

      {joinedLobby ? (
        <div className="action-row">
          <button className="button button-secondary" type="button" onClick={toggleReady}>
            {me?.ready ? 'Non Pronto' : 'Pronto'}
          </button>
          <button className="button button-secondary" type="button" onClick={leave}>
            Lascia Lobby
          </button>
          {isHost ? (
            <button
              className="button button-primary"
              type="button"
              disabled={!readyToLaunch || isBusy}
              onClick={startRace}
            >
              Avvia Gara Live
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <article className="card lobby-error-card">
          <h2>Errore Box</h2>
          <p>{error}</p>
        </article>
      ) : null}
    </section>
  );
}
