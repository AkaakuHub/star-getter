import { act } from '../domain/game/actions';
import type { Action, GameState } from '../domain/game/model';
import { advanceTo } from '../domain/game/simulation';
import type { FrameScheduler, PlaybackClock } from './playbackPorts';

export class GameController {
  error = '';
  private currentState: GameState;
  private readonly audio: PlaybackClock;
  private readonly frames: FrameScheduler;
  private readonly listeners = new Set<() => void>();
  private frame = 0;
  private lastNotification = 0;
  private disposed = false;
  private busy = false;
  private closing: Promise<void> | null = null;

  constructor(state: GameState, audio: PlaybackClock, frames: FrameScheduler) {
    if (state.phase !== 'ready') throw new Error('開始前のライブを指定してください。');
    this.currentState = act(state, { type: 'start' });
    this.audio = audio;
    this.frames = frames;
    this.requestFrame();
  }

  get state(): GameState {
    return this.currentState;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  command(
    action: Extract<Action, { type: 'card' }> | Readonly<{ type: 'collect' | 'special' }>,
  ): void {
    if (this.disposed || this.busy || this.currentState.phase !== 'playing') return;
    this.advance();
    this.currentState = act(this.currentState, action);
    this.notify();
  }

  async togglePause(): Promise<void> {
    if (this.busy || this.disposed || this.currentState.phase === 'finished') return;
    this.busy = true;
    try {
      if (this.currentState.phase === 'playing') {
        await this.audio.pause();
        if (this.disposed) return;
        this.advance();
        this.currentState = act(this.currentState, { type: 'pause' });
        this.stopFrames();
      } else if (this.currentState.phase === 'paused') {
        await this.audio.resume();
        if (this.disposed) return;
        this.currentState = act(this.currentState, { type: 'resume' });
        this.requestFrame();
      }
      this.error = '';
    } catch (error) {
      this.fail(error);
    } finally {
      this.busy = false;
      this.notify();
    }
  }

  setMuted(muted: boolean): void {
    if (!this.disposed) this.audio.setMuted(muted);
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.stopFrames();
    this.listeners.clear();
    await this.closeAudio();
  }

  private readonly update = (timestamp: number): void => {
    this.frame = 0;
    if (this.disposed || this.currentState.phase !== 'playing') return;
    const advanced = this.advance();
    if (advanced.phase === 'finished') {
      this.notify();
      return;
    }
    if (this.audio.interrupted && !this.busy) {
      this.currentState = act(this.currentState, { type: 'pause' });
      this.notify();
      return;
    }
    if (timestamp - this.lastNotification >= 100) {
      this.lastNotification = timestamp;
      this.notify();
    }
    this.requestFrame();
  };

  private advance(): GameState {
    this.currentState = advanceTo(this.currentState, this.audio.seconds);
    if (this.currentState.phase === 'finished') {
      this.stopFrames();
      void this.closeAudio().catch((error: unknown) => this.fail(error));
    }
    return this.currentState;
  }

  private closeAudio(): Promise<void> {
    if (!this.closing) this.closing = this.audio.close();
    return this.closing;
  }

  private requestFrame(): void {
    if (!this.disposed && !this.frame) this.frame = this.frames.request(this.update);
  }

  private stopFrames(): void {
    this.frames.cancel(this.frame);
    this.frame = 0;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private fail(error: unknown): void {
    this.error = error instanceof Error ? error.message : '音声の再生に失敗しました。';
    this.notify();
  }
}
