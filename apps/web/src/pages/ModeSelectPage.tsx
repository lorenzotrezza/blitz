import { Link } from 'react-router-dom';

type ModeSelectPageProps = {
  mode: 'single' | 'multiplayer';
};

type ModeCard = {
  title: string;
  description: string;
  to?: string;
  kicker?: string;
};

const singleCards: ModeCard[] = [
  {
    title: 'Semaforo',
    description: 'Partenza secca e riflessi puri. Entri subito nella schermata dedicata.',
    to: '/hub/minigames/lights',
  },
  {
    title: 'Rigori',
    description: 'Sfida arcade locale, senza lobby, con accesso diretto al minigioco.',
    to: '/hub/minigames/penalty',
  },
  {
    title: 'Corse',
    description: 'La famiglia corse converge su Sprint Circuit. Il runtime nuovo arriva nei task successivi.',
    kicker: 'Sprint Circuit',
  },
];

const multiplayerCards: ModeCard[] = [
  {
    title: 'Crea Lobby',
    description: 'Apri la room party, invita il roster e poi scegli gioco e variante dentro la lobby.',
    to: '/lobby/new',
  },
  {
    title: 'Entra Con Codice',
    description:
      'Il join resta guidato da codice o link invito. Una volta dentro, tutto il flow diventa condiviso.',
  },
];

export function ModeSelectPage({ mode }: ModeSelectPageProps) {
  const isSingle = mode === 'single';
  const cards = isSingle ? singleCards : multiplayerCards;

  return (
    <section className="panel hub-panel">
      <p className="eyebrow">{isSingle ? 'Sessione Locale' : 'Party Lobby'}</p>
      <h1>{isSingle ? 'Catalogo Singolo' : 'Ingresso Multiplayer'}</h1>
      <p className="lede">
        {isSingle
          ? 'Qui selezioni il gioco locale. Semaforo e rigori sono diretti, mentre corse converge sul nuovo Sprint Circuit.'
          : 'Qui inizi il flusso multiplayer neutro al gioco: prima lobby, poi selezione gioco, start condiviso e results comuni.'}
      </p>
      <div className="card-grid">
        {cards.map((card) =>
          card.to ? (
            <Link className="card card-link" key={card.title} to={card.to}>
              {card.kicker ? <p className="mode-card-kicker">{card.kicker}</p> : null}
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </Link>
          ) : (
            <article className="card card-disabled" key={card.title}>
              {card.kicker ? <p className="mode-card-kicker">{card.kicker}</p> : null}
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </article>
          ),
        )}
      </div>
      <div className="action-row">
        <Link className="button button-secondary" to="/hub">
          Torna al Hub
        </Link>
      </div>
    </section>
  );
}
