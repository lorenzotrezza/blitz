import { Link } from 'react-router-dom';

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
