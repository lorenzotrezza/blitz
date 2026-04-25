import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { type LobbyState } from '@blitz/shared';

import { resolveSessionRoute } from '../lib/sessionRoutes';
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

const RACE_VARIANTS = [
  { value: 'sprint-circuit', label: 'Sprint Circuit' },
  { value: 'drag-sprint', label: 'Drag Sprint' },
] as const;

const DRAG_SPRINT_MODES = [
  { value: 'finish-line', label: 'Finish Line' },
  { value: 'best-of-3', label: 'Best of 3' },
  { value: 'survival', label: 'Survival' },
] as const;

function allDriversReady(lobby: LobbyState | null) {
  return Boolean(lobby && lobby.players.length > 0 && lobby.players.every((player) => player.ready));
}

function gameLabel(game: LobbyState['selectedGame']) {
  if (game === 'lights') {
    return 'Semaforo';
  }

  if (game === 'penalty') {
    return 'Rigori';
  }

  return 'Corse';
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
    sessionStarted,
    copiedInvite,
    setNickname,
    setCarId,
    submit,
    toggleReady,
    leave,
    selectGame,
    updateSettings,
    startSession,
    kickPlayer,
    copyInviteLink,
  } = useLobbySocket(formattedCode);
  const effectiveCode = joinedLobby?.code ?? formattedCode;
  const readyToLaunch = allDriversReady(joinedLobby);
  const canStartSession = Boolean(
    joinedLobby &&
      readyToLaunch &&
      (joinedLobby.selectedGame !== 'race' || joinedLobby.selectedVariant),
  );
  const selectedRaceMode =
    typeof joinedLobby?.settings.raceMode === 'string' ? joinedLobby.settings.raceMode : null;

  useEffect(() => {
    if (isCreateRoute && joinedLobby?.code && joinedLobby.code !== 'NEW') {
      navigate(`/lobby/${joinedLobby.code}`, { replace: true });
    }
  }, [isCreateRoute, joinedLobby, navigate]);

  useEffect(() => {
    if (sessionStarted) {
      navigate(resolveSessionRoute(sessionStarted), {
        replace: true,
        state: sessionStarted,
      });
    }
  }, [navigate, sessionStarted]);

  return (
    <section className="panel lobby-panel">
      <p className="eyebrow">{isCreateRoute ? 'Parco Chiuso' : 'Griglia Privata'}</p>
      <h1>{isCreateRoute ? 'Crea Lobby Live' : `Lobby ${effectiveCode}`}</h1>
      <p className="lede">
        Lobby neutra al gioco: roster, link, selezione titolo, varianti corse e controllo host senza
        rami bot appesi alla navigazione.
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
          <h2>Selezione Gioco</h2>
          {joinedLobby ? (
            <>
              <p className="lobby-meta">{`Scelto: ${gameLabel(joinedLobby.selectedGame)}`}</p>
              <div className="action-row">
                <button
                  className={`button ${joinedLobby.selectedGame === 'lights' ? 'button-primary' : 'button-secondary'}`}
                  type="button"
                  disabled={!isHost || isBusy}
                  onClick={() => selectGame('lights', null)}
                >
                  Semaforo
                </button>
                <button
                  className={`button ${joinedLobby.selectedGame === 'penalty' ? 'button-primary' : 'button-secondary'}`}
                  type="button"
                  disabled={!isHost || isBusy}
                  onClick={() => selectGame('penalty', null)}
                >
                  Rigori
                </button>
                <button
                  className={`button ${joinedLobby.selectedGame === 'race' ? 'button-primary' : 'button-secondary'}`}
                  type="button"
                  disabled={!isHost || isBusy}
                  onClick={() => selectGame('race', joinedLobby.selectedVariant ?? 'sprint-circuit')}
                >
                  Corse
                </button>
              </div>
              {joinedLobby.selectedGame === 'race' ? (
                <>
                  <div className="action-row">
                    {RACE_VARIANTS.map((variant) => (
                      <button
                        key={variant.value}
                        className={`button ${joinedLobby.selectedVariant === variant.value ? 'button-primary' : 'button-secondary'}`}
                        type="button"
                        disabled={!isHost || isBusy}
                        onClick={() => {
                          selectGame('race', variant.value);

                          if (variant.value === 'drag-sprint' && !selectedRaceMode) {
                            updateSettings({
                              raceMode: 'finish-line',
                            });
                          }
                        }}
                      >
                        {variant.label}
                      </button>
                    ))}
                  </div>
                  {joinedLobby.selectedVariant === 'drag-sprint' ? (
                    <div className="action-row">
                      {DRAG_SPRINT_MODES.map((mode) => (
                        <button
                          key={mode.value}
                          className={`button ${selectedRaceMode === mode.value ? 'button-primary' : 'button-secondary'}`}
                          type="button"
                          disabled={!isHost || isBusy}
                          onClick={() =>
                            updateSettings({
                              raceMode: mode.value,
                            })
                          }
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </>
          ) : (
            <p className="lobby-meta">La selezione gioco si sblocca appena entri nella room.</p>
          )}
        </article>

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
                  <div className="lobby-player-actions">
                    <span className={`lobby-pill ${player.ready ? 'is-ready' : ''}`}>
                      {player.ready ? 'PRONTO' : 'BOX'}
                    </span>
                    {isHost && joinedLobby.hostId !== player.id ? (
                      <button
                        className="button button-secondary button-compact"
                        type="button"
                        onClick={() => kickPlayer(player.id)}
                      >
                        {`Kick ${player.nickname}`}
                      </button>
                    ) : null}
                  </div>
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
              disabled={!canStartSession || isBusy}
              onClick={startSession}
            >
              Avvia Sessione
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
