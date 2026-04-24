import type { RetroRaceState } from '../game/useRetroRace';

function formatTime(elapsedMs: number) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const tenths = Math.floor((elapsedMs % 1000) / 100);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

interface RetroHudProps {
  label: string;
  state: RetroRaceState;
}

export function RetroHud({ label, state }: RetroHudProps) {
  return (
    <div className="retro-hud">
      <div className="retro-hud-box">
        <span className="retro-hud-label">SESSIONE</span>
        <strong>{label}</strong>
      </div>
      <div className="retro-hud-box">
        <span className="retro-hud-label">TEMPO</span>
        <strong>{formatTime(state.elapsedMs)}</strong>
      </div>
      <div className="retro-hud-box">
        <span className="retro-hud-label">KM/H</span>
        <strong>{Math.round(state.player.speed * 58)}</strong>
      </div>
      <div className="retro-hud-box">
        <span className="retro-hud-label">GIRO</span>
        <strong>{Math.round(state.lapProgress * 100)}%</strong>
      </div>
      <div className="retro-hud-box">
        <span className="retro-hud-label">RADIO BOX</span>
        <strong>{state.message}</strong>
      </div>
    </div>
  );
}
