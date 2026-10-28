import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import {
  type Action,
  type Card,
  type GameState,
  rules,
} from '@akaakuhub/suku-sute-core/game/model';
import {
  canUseCard,
  cardAt,
  cardCooldownTicks,
  sectionAt,
} from '@akaakuhub/suku-sute-core/game/projection';
import { resolveLiveHeartDrawCount } from '@akaakuhub/suku-sute-core/runtime/live/heartPresentation';
import {
  advanceWaitMode,
  createWaitMode,
  releaseWaitMode,
  notifyWaitModeSkillUse,
  type WaitModeState,
} from '@akaakuhub/suku-sute-core/game/live/waitMode';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import type { FrameScheduler, PlaybackClock } from './playbackPorts';
import type { GameAudio } from './gameAudio';

export class GameController {
  error = '';
  private currentState: GameState;
  private readonly clock: PlaybackClock;
  private readonly frames: FrameScheduler;
  private readonly audio: GameAudio;
  private readonly listeners = new Set<() => void>();
  private frame = 0;
  private lastNotification = 0;
  private disposed = false;
  private busy = false;
  private closing: Promise<void> | null = null;
  private selection: string | null = null;
  private waitPause: Promise<void> | null = null;
  private waitEnabled = false;
  private waitState: WaitModeState = createWaitMode();

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
      this.waitState = createWaitMode();
      if (wasWaiting) await this.resumeFromWait();
    } else {
      this.waitState = { ...this.waitState, kind: 'force-reserved', remainingCoolTimeSeconds: 0 };
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
      availableCards: this.currentState.hand.reduce(
        (mask, _, index) => (canUseCard(this.currentState, index) ? mask | (1 << index) : mask),
        0,
      ),
      skillPoint: Math.trunc(this.currentState.currentAp),
      ableUseSkill:
        this.currentState.tick - this.currentState.lastActionTick >=
        cardCooldownTicks(this.currentState),
      mentalDown: this.currentState.mental.mentalDown,
      allSkillsCostOver: this.currentState.hand.every(
        (_, index) =>
          this.currentState.genesis.effects.length === 0 &&
          cardCost(this.currentState, cardAt(this.currentState, index)) >
            this.currentState.currentAp,
      ),
      deltaTimeSeconds,
    });
    if (!this.waiting) return;
    this.stopFrames();
    this.waitPause = this.clock.pause().catch((error: unknown) => this.fail(error));
    this.notify();
  }

  private async resumeFromWait(): Promise<void> {
    if (this.currentState.phase !== 'playing') return;
    this.busy = true;
    try {
      await this.waitPause;
      if (this.disposed || this.currentState.phase !== 'playing') return;
      await this.clock.resume();
      if (!this.disposed) this.requestFrame();
    } catch (error) {
      this.fail(error);
    } finally {
      this.busy = false;
      this.notify();
    }
  }

  constructor(
    state: GameState,
    clock: PlaybackClock,
    frames: FrameScheduler,
    audio: GameAudio,
    waitModeEnabled: boolean,
  ) {
    if (state.phase !== 'ready') throw new Error('開始前のライブを指定してください。');
    this.currentState = act(state, { type: 'start' });
    this.clock = clock;
    this.frames = frames;
    this.audio = audio;
    this.waitEnabled = waitModeEnabled;
    if (waitModeEnabled) this.waitState = { ...this.waitState, kind: 'force-reserved' };
    this.requestFrame();
  }

  get state(): GameState {
    return this.currentState;
  }

  unlockAudio(): void {
    if (this.disposed) return;
    void this.audio.unlock().catch((error: unknown) => this.fail(error));
  }

  setMuted(muted: boolean): void {
    if (this.disposed) return;
    this.audio.setMuted(muted);
    if (!muted) this.unlockAudio();
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

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  command(
    action: Extract<Action, { type: 'card' | 'special' }> | Readonly<{ type: 'collect' }>,
  ): void {
    if (this.disposed || this.busy || this.currentState.phase !== 'playing') return;
    this.advance();
    const previousUses = this.currentState.stats.cardsUsed;
    const previousSpecials = this.currentState.stats.specialsUsed;
    this.applyState(act(this.currentState, action));
    const normalSkill = this.currentState.stats.cardsUsed > previousUses;
    if (normalSkill || this.currentState.stats.specialsUsed > previousSpecials) {
      const wasWaiting = this.waiting;
      this.waitState = notifyWaitModeSkillUse(this.waitState, normalSkill);
      if (wasWaiting) void this.resumeFromWait();
    }
    if (this.selection !== null && !this.currentState.hand.includes(this.selection))
      this.selection = null;
    this.notify();
  }

  collectFromInput(): 'collect' | 'wait-cancel' {
    if (this.waiting) {
      this.cancelWait();
      return 'wait-cancel';
    }
    this.command({ type: 'collect' });
    return 'collect';
  }

  cancelWait(): void {
    if (this.disposed || this.busy || !this.waiting || this.currentState.phase !== 'playing')
      return;
    this.waitState = releaseWaitMode(this.waitState, false);
    void this.resumeFromWait();
  }

  async togglePause(): Promise<void> {
    if (this.busy || this.disposed || this.currentState.phase === 'finished') return;
    this.busy = true;
    try {
      await this.waitPause;
      if (this.disposed) return;
      if (this.currentState.phase === 'playing') {
        if (!this.waiting) await this.clock.pause();
        if (this.disposed) return;
        this.advance();
        this.currentState = act(this.currentState, { type: 'pause' });
        this.stopFrames();
      } else if (this.currentState.phase === 'paused') {
        if (!this.waiting) await this.clock.resume();
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
    resolveLiveHeartDrawCount(0, value);
    this.currentState = {
      ...this.currentState,
      hearts: { ...this.currentState.hearts, showLimit: value, throwLimit: value },
    };
    this.notify();
  }

  toggleAutomaticHearts(): void {
    if (this.disposed || this.currentState.phase === 'finished') return;
    this.currentState = {
      ...this.currentState,
      automaticHeart: { enabled: !this.currentState.automaticHeart.enabled, timerSeconds: 0 },
    };
    this.notify();
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.stopFrames();
    this.listeners.clear();
    await this.closeSession();
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
    if (timestamp - this.lastNotification >= 100) {
      this.lastNotification = timestamp;
      this.notify();
    }
    this.requestFrame();
  };

  private advance(): GameState {
    if (this.waiting) return this.currentState;
    const previousTick = this.currentState.tick;
    this.applyState(advanceTo(this.currentState, this.clock.seconds));
    if (!this.busy)
      this.synchronizeWaitMode((this.currentState.tick - previousTick) / rules.ticksPerSecond);
    if (this.currentState.phase === 'finished') {
      this.selection = null;
      this.stopFrames();
      void this.closeSession().catch((error: unknown) => this.fail(error));
    }
    return this.currentState;
  }

  private applyState(next: GameState): void {
    const previous = this.currentState.hearts;
    if (
      !this.waiting &&
      this.waitEnabled &&
      (next.hand.length !== this.currentState.hand.length ||
        next.hand.some((id, index) => id !== this.currentState.hand[index]) ||
        sectionAt(next) !== sectionAt(this.currentState))
    )
      this.waitState = { ...this.waitState, kind: 'force-reserved' };
    this.currentState = next;
    try {
      for (let index = previous.generationCount; index < next.hearts.generationCount; index++)
        this.audio.play('heart-spawn');
      for (
        let index = previous.collectionSoundCount;
        index < next.hearts.collectionSoundCount;
        index++
      )
        this.audio.play('heart-collect');
    } catch (error) {
      this.fail(error);
    }
  }

  private closeSession(): Promise<void> {
    if (!this.closing)
      this.closing = Promise.all([this.clock.close(), this.audio.close()]).then(() => undefined);
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
    this.error = error instanceof Error ? error.message : 'ゲームを進行できませんでした。';
    this.notify();
  }
}
