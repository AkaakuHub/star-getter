import type { StarGatherHeartRuntimeState } from './live/heartTypes';
import type { StarGatherCardAppealParameters } from './live/clientScoreInput';
import type { AutomaticHeartState } from './live/automaticHeart';

export type PerformerId = 'nova' | 'lumen' | 'tetra';
export type Mood = 'warm' | 'cool' | 'bright';
export const costumeIds = [
  'star',
  'moon',
  'blossom',
  'encore',
  'sailor',
  'witch',
  'prism',
  'snow',
  'sunny',
  'space',
  'march',
  'ribbon',
] as const;
export type CostumeId = (typeof costumeIds)[number];
export type TokenKind = 'ensemble' | 'story' | 'clock' | 'bookmark';
export type MoodBonus = Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
export type Effect =
  | Readonly<{
      kind: 'hearts' | 'beat-hearts' | 'energy' | 'stamina' | 'excitement';
      amount: number;
      moodBonus?: MoodBonus;
    }>
  | Readonly<{ kind: 'boost'; multiplier: number; seconds: number; moodBonus?: MoodBonus }>
  | Readonly<{ kind: 'amplify'; percent: number; moodBonus?: MoodBonus }>
  | Readonly<{ kind: 'mood'; amount: number }>
  | Readonly<{ kind: 'conditional'; condition: 'happy100' | 'deck80'; effects: readonly Effect[] }>
  | Readonly<{ kind: 'tokens'; token: TokenKind; count: number }>
  | Readonly<{ kind: 'hand-limit' | 'heart-limit'; amount: number }>
  | Readonly<{ kind: 'shuffle' | 'use-hand' }>
  | Readonly<{ kind: 'bloom'; strength: number }>
  | Readonly<{
      kind: 'resource-boost';
      target: 'excitement' | 'stamina';
      percent: number;
      uses: number;
      condition: 'voltage20' | 'mental100';
      moodBonus?: MoodBonus;
    }>
  | Readonly<{ kind: 'collect' }>;

export type Card = Readonly<{
  id: string;
  name: string;
  costume: CostumeId;
  performer: PerformerId;
  cost: number;
  appeal: StarGatherCardAppealParameters;
  beatPoint: number;
  effects: readonly Effect[];
  relay?: Readonly<{ threshold: number; hearts: number; beats?: boolean }>;
  token?: TokenKind;
  exhausts?: true;
  drawPreference?: TokenKind;
  passive?: Readonly<{ heartsPercent: number; handLimitDelta: number; moodBonus?: MoodBonus }>;
  drawAbility?: 'clock' | 'bookmark' | 'story' | 'library';
  useAbility?: 'story-boost';
}>;

export type Section = Readonly<{
  name: string;
  startBeat: number;
  mood: Mood;
  moodValue: number;
  climax: boolean;
}>;

export type Track = Readonly<{
  id: string;
  name: string;
  bpm: number;
  beats: number;
  sections: readonly Section[];
  melody: readonly number[];
  chords: readonly (readonly [number, number, number])[];
}>;

export type CardUse = Readonly<{
  key: number;
  card: Card;
  tick: number;
  handIndex: number;
  handCount: number;
  cost: number;
}>;
export type Boost = Readonly<{ percent: number; untilTick: number }>;
export type ResourceBoost = Readonly<{
  target: 'excitement' | 'stamina';
  percent: number;
  uses: number;
}>;
export type Bloom = Readonly<{
  progress: bigint;
  strength: number;
  rollback: Readonly<{ energy: number; stamina: number; excitement: number }>;
}>;
export type PlayStats = Readonly<{
  cardsUsed: number;
  heartsCollected: number;
  heartsMissed: number;
  specialsUsed: number;
  bestCollection: number;
  bestCombo: number;
}>;

export type GameState = Readonly<{
  phase: 'ready' | 'playing' | 'paused' | 'finished';
  tick: number;
  track: Track;
  deck: readonly Card[];
  hand: readonly string[];
  drawPile: readonly string[];
  discard: readonly string[];
  tokenCatalog: readonly Card[];
  nextTokenId: number;
  handLimit: number;
  nextDrawPreference: TokenKind | null;
  randomSeed: number;
  energy: number;
  apIntervalFactor: number;
  apTimerSeconds: number;
  moodOffset: number;
  costReductions: Readonly<Record<string, number>>;
  storyAmplification: number;
  stamina: number;
  resting: boolean;
  excitement: number;
  charge: number;
  score: bigint;
  hearts: StarGatherHeartRuntimeState;
  automaticHeart: AutomaticHeartState;
  heartRandomSeed: number;
  boosts: readonly Boost[];
  amplification: number;
  resourceBoosts: readonly ResourceBoost[];
  bloom: Bloom | null;
  relayUsed: readonly string[];
  handHeartCollectCounts: Readonly<Record<string, number>>;
  combo: number;
  lastCollectTick: number;
  lastActionTick: number;
  lastPerformer: PerformerId | null;
  lastCardName: string;
  cardUses: readonly CardUse[];
  lastGain: bigint;
  stats: PlayStats;
}>;

export type Action =
  | Readonly<{ type: 'start' | 'pause' | 'resume' | 'collect' | 'special' }>
  | Readonly<{ type: 'card'; index: number }>;

export const rules = {
  ticksPerSecond: 60,
  energyTicksPerPoint: 30,
  handSize: 5,
  deckSize: 9,
  maxEnergy: 10,
  maxBloomGauge: 2_147_483_647n,
  comboWindowTicks: 120,
  maxScore: 9999n * 10n ** 68n,
} as const;
