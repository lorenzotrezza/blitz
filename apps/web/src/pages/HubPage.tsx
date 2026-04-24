import { Link } from 'react-router-dom';

const hubCards = [
  {
    title: 'Reaction Lights',
    description: 'Warm up the reflexes before the lobby countdown.',
    to: '/hub/minigames/lights',
  },
  {
    title: 'Penalty Shootout',
    description: 'Three shots. SubrataPal still dives the wrong way.',
    to: '/hub/minigames/penalty',
  },
  {
    title: 'Practice Run',
    description: 'Solo track time to tune steering before the real grid.',
    to: '/practice',
  },
  {
    title: 'Bot Race',
    description: 'Serious arcade race against server-driven fillers.',
    to: '/race/bot',
  },
  {
    title: 'Live Lobby',
    description: 'Share one link, stack the grid, and race together.',
    to: '/lobby/ABCD12',
  },
];

export function HubPage() {
  return (
    <section className="panel">
      <p className="eyebrow">Control Room</p>
      <h1>Game Hub</h1>
      <p className="lede">
        Pick a mode with real routes behind it. The UI is now app-shaped, so the next layers can
        add sockets, Phaser, and lobby state without dragging the old DOM toggles along.
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
