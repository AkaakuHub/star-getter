import type { Track } from '../../domain/game/model';
import { compose, type Note } from './composition';
import { scheduleNote } from './synth';

export class AudioSession {
  private readonly context: AudioContext;
  private readonly output: GainNode;
  private readonly notes: readonly Note[];
  private readonly secondsPerBeat: number;
  private origin = 0;
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
  }

  static async create(track: Track, muted: boolean): Promise<AudioSession> {
    const session = new AudioSession(track, muted);
    try {
      await session.context.resume();
      session.origin = session.context.currentTime + 0.1;
      session.schedule();
      session.timer = setInterval(() => session.schedule(), 50);
      return session;
    } catch (error) {
      await session.close();
      throw error;
    }
  }

  get seconds(): number {
    return Math.max(0, this.context.currentTime - this.origin);
  }

  get interrupted(): boolean {
    return !this.closed && this.context.state !== 'running';
  }

  setMuted(muted: boolean): void {
    if (this.closed) return;
    this.output.gain.setTargetAtTime(muted ? 0 : 0.6, this.context.currentTime, 0.03);
  }

  async pause(): Promise<void> {
    if (!this.closed) await this.context.suspend();
  }

  async resume(): Promise<void> {
    if (!this.closed) await this.context.resume();
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
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
