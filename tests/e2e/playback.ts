import type { FrameScheduler, PlaybackClock } from '../../src/app/playbackPorts';
import type { GameAudio, GameSound } from '../../src/app/gameAudio';

export class ScenarioAudio implements GameAudio {
  muted = false;
  closed = false;
  readonly sounds: GameSound[] = [];

  unlock(): Promise<void> {
    return Promise.resolve();
  }
  setMuted(muted: boolean): void {
    this.muted = muted;
  }
  play(sound: GameSound): void {
    if (!this.muted && !this.closed) this.sounds.push(sound);
  }
  close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }
}

export class ScenarioClock implements PlaybackClock {
  seconds = 0;
  pause(): Promise<void> {
    return Promise.resolve();
  }
  resume(): Promise<void> {
    return Promise.resolve();
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

export class ScenarioFrames implements FrameScheduler {
  private nextHandle = 1;
  private readonly callbacks = new Map<number, (timestamp: number) => void>();
  request(callback: (timestamp: number) => void): number {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, callback);
    return handle;
  }
  cancel(handle: number): void {
    this.callbacks.delete(handle);
  }
  run(timestamp: number): void {
    const pending = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of pending) callback(timestamp);
  }
}
