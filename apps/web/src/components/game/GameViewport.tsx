import { type ReactNode } from 'react';

interface GameViewportProps {
  children?: ReactNode;
  label: string;
  aspectRatio?: string;
}

export function GameViewport({ children, label, aspectRatio = '16 / 9' }: GameViewportProps) {
  return (
    <div
      aria-label={label}
      className="game-viewport"
      role="img"
      style={{ aspectRatio }}
    >
      <div className="game-viewport__stage">{children}</div>
    </div>
  );
}
