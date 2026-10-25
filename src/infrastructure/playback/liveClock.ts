import type { PlaybackClock } from '../../app/playbackPorts';

export class LiveClock implements PlaybackClock {
  private origin: number;
  private elapsed = 0;
  private paused = false;
  private closed = false;

  constructor(private readonly now: () => number) {
    this.origin = now();
  }

  get seconds(): number {
    return this.elapsed + (this.paused ? 0 : this.now() - this.origin);
  }

  async pause(): Promise<void> {
    if (this.paused) return;
    this.elapsed = this.seconds;
    this.paused = true;
  }

  async resume(): Promise<void> {
    if (!this.paused || this.closed) return;
    this.origin = this.now();
    this.paused = false;
  }

  async close(): Promise<void> {
    this.closed = true;
    await this.pause();
  }
}
