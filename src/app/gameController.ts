import { act } from '../domain/game/actions';
import { type Action, type Card, type GameState, rules } from '../domain/game/model';
import { canUseCard, cardAt } from '../domain/game/projection';
import { resolveLoveGatherHeartDrawCount } from '../domain/game/live/heartPresentation';
import { advanceWaitMode, releaseWaitMode, type WaitModeState } from '../domain/game/live/waitMode';
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
  private selection: string | null = null;
  private waitPause: Promise<void> | null = null;
  private waitEnabled = false;
  private waitState: WaitModeState = { kind: 'disabled', remainingCoolTimeSeconds: 0 };

  get waitModeEnabled(): boolean {
    return this.waitEnabled;
  }

  get waiting(): boolean {
    return this.waitState.kind === 'waiting';
  }

  get running(): boolean {
    return this.currentState.phase === 'playing' && !this.waiting;
  }

  async toggleWaitMode(): Promise<void> {
    if (this.disposed || this.busy || this.currentState.phase === 'finished') return;
    this.waitEnabled = !this.waitEnabled;
    if (!this.waitEnabled) {
      const wasWaiting = this.waiting;
      this.waitState = { kind: 'disabled', remainingCoolTimeSeconds: 0 };
      if (wasWaiting) await this.resumeFromWait();
    } else {
      this.waitState = { kind: 'force-reserved', remainingCoolTimeSeconds: 0 };
      this.synchronizeWaitMode(0);
      await this.waitPause;
    }
    if (this.currentState.phase === 'paused') await this.togglePause();
    this.notify();
  }

  private synchronizeWaitMode(deltaTimeSeconds: number): void {
    if (this.currentState.phase !== 'playing' || this.waiting) return;
    this.waitState = advanceWaitMode(this.waitState, {
      enabled: this.waitEnabled,
      hasAvailableSkill: this.currentState.hand.some((_, index) =>
        canUseCard(this.currentState, index),
      ),
      deltaTimeSeconds,
    });
    if (!this.waiting) return;
    this.stopFrames();
    this.waitPause = this.audio.pause().catch((error: unknown) => this.fail(error));
    this.notify();
  }

  private async resumeFromWait(): Promise<void> {
    if (this.currentState.phase !== 'playing') return;
    this.busy = true;
    try {
      await this.waitPause;
      if (this.disposed || this.currentState.phase !== 'playing') return;
      await this.audio.resume();
      if (!this.disposed) this.requestFrame();
    } catch (error) {
      this.fail(error);
    } finally {
      this.busy = false;
      this.notify();
    }
  }

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

  get selectedCard(): Card | null {
    return this.currentState.deck.find((card) => card.id === this.selection) ?? null;
  }

  tapCard(index: number): void {
    if (
      this.disposed ||
      this.busy ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.currentState.hand.length
    )
      return;
    if (this.currentState.phase !== 'playing' && this.currentState.phase !== 'paused') return;
    if (this.currentState.phase === 'playing' && this.advance().phase === 'finished') return;
    const card = cardAt(this.currentState, index);
    if (this.selection === card.id && canUseCard(this.currentState, index)) {
      this.selection = null;
      this.command({ type: 'card', index });
    } else {
      this.selection = card.id;
      this.notify();
    }
  }

  activateSelected(): void {
    if (this.selection === null) return;
    const index = this.currentState.hand.indexOf(this.selection);
    if (index >= 0) this.tapCard(index);
  }

  clearSelection(): void {
    this.selection = null;
    this.notify();
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
    const previousUses = this.currentState.stats.cardsUsed;
    this.currentState = act(this.currentState, action);
    if (this.waiting && this.currentState.stats.cardsUsed > previousUses) {
      this.waitState = releaseWaitMode();
      void this.resumeFromWait();
    }
    if (this.selection !== null && !this.currentState.hand.includes(this.selection))
      this.selection = null;
    this.notify();
  }

  async togglePause(): Promise<void> {
    if (this.busy || this.disposed || this.currentState.phase === 'finished') return;
    this.busy = true;
    try {
      await this.waitPause;
      if (this.disposed) return;
      if (this.currentState.phase === 'playing') {
        if (!this.waiting) await this.audio.pause();
        if (this.disposed) return;
        this.advance();
        this.currentState = act(this.currentState, { type: 'pause' });
        this.stopFrames();
      } else if (this.currentState.phase === 'paused') {
        if (!this.waiting) await this.audio.resume();
        if (this.disposed) return;
        this.currentState = act(this.currentState, { type: 'resume' });
        if (!this.waiting) this.requestFrame();
      }
      this.error = '';
    } catch (error) {
      this.fail(error);
    } finally {
      this.busy = false;
      this.notify();
    }
  }

  setHeartShowLimit(value: number): void {
    resolveLoveGatherHeartDrawCount(0, value);
    this.currentState = {
      ...this.currentState,
      hearts: { ...this.currentState.hearts, showLimit: value, throwLimit: value },
    };
    this.notify();
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
    if (this.waiting) return;
    if (this.audio.interrupted && !this.busy) {
      this.currentState = act(this.currentState, { type: 'pause' });
      void this.audio.pause().catch((failure: unknown) => this.fail(failure));
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
    if (this.waiting) return this.currentState;
    const previousTick = this.currentState.tick;
    this.currentState = advanceTo(this.currentState, this.audio.seconds);
    if (!this.busy)
      this.synchronizeWaitMode((this.currentState.tick - previousTick) / rules.ticksPerSecond);
    if (this.currentState.phase === 'finished') {
      this.selection = null;
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
    if (!this.disposed && !this.waiting && !this.frame)
      this.frame = this.frames.request(this.update);
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
