import { Link } from 'react-router-dom';

const hubCards = [
  {
    title: 'Semaforo',
    description: 'La partenza vera del vecchio club. Occhio al verde o Leclerc ti mangia vivo.',
    to: '/hub/minigames/lights',
  },
  {
    title: 'Rigori',
    description: 'Tre tiri secchi contro SubrataPal. In porta resta convinto, non efficace.',
    to: '/hub/minigames/penalty',
  },
  {
    title: 'Allenamento Libero',
    description: 'Giri da solo per sistemare il volante prima che il box apra davvero.',
    to: '/practice',
  },
  {
    title: 'Bot Race',
    description: 'Griglia arcade con riempitivi digitali. Rumore vero, pieta zero.',
    to: '/race/bot',
  },
  {
    title: 'Lobby Live',
    description: 'Passa il codice, riempi la griglia e porta gli amici nel casino autorizzato.',
    to: '/lobby/ABCD12',
  },
];

export function HubPage() {
  return (
    <section className="panel hub-panel">
      <p className="eyebrow">Powered By Idrocarburi</p>
      <h1>Hub Minigiochi</h1>
      <p className="lede">
        Il garage nuovo usa finalmente le destinazioni vere del club: semaforo, rigori,
        allenamento, bot race e lobby live. Nessun guscio demo, nessuna voce finta, solo scorciatoie
        pulite verso il caos legacy.
      </p>
      <p className="hub-signoff">
        SubrataPal approved. No Tesla allowed. Tutti i giri riservati.
      </p>
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
