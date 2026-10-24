import type { Track } from '../../domain/game/model';
import { compose, type Note } from './composition';
import { scheduleNote } from './synth';
import { LiveClock } from './liveClock';

export class AudioSession {
  private readonly context: AudioContext;
  private readonly output: GainNode;
  private readonly notes: readonly Note[];
  private readonly secondsPerBeat: number;
  private origin = 0;
  private readonly clock: LiveClock;
  private audioStarted = false;
  private nextNote = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  private constructor(track: Track, muted: boolean) {
    this.context = new AudioContext({ latencyHint: 'interactive' });
    this.output = this.context.createGain();
    this.output.gain.value = muted ? 0 : 0.6;
    this.output.connect(this.context.destination);
    this.secondsPerBeat = 60 / track.bpm;
    this.notes = compose(track);
    this.clock = new LiveClock(() => performance.now() / 1000);
  }

  static create(track: Track, muted: boolean): AudioSession {
    const session = new AudioSession(track, muted);
    session.context.addEventListener('statechange', session.alignAudio);
    window.addEventListener('pointerdown', session.unlockAudio);
    window.addEventListener('keydown', session.unlockAudio);
    session.alignAudio();
    session.unlockAudio();
    session.timer = setInterval(() => session.schedule(), 50);
    return session;
  }

  private readonly alignAudio = (): void => {
    if (this.closed || this.context.state !== 'running') return;
    window.removeEventListener('pointerdown', this.unlockAudio);
    window.removeEventListener('keydown', this.unlockAudio);
    this.audioStarted = true;
    this.origin = this.context.currentTime - this.clock.seconds;
    this.schedule();
  };

  private readonly unlockAudio = (): void => {
    if (this.closed || this.audioStarted) return;
    void this.context
      .resume()
      .then(() => {
        if (this.closed) return;
        this.alignAudio();
        window.removeEventListener('pointerdown', this.unlockAudio);
        window.removeEventListener('keydown', this.unlockAudio);
      })
      .catch((failure: unknown) => {
        if (!this.closed) console.error(failure);
      });
  };

  get seconds(): number {
    return this.clock.seconds;
  }

  get interrupted(): boolean {
    return !this.closed && this.audioStarted && this.context.state !== 'running';
  }

  setMuted(muted: boolean): void {
    if (this.closed) return;
    this.output.gain.setTargetAtTime(muted ? 0 : 0.6, this.context.currentTime, 0.03);
  }

  async pause(): Promise<void> {
    this.clock.pause();
    if (!this.closed) await this.context.suspend();
  }

  async resume(): Promise<void> {
    if (this.closed) return;
    this.clock.resume();
    this.unlockAudio();
    if (this.audioStarted) await this.context.resume();
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    window.removeEventListener('pointerdown', this.unlockAudio);
    window.removeEventListener('keydown', this.unlockAudio);
    this.context.removeEventListener('statechange', this.alignAudio);
    if (this.timer !== null) clearInterval(this.timer);
    this.output.disconnect();
    await this.context.close();
  }

  private schedule(): void {
    if (this.context.state !== 'running' || this.closed) return;
    const horizon = this.context.currentTime + 0.2;
    while (this.nextNote < this.notes.length) {
      const note = this.notes[this.nextNote];
      if (!note) break;
      const time = this.origin + note.beat * this.secondsPerBeat;
      if (time > horizon) break;
      if (time >= this.context.currentTime)
        scheduleNote(this.context, this.output, note, time, this.secondsPerBeat);
      this.nextNote++;
    }
  }
}
