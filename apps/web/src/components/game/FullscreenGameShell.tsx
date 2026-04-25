import { type ReactNode } from 'react';

interface FullscreenGameShellProps {
  hud: ReactNode;
  viewport: ReactNode;
  controls: ReactNode;
  stateOverlay?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function FullscreenGameShell({
  hud,
  viewport,
  controls,
  stateOverlay,
  backHref,
  backLabel = 'Back',
}: FullscreenGameShellProps) {
  return (
    <section className="game-shell" aria-label="Fullscreen race session">
      {backHref ? (
        <a className="game-shell__back" href={backHref}>
          {backLabel}
        </a>
      ) : null}
      <div className="game-shell__hud">{hud}</div>
      <div className="game-shell__viewport">{viewport}</div>
      <div className="game-shell__controls">{controls}</div>
      {stateOverlay ? <div className="game-shell__state">{stateOverlay}</div> : null}
    </section>
  );
}
