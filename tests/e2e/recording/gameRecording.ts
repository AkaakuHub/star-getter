import { afterEach } from 'vite-plus/test';
import type { RouteId } from '../../../src/content/routes';
import { type GameState, rules } from '../../../src/domain/game/model';
import { heartCount } from '../../../src/domain/game/hearts';
import { cardCooldownTicks, moodValue } from '../../../src/domain/game/projection';
import { writeRecordings } from './writeRecordings';
import type { InputTiming } from '../input/timing';
import { assertInputTiming } from '../input/assertTiming';

type CardReference = Readonly<{ instanceId: string; name: string; handIndex: number | null }>;
export type RecordedInput =
  | Readonly<{
      kind: 'card-inspect' | 'card-select' | 'card' | 'special-menu' | 'special';
      card: CardReference;
    }>
  | Readonly<{ kind: 'card-cancel'; card: CardReference }>
  | Readonly<{ kind: 'collect' }>
  | Readonly<{ kind: 'automatic-hearts'; enabled: boolean }>
  | Readonly<{ kind: 'wait-mode'; enabled: boolean }>;
type Snapshot = Readonly<{
  score: string;
  gauge: string | null;
  deckSize: number;
  energy: number;
  hearts: number;
  heartLimit: number;
  storyAmplification: number;
  mood: number;
  phase: GameState['phase'];
  lastActionTick: number;
  skillCooldownTicks: number;
  hand: readonly Readonly<{
    instanceId: string;
    name: string;
    collectedCount: number;
    collectionUsed: boolean;
  }>[];
}>;
export type InputRecord = Readonly<{
  sequence: number;
  route: RouteId;
  seed: number;
  tick: number;
  seconds: number;
  wallSeconds: number;
  input: RecordedInput;
  before: Snapshot;
  after: Snapshot;
}>;

function snapshot(state: GameState): Snapshot {
  return {
    score: state.score.toString(),
    gauge: state.bloom?.progress.toString() ?? null,
    deckSize: state.deck.length,
    energy: state.energy,
    hearts: heartCount(state),
    heartLimit: state.hearts.heartLimit,
    storyAmplification: state.storyAmplification,
    mood: moodValue(state),
    phase: state.phase,
    lastActionTick: state.lastActionTick,
    skillCooldownTicks: cardCooldownTicks(state),
    hand: state.hand.map((id) => {
      const card = state.deck.find((candidate) => candidate.id === id);
      if (!card) throw new Error('記録対象の手札がありません。');
      return {
        instanceId: id,
        name: card.name,
        collectedCount: state.handHeartCollectCounts[id] ?? 0,
        collectionUsed: state.relayUsed.includes(id),
      };
    }),
  };
}

export class GameRecording {
  readonly inputs: InputRecord[] = [];
  private wallTick = 0;

  constructor(
    readonly route: RouteId,
    readonly seed: number,
    private state: GameState,
    readonly timing: InputTiming,
  ) {
    recordings.push(this);
  }

  get finalState() {
    return {
      ...snapshot(this.state),
      phase: this.state.phase,
      tick: this.state.tick,
      seconds: this.state.tick / rules.ticksPerSecond,
      wallSeconds: this.wallTick / rules.ticksPerSecond,
    };
  }

  observe(state: GameState, wallTick: number): void {
    this.state = state;
    this.wallTick = wallTick;
  }

  record(input: RecordedInput, before: GameState, after: GameState, wallTick: number): void {
    this.inputs.push({
      sequence: this.inputs.length,
      route: this.route,
      seed: this.seed,
      tick: before.tick,
      seconds: before.tick / rules.ticksPerSecond,
      wallSeconds: wallTick / rules.ticksPerSecond,
      input,
      before: snapshot(before),
      after: snapshot(after),
    });
  }
}

const recordings: GameRecording[] = [];
afterEach((context) => {
  try {
    writeRecordings(context.task.name, recordings);
    for (const recording of recordings) assertInputTiming(recording);
  } finally {
    recordings.length = 0;
  }
});
