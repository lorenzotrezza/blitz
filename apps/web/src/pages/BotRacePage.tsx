import { RetroRaceView } from '../components/RetroRaceView';

export function BotRacePage() {
  return (
    <section className="panel">
      <p className="eyebrow">Griglia Arcade</p>
      <h1>Bot Race</h1>
      <p className="lede">
        Prima della lobby live, qui provi la corsa nativa contro riempitivi digitali. La fisica e
        arcade, il ritmo e piu serio del vecchio minigioco.
      </p>
      <RetroRaceView mode="bot" label="BOT: ON" />
    </section>
  );
}
