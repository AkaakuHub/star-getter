import { routes, type RouteId } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { GameController } from '../../src/app/gameController';
import { ScenarioClock, ScenarioFrames } from './playback';
import { cardAt, canUseCard } from '../../src/domain/game/projection';
import { canUseSpecial } from '../../src/domain/game/special';
import { createGame } from '../../src/domain/game/simulation';
import { type GameState, type Card, rules } from '../../src/domain/game/model';

export class GameDriver {
  private readonly controller: GameController;
  private readonly clock = new ScenarioClock();
  private readonly frames = new ScenarioFrames();
  collections = 0;
  successfulCollections = 0;
  cardActions = 0;
  specialActions = 0;
  peakGauge = 0n;
  peakDeckSize = 0;
  peakHeartLimit = 0;

  constructor(
    readonly route: RouteId,
    seed = 7,
  ) {
    const track = tracks[0];
    if (!track) throw new Error('曲がありません。');
    const preset = routes[route];
    this.controller = new GameController(
      createGame(track, preset.deck, seed, 100, preset.tokens),
      this.clock,
      this.frames,
    );
    this.controller.toggleAutomaticHearts();
    this.observe();
  }

  get state(): GameState {
    return this.controller.state;
  }

  get seconds(): number {
    return this.state.tick / rules.ticksPerSecond;
  }

  tick(): void {
    this.clock.seconds = (this.state.tick + 1) / rules.ticksPerSecond;
    this.frames.run(this.clock.seconds * 1000);
    this.observe();
  }

  collect(): void {
    const before = this.state.stats.heartsCollected;
    this.controller.command({ type: 'collect' });
    this.collections++;
    if (this.state.stats.heartsCollected > before) this.successfulCollections++;
    this.observe();
  }

  special(id: string): boolean {
    if (!canUseSpecial(this.state, id)) return false;
    this.controller.command({ type: 'special', cardId: id });
    this.specialActions++;
    this.observe();
    return true;
  }

  useFirst(priority: readonly string[]): Card | undefined {
    const available = this.state.hand
      .map((_, index) => index)
      .filter((index) => canUseCard(this.state, index));
    for (const key of priority) {
      const index = available.find((candidate) => {
        const card = cardAt(this.state, candidate);
        return (card.token ?? card.id) === key;
      });
      if (index === undefined) continue;
      const card = cardAt(this.state, index);
      this.controller.command({ type: 'card', index });
      this.cardActions++;

      this.observe();
      return card;
    }
    return undefined;
  }

  until(condition: (state: GameState) => boolean, operation: () => void): void {
    while (!condition(this.state)) {
      if (this.state.phase !== 'playing') {
        this.report('準備未達');
        throw new Error('曲の終了までに準備が完了しませんでした。');
      }
      operation();
      if (condition(this.state)) return;
      this.tick();
    }
  }

  burst(seconds: number, tapsPerSecond: number): void {
    const target = this.state.tick + Math.round(seconds * rules.ticksPerSecond);
    const interval = Math.round(rules.ticksPerSecond / tapsPerSecond);
    const start = this.state.tick;
    while (this.state.tick < target && this.state.phase === 'playing') {
      if ((this.state.tick - start) % interval === 0) this.collect();
      this.tick();
    }
  }

  finishWithCards(priority: readonly string[], measurementTick: number): bigint {
    let before = 0n;
    let after = 0n;
    while (this.state.phase === 'playing') {
      if (this.state.tick === measurementTick) before = this.state.score;
      if (this.state.tick === measurementTick + 2 * rules.ticksPerSecond) after = this.state.score;
      this.useFirst(priority);
      if (this.state.tick % 6 === 0) this.collect();
      this.tick();
    }
    return after - before;
  }

  report(stage: string): void {
    console.log(
      JSON.stringify({
        route: this.route,
        stage,
        seconds: Number(this.seconds.toFixed(3)),
        cardActions: this.cardActions,
        cardsUsed: this.state.stats.cardsUsed,
        specialActions: this.specialActions,
        collectionActions: this.collections,
        successfulCollections: this.successfulCollections,
        heartsCollected: this.state.stats.heartsCollected,
        deck: this.state.deck.length,
        energy: this.state.energy,
        mental: this.state.stamina,
        ordinaryVoltage: this.state.excitement,
        classUses: this.state.cardUseCounts.class ?? 0,
        shadowUses: this.state.cardUseCounts['shadow-1'] ?? 0,
        score: this.state.score.toString(),
        gauge: this.state.bloom?.progress.toString() ?? null,
        peakGauge: this.peakGauge.toString(),
        peakDeckSize: this.peakDeckSize,
        peakHeartLimit: this.peakHeartLimit,
      }),
    );
  }

  private observe(): void {
    this.peakDeckSize = Math.max(this.peakDeckSize, this.state.deck.length);
    this.peakHeartLimit = Math.max(this.peakHeartLimit, this.state.hearts.heartLimit);
    const gauge = this.state.bloom?.progress ?? 0n;
    if (gauge > this.peakGauge) this.peakGauge = gauge;
  }
}
