import { afterEach } from 'vite-plus/test';
import type { RouteId } from '../../../src/content/routes';
import { type GameState, rules } from '../../../src/domain/game/model';
import { writeRecordings } from './writeRecordings';

type CardReference = Readonly<{ instanceId: string; name: string; handIndex: number | null }>;
export type RecordedInput =
  | Readonly<{ kind: 'card' | 'special'; card: CardReference }>
  | Readonly<{ kind: 'collect' }>
  | Readonly<{ kind: 'automatic-hearts'; enabled: boolean }>;
type Snapshot = Readonly<{ score: string; gauge: string | null; deckSize: number; energy: number }>;
export type InputRecord = Readonly<{
  sequence: number;
  route: RouteId;
  seed: number;
  tick: number;
  seconds: number;
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
  };
}

export class GameRecording {
  readonly inputs: InputRecord[] = [];

  constructor(
    readonly route: RouteId,
    readonly seed: number,
    private state: GameState,
  ) {
    recordings.push(this);
  }

  get finalState() {
    return {
      ...snapshot(this.state),
      phase: this.state.phase,
      tick: this.state.tick,
      seconds: this.state.tick / rules.ticksPerSecond,
    };
  }

  observe(state: GameState): void {
    this.state = state;
  }

  record(input: RecordedInput, before: GameState, after: GameState): void {
    this.inputs.push({
      sequence: this.inputs.length,
      route: this.route,
      seed: this.seed,
      tick: before.tick,
      seconds: before.tick / rules.ticksPerSecond,
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
  } finally {
    recordings.length = 0;
  }
});
