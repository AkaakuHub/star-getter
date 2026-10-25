export type GameSound = 'heart-spawn' | 'heart-collect';

export interface GameAudio {
  unlock(): Promise<void>;
  setMuted(muted: boolean): void;
  play(sound: GameSound): void;
  close(): Promise<void>;
}
