import { Link } from 'react-router-dom';

type PersistedLobby = {
  code: string;
};

const hubCards = [
  {
    title: 'Singolo',
    description:
      'Scegli il gioco e vai subito in sessione locale: semaforo, rigori e la nuova famiglia corse.',
    to: '/hub/single',
  },
  {
    title: 'Multiplayer',
    description:
      'Apri o raggiungi una party lobby neutra al gioco e lascia all host la scelta della sessione.',
    to: '/hub/multiplayer',
  },
];

export function HubPage() {
  const activeLobby =
    typeof window === 'undefined'
      ? null
      : (() => {
          const raw = window.localStorage.getItem('blitz-active-lobby');

          if (!raw) {
            return null;
          }

          try {
            return JSON.parse(raw) as PersistedLobby;
          } catch {
            return null;
          }
        })();

  return (
    <section className="panel hub-panel">
      <p className="eyebrow">Powered By Idrocarburi</p>
      <h1>Scegli Modalita</h1>
      <p className="lede">
        Blitz entra in party mode: prima decidi se giochi da solo o in lobby, poi scegli il gioco.
        Bot mode esce dalla vetrina e la corsa smette di comandare tutta l app.
      </p>
      <p className="hub-signoff">
        SubrataPal approved. Modalita prima del rumore. Tutti i giri riservati.
      </p>
      {activeLobby?.code ? (
        <div className="action-row">
          <Link className="button button-primary" to={`/lobby/${activeLobby.code}`}>
            {`Rientra Lobby ${activeLobby.code}`}
          </Link>
        </div>
      ) : null}
      <div className="card-grid">
        {hubCards.map((card) => (
          <Link className="card card-link" key={card.to} to={card.to}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
