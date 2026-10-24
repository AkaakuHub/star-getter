export interface PlaybackClock {
  readonly seconds: number;
  readonly interrupted: boolean;
  setMuted(muted: boolean): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  close(): Promise<void>;
}

export interface FrameScheduler {
  request(callback: (timestamp: number) => void): number;
  cancel(handle: number): void;
}
