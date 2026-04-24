import { Outlet, useParams } from 'react-router-dom';

export function LobbyPage() {
  return <Outlet />;
}

export function LobbyIndexPage() {
  const { lobbyCode = '----' } = useParams();
  const formattedCode = lobbyCode.toUpperCase();

  return (
    <section className="panel">
      <p className="eyebrow">Private Room</p>
      <h1>Lobby {formattedCode}</h1>
      <p className="lede">
        Share this code with the grid. The host can ready the room, enable bots, and launch a live
        countdown without falling back to hash routes.
      </p>
      <div className="card-grid">
        <article className="card">
          <h2>Ready State</h2>
          <p>Slots for up to 8 drivers, with host reassignment and Railway-backed sockets next.</p>
        </article>
        <article className="card">
          <h2>Invite Link</h2>
          <p>{`/lobby/${formattedCode}`}</p>
        </article>
      </div>
    </section>
  );
}
