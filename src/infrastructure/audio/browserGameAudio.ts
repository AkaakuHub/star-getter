import type { GameAudio, GameSound } from '../../app/gameAudio';
import { playHeartSound } from './heartSound';

export class BrowserGameAudio implements GameAudio {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private closed = false;
  private collectionQueued = false;

  constructor(private muted: boolean) {}

  async unlock(): Promise<void> {
    if (this.closed || this.muted) return;
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' });
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state !== 'running') await this.context.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.context && this.masterGain)
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.context.currentTime, 0.008);
  }

  play(sound: GameSound): void {
    if (sound === 'heart-collect') {
      if (this.collectionQueued) return;
      this.collectionQueued = true;
      queueMicrotask(() => {
        this.collectionQueued = false;
        this.playTone(sound);
      });
    } else {
      this.playTone(sound);
    }
  }

  private playTone(sound: GameSound): void {
    if (
      this.closed ||
      this.muted ||
      !this.context ||
      this.context.state !== 'running' ||
      !this.masterGain
    )
      return;
    playHeartSound(this.context, this.masterGain, sound);
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.context?.close();
    this.context = null;
    this.masterGain = null;
  }
}
