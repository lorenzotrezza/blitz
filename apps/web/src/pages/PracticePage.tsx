import { RetroRaceView } from '../components/RetroRaceView';

export function PracticePage() {
  return (
    <section className="panel">
      <p className="eyebrow">Garage Libero</p>
      <h1>Allenamento Libero</h1>
      <p className="lede">
        Qui la pista e nativa: sterzo piu morbido del prototype legacy, HUD del box e spazio per
        prendere la mano prima della gara vera.
      </p>
      <RetroRaceView mode="practice" label="BOT: OFF" />
    </section>
  );
}
