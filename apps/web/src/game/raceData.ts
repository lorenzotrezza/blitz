export type RaceMode = 'practice' | 'bot';

export interface RetroRaceBotSeed {
  id: string;
  lane: number;
  distance: number;
  speed: number;
  color: string;
}

export const TRACK_BOUNDS = {
  left: 0.18,
  right: 0.82,
} as const;

export const TRACK_LENGTH = 4800;

export const BOT_SEEDS: RetroRaceBotSeed[] = [
  { id: 'bot-1', lane: 0, distance: 180, speed: 2.7, color: '#ff3333' },
  { id: 'bot-2', lane: 1, distance: 320, speed: 2.45, color: '#ffd700' },
  { id: 'bot-3', lane: 2, distance: 460, speed: 2.3, color: '#00aadd' },
];

export const PLAYER_COLOR = '#33ff66';
