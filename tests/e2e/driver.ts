import type { GameSetup } from '../../src/app/setup/gameSetup';
import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { createConfiguredGame } from '../../src/app/createConfiguredGame';
import { GameController } from '../../src/app/gameController';
import { ScenarioAudio, ScenarioClock, ScenarioFrames } from './playback';
import { cardAt, canUseCard, moodValue } from '@akaakuhub/suku-sute-core/game/projection';
import { canUseSpecial } from '@akaakuhub/suku-sute-core/game/special';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { type GameState, type Card, rules } from '@akaakuhub/suku-sute-core/game/model';
import { GameRecording, type InputRecord } from './recording/gameRecording';
import { inputTiming, type InputTiming, type TimeRange } from './input/timing';
import { createRangeRandom } from '@akaakuhub/suku-sute-core/game/random';

export class GameDriver {
  private readonly controller: GameController;
  private readonly clock = new ScenarioClock();
  private readonly frames = new ScenarioFrames();
  private readonly recording: GameRecording;
  private readonly timingRandom;
  private elapsedTicks = 0;
  private nextPointerTick = 0;
  collections = 0;
  automaticCollections = 0;
  successfulCollections = 0;
  collectionRedraws = 0;
  collectionAmplification = 0;
  cardActions = 0;
  specialActions = 0;
  peakGauge = 0;
  peakDeckSize = 0;
  peakHeartLimit = 0;

  private constructor(
    readonly setup: GameSetup,
    readonly seed = 7,
    readonly timing: InputTiming = inputTiming,
  ) {
    this.controller = new GameController(
      createConfiguredGame(setup, seed, 100),
      this.clock,
      this.frames,
      new ScenarioAudio(),
      false,
    );
    this.timingRandom = createRangeRandom((seed ^ 0x5bd1e995) >>> 0);
    this.recording = new GameRecording(setup, seed, this.state, timing);
  }

  static async create(setup: GameSetup, seed = 7): Promise<GameDriver> {
    const driver = new GameDriver(setup, seed);
    await driver.toggleAutomaticHearts();
    return driver;
  }

  get route() {
    return this.setup.presetId;
  }

  get state(): GameState {
    return this.controller.state;
  }

  get seconds(): number {
    return this.state.tick / rules.ticksPerSecond;
  }

  get inputs(): readonly InputRecord[] {
    return this.recording.inputs;
  }

  get inputTick(): number {
    return this.elapsedTicks;
  }

  get wallSeconds(): number {
    return this.elapsedTicks / rules.ticksPerSecond;
  }

  private secondsIn(range: TimeRange): number {
    return this.timingRandom.range(range.minimum, range.maximum);
  }

  private async think(range: TimeRange): Promise<void> {
    const end = this.elapsedTicks + Math.ceil(this.secondsIn(range) * rules.ticksPerSecond);
    while (this.elapsedTicks < end && this.state.phase !== 'finished') await this.tick();
  }

  private pointer(): void {
    this.nextPointerTick =
      this.elapsedTicks +
      Math.ceil(this.secondsIn(this.timing.pointerIntervalSeconds) * rules.ticksPerSecond);
  }

  async setWaitMode(enabled: boolean): Promise<void> {
    if (this.controller.waitModeEnabled === enabled || this.state.phase === 'finished') return;
    await this.think(this.timing.decisionSeconds);
    const before = this.state;
    await this.controller.toggleWaitMode();
    this.pointer();
    this.recording.record({ kind: 'wait-mode', enabled }, before, this.state, this.elapsedTicks);
    this.observe();
  }

  async toggleAutomaticHearts(): Promise<void> {
    await this.think(this.timing.decisionSeconds);
    const before = this.state;
    this.controller.toggleAutomaticHearts();
    this.recording.record(
      { kind: 'automatic-hearts', enabled: this.state.automaticHeart.enabled },
      before,
      this.state,
      this.elapsedTicks,
    );
    this.pointer();
    this.observe();
  }

  async tick(): Promise<void> {
    await Promise.resolve();
    this.elapsedTicks++;
    if (this.elapsedTicks > 300 * rules.ticksPerSecond)
      throw new Error('操作開始から300秒以内に手順が完了しませんでした。');
    const before = this.state.stats.heartsCollected;
    const hand = this.state.hand.join(',');
    const amplification = this.state.storyAmplification;
    if (!this.clock.paused) {
      this.clock.seconds = (this.state.tick + 1) / rules.ticksPerSecond;
      this.frames.run(this.wallSeconds * 1000);
    }
    if (this.state.automaticHeart.enabled && this.state.stats.heartsCollected > before) {
      this.automaticCollections++;
      if (this.state.hand.join(',') !== hand) this.collectionRedraws++;
      this.collectionAmplification += this.state.storyAmplification - amplification;
    }
    this.observe();
  }

  collect(): void {
    if (this.elapsedTicks < this.nextPointerTick || this.state.phase !== 'playing') return;
    const previous = this.state;
    const before = this.state.stats.heartsCollected;
    const hand = this.state.hand.join(',');
    const amplification = this.state.storyAmplification;
    const kind = this.controller.collectFromInput();
    this.recording.record({ kind }, previous, this.state, this.elapsedTicks);
    this.pointer();
    if (kind === 'collect') this.collections++;
    if (this.state.stats.heartsCollected > before) this.successfulCollections++;
    if (this.state.hand.join(',') !== hand) this.collectionRedraws++;
    this.collectionAmplification += this.state.storyAmplification - amplification;
    this.observe();
  }

  async special(id: string): Promise<boolean> {
    if (!canUseSpecial(this.state, id)) return false;
    await this.think(this.timing.decisionSeconds);
    if (!canUseSpecial(this.state, id) || this.state.phase !== 'playing') return false;
    const card = this.state.deck.find((candidate) => candidate.id === id);
    if (!card) throw new Error('共鳴のカードがありません。');
    const reference = { instanceId: id, name: card.name, handIndex: null };
    const opened = this.state;
    await this.controller.togglePause();
    this.recording.record(
      { kind: 'special-menu', card: reference },
      opened,
      this.state,
      this.elapsedTicks,
    );
    this.pointer();
    await this.think(this.timing.specialMenuSeconds);
    await this.think(this.timing.confirmationSeconds);
    await this.controller.togglePause();
    if (!canUseSpecial(this.state, id) || this.state.phase !== 'playing') return false;
    const before = this.state;
    this.controller.command({ type: 'special', cardId: id });
    const handIndex = before.hand.indexOf(id);
    this.recording.record(
      {
        kind: 'special',
        card: { instanceId: id, name: card.name, handIndex: handIndex < 0 ? null : handIndex },
      },
      before,
      this.state,
      this.elapsedTicks,
    );
    this.pointer();
    this.specialActions++;
    this.observe();
    return true;
  }

  async useFirst(priority: readonly string[]): Promise<Card | undefined> {
    const available = this.state.hand
      .map((_, index) => index)
      .filter(
        (index) =>
          this.state.phase === 'playing' &&
          !this.state.mental.mentalDown &&
          (this.state.genesis.effects.length > 0 ||
            this.state.ap.currentAp >= cardCost(this.state, cardAt(this.state, index))),
      );
    for (const key of priority) {
      const index = available.find((candidate) => {
        const card = cardAt(this.state, candidate);
        return (card.token ?? card.id) === key;
      });
      if (index === undefined) continue;
      const card = cardAt(this.state, index);
      const reference = { instanceId: card.id, name: card.name, handIndex: index };
      this.recording.record(
        { kind: 'card-inspect', card: reference },
        this.state,
        this.state,
        this.elapsedTicks,
      );
      await this.think(this.timing.decisionSeconds);
      const selectedIndex = this.state.hand.indexOf(card.id);
      if (!canUseCard(this.state, selectedIndex)) {
        this.recording.record(
          { kind: 'card-cancel', card: reference },
          this.state,
          this.state,
          this.elapsedTicks,
        );
        return undefined;
      }
      const selected = this.state;
      if (this.controller.selectedCard?.id !== card.id) {
        this.controller.tapCard(selectedIndex);
        this.recording.record(
          { kind: 'card-select', card: { ...reference, handIndex: selectedIndex } },
          selected,
          this.state,
          this.elapsedTicks,
        );
        this.pointer();
      }
      await this.think(this.timing.confirmationSeconds);
      if (
        this.controller.selectedCard?.id !== card.id ||
        !canUseCard(this.state, this.state.hand.indexOf(card.id))
      ) {
        this.recording.record(
          { kind: 'card-cancel', card: reference },
          this.state,
          this.state,
          this.elapsedTicks,
        );
        return undefined;
      }
      const before = this.state;
      this.controller.activateSelected();
      this.recording.record(
        {
          kind: 'card',
          card: { instanceId: card.id, name: card.name, handIndex: before.hand.indexOf(card.id) },
        },
        before,
        this.state,
        this.elapsedTicks,
      );
      this.pointer();
      this.cardActions++;

      this.observe();
      return card;
    }
    return undefined;
  }

  async until(
    condition: (state: GameState) => boolean,
    operation: () => Promise<void>,
  ): Promise<void> {
    while (!condition(this.state)) {
      if (this.state.phase !== 'playing') {
        this.report('準備未達');
        throw new Error('曲の終了までに準備が完了しませんでした。');
      }
      await operation();
      if (condition(this.state)) return;
      await this.tick();
    }
  }

  async burst(seconds: number, tapsPerSecond: number): Promise<void> {
    await this.setWaitMode(false);
    if (this.state.automaticHeart.enabled) await this.toggleAutomaticHearts();
    const target = this.state.tick + Math.round(seconds * rules.ticksPerSecond);
    let next = this.state.tick;
    while (this.state.tick < target && this.state.phase === 'playing') {
      if (this.state.tick >= next) {
        this.collect();
        next =
          this.state.tick +
          Math.max(
            1,
            Math.round(
              (rules.ticksPerSecond / tapsPerSecond) *
                this.secondsIn(this.timing.collectionIntervalFactor),
            ),
          );
      }
      await this.tick();
    }
  }

  async finishWithCards(priority: readonly string[]): Promise<void> {
    while (this.state.phase === 'playing') {
      await this.useFirst(priority);
      if (this.state.tick % 6 === 0) this.collect();
      await this.tick();
    }
  }

  report(stage: string): void {
    console.log(
      JSON.stringify({
        route: this.route,
        stage,
        seconds: Number(this.seconds.toFixed(3)),
        wallSeconds: Number(this.wallSeconds.toFixed(3)),
        inputTiming: this.timing,
        cardActions: this.cardActions,
        cardsUsed: this.state.stats.cardsUsed,
        specialActions: this.specialActions,
        collectionActions: this.collections,
        automaticCollections: this.automaticCollections,
        successfulCollections: this.successfulCollections,
        collectionRedraws: this.collectionRedraws,
        collectionAmplification: this.collectionAmplification,
        heartsCollected: this.state.stats.heartsCollected,
        hearts: heartCount(this.state),
        heartLimit: this.state.hearts.heartLimit,
        storyAmplification: this.state.storyAmplification,
        tokens: Object.fromEntries(
          ['story', 'clock', 'bookmark', 'ensemble', 'shadow'].map((token) => [
            token,
            this.state.deck.filter((card) => card.token === token).length,
          ]),
        ),
        deck: this.state.deck.length,
        currentAp: this.state.ap.currentAp,
        mental: this.state.mental.currentMental,
        currentVoltage: this.state.voltage.currentVoltage.toString(),
        mood: moodValue(this.state),
        scoreMultiplier: this.state.scoreMultiplier.toString(),
        classUses: this.state.cardUseCounts.class ?? 0,
        shadowUses: this.state.cardUseCounts['shadow-1'] ?? 0,
        score: this.state.score.toString(),
        gauge:
          this.state.genesis.effects.length > 0 ? this.state.genesis.currentGauge.toString() : null,
        genesisStrength: this.state.genesis.effects[0]?.effectValue ?? null,
        peakGauge: this.peakGauge.toString(),
        peakDeckSize: this.peakDeckSize,
        peakHeartLimit: this.peakHeartLimit,
      }),
    );
  }

  private observe(): void {
    this.recording.observe(this.state, this.elapsedTicks);
    this.peakDeckSize = Math.max(this.peakDeckSize, this.state.deck.length);
    this.peakHeartLimit = Math.max(this.peakHeartLimit, this.state.hearts.heartLimit);
    const gauge = this.state.genesis.currentGauge;
    if (gauge > this.peakGauge) this.peakGauge = gauge;
  }
}
