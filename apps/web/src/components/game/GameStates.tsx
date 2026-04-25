export function GameEmptyState() {
  return (
    <div className="game-state" role="status">
      <h2>Waiting for race</h2>
      <p>No live snapshot yet. Keep this screen open; the countdown appears when the server starts the session.</p>
    </div>
  );
}

export function GameErrorState() {
  return (
    <div className="game-state game-state--error" role="alert">
      <h2>Connection lost</h2>
      <p>Connection lost. Rejoin from the lobby or refresh this session.</p>
    </div>
  );
}
