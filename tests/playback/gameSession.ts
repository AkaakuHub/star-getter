import { GameController } from '../../src/app/gameController';
import type { GameAudio, GameSound } from '../../src/app/gameAudio';
import type { FrameScheduler, PlaybackClock } from '../../src/app/playbackPorts';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

class TestClock implements PlaybackClock {
  seconds = 0;
  paused = false;
  closeCalls = 0;
  pauseBarrier: Promise<void> | null = null;
  resumeBarrier: Promise<void> | null = null;
  async pause(): Promise<void> {
    await this.pauseBarrier;
    this.paused = true;
  }
  async resume(): Promise<void> {
    await this.resumeBarrier;
    this.paused = false;
  }
  async close(): Promise<void> {
    this.closeCalls++;
  }
}

class TestFrames implements FrameScheduler {
  private next = 1;
  private readonly callbacks = new Map<number, (timestamp: number) => void>();
  get pending(): number {
    return this.callbacks.size;
  }
  request(callback: (timestamp: number) => void): number {
    const handle = this.next++;
    this.callbacks.set(handle, callback);
    return handle;
  }
  cancel(handle: number): void {
    this.callbacks.delete(handle);
  }
  run(timestamp: number): void {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of callbacks) callback(timestamp);
  }
}

class TestAudio implements GameAudio {
  readonly sounds: GameSound[] = [];
  muted = false;
  unlockCalls = 0;
  closeCalls = 0;
  unlockBarrier: Promise<void> | null = null;
  async unlock(): Promise<void> {
    this.unlockCalls++;
    await this.unlockBarrier;
  }
  setMuted(muted: boolean): void {
    this.muted = muted;
  }
  play(sound: GameSound): void {
    this.sounds.push(sound);
  }
  async close(): Promise<void> {
    this.closeCalls++;
  }
}

export function session(energy = 10) {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  const clock = new TestClock();
  const frames = new TestFrames();
  const audio = new TestAudio();
  const controller = new GameController(
    { ...createGame(track, routes.library.deck, 7, 100, routes.library.tokens), energy },
    clock,
    frames,
    audio,
    false,
  );
  return { clock, frames, controller, audio };
}
