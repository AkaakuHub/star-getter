import { act } from '../domain/game/actions';
import type { Action, Card, GameState, Track } from '../domain/game/model';
import { advanceTo, createGame } from '../domain/game/simulation';
import { AudioSession } from '../infrastructure/audio/audioSession';

export class GameController {
  state: GameState;
  error = '';
  private readonly audio: AudioSession;
  private readonly listeners = new Set<() => void>();
  private frame = 0;
  private lastNotification = 0;
  private disposed = false;
  private busy = false;

  private constructor(state: GameState, audio: AudioSession) {
    this.state = act(state, { type: 'start' });
    this.audio = audio;
    this.frame = requestAnimationFrame(this.update);
  }

  static async create(
    track: Track,
    deck: readonly Card[],
    muted: boolean,
  ): Promise<GameController> {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const value = random[0];
    if (value === undefined) throw new Error('ゲームの乱数を生成できません。');
    const seed = (value | 1) >>> 0;
    const state = createGame(track, deck, seed);
    const audio = await AudioSession.create(track, muted);
    return new GameController(state, audio);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  command(
    action: Extract<Action, { type: 'card' }> | Readonly<{ type: 'collect' | 'special' }>,
  ): void {
    if (this.disposed || this.busy) return;
    this.state = act(advanceTo(this.state, this.audio.seconds), action);
    if (this.state.phase === 'finished')
      void this.audio.close().catch((error: unknown) => this.fail(error));
    this.notify();
  }

  async togglePause(): Promise<void> {
    if (this.busy || this.disposed || this.state.phase === 'finished') return;
    this.busy = true;
    try {
      if (this.state.phase === 'playing') {
        await this.audio.pause();
        this.state = act(advanceTo(this.state, this.audio.seconds), { type: 'pause' });
        cancelAnimationFrame(this.frame);
      } else if (this.state.phase === 'paused') {
        await this.audio.resume();
        if (this.disposed) return;
        this.state = act(this.state, { type: 'resume' });
        this.frame = requestAnimationFrame(this.update);
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
    this.audio.setMuted(muted);
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.listeners.clear();
    await this.audio.close();
  }

  private readonly update = (timestamp: number): void => {
    if (this.disposed || this.state.phase !== 'playing') return;
    if (this.audio.interrupted && !this.busy) {
      this.state = act(this.state, { type: 'pause' });
      this.notify();
      return;
    }
    this.state = advanceTo(this.state, this.audio.seconds);
    if (this.state.phase === 'finished') {
      void this.audio.close().catch((error: unknown) => this.fail(error));
      this.notify();
      return;
    }
    if (timestamp - this.lastNotification >= 100) {
      this.lastNotification = timestamp;
      this.notify();
    }
    this.frame = requestAnimationFrame(this.update);
  };

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private fail(error: unknown): void {
    this.error = error instanceof Error ? error.message : '音声の再生に失敗しました。';
    this.notify();
  }
}
