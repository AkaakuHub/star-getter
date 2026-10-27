import type { RouteId } from '../../../src/content/routes';
import type { InputRecord, RecordedInput } from '../recording/gameRecording';

export type VideoRecording = Readonly<{
  route: RouteId;
  seed: number;
  ticksPerSecond: number;
  finalState: InputRecord['after'] &
    Readonly<{ seconds: number; wallSeconds: number; tick: number }>;
  inputs: readonly InputRecord[];
}>;

export type ReplaySnapshot = Readonly<{
  wallTick: number;
  tick: number;
  score: string;
  gauge: string | null;
  deckSize: number;
  energy: number;
  heartLimit: number;
  storyAmplification: number;
  lastActionTick: number;
  phase: string;
  hand: readonly string[];
  error: string;
}>;

export type ReplaySession = Readonly<{
  advanceTo: (target: number) => Promise<void>;
  deferResumeFrame: () => void;
  paint: () => void;
  snapshot: () => ReplaySnapshot;
}>;

export type TapRecord = Readonly<{
  sequence: number;
  wallSeconds: number;
  kind: RecordedInput['kind'];
  x: number;
  y: number;
}>;

declare global {
  interface Window {
    e2eVideoConfig: Readonly<{ route: RouteId; seed: number }>;
    e2eVideoSession: ReplaySession | undefined;
    e2eVideoTapLabel: string;
  }
}
