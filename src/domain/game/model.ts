import type { StarGatherHeartRuntimeState } from './live/heartTypes';
import type { StarGatherCardAppealParameters } from './live/clientScoreInput';
import type { StageGauges } from './live/gaugeTiming';
import type { AutomaticHeartState } from './live/automaticHeart';
import type { ScoreSample } from './scoreHistory';
import type { MoodSample } from './moodHistory';

export type PerformerId = 'nova' | 'lumen' | 'tetra';
export type MemberId = 0 | 1021 | 1022 | 1030 | 1031 | 1032 | 1033 | 1041 | 1053;
export type UnitId = 1 | 2 | 3;
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
export type TokenKind = 'ensemble' | 'story' | 'clock' | 'bookmark' | 'shadow';
export type MoodBonus = Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
export type Effect =
  | Readonly<{
      kind: 'hearts' | 'beat-hearts' | 'energy' | 'stamina' | 'excitement';
      amount: number;
      moodBonus?: MoodBonus;
    }>
  | Readonly<{ kind: 'boost'; multiplier: number; moodBonus?: MoodBonus }>
  | Readonly<{
      kind: 'amplify';
      percent: number;
      moodBonus?: MoodBonus;
      members?: readonly MemberId[];
      duration?: 'section';
    }>
  | Readonly<{ kind: 'mood'; amount: number }>
  | Readonly<{
      kind: 'conditional';
      condition: 'happy100' | 'mellow100' | 'deck80' | 'first-section' | 'last-section';
      effects: readonly Effect[];
    }>
  | Readonly<{ kind: 'tokens'; token: TokenKind; count: number }>
  | Readonly<{ kind: 'hand-limit' | 'heart-limit'; amount: number }>
  | Readonly<{ kind: 'shuffle' | 'use-hand' }>
  | Readonly<{ kind: 'bloom'; strength: number }>
  | Readonly<{ kind: 'energy-limit'; amount: number }>
  | Readonly<{ kind: 'ap-speed'; percent: number; duration: 'stage' | 'section' }>
  | Readonly<{ kind: 'reset-special'; unit?: UnitId; normalOnly?: true }>
  | Readonly<{ kind: 'set-energy'; amount: number }>
  | Readonly<{ kind: 'voltage-limit'; amount: number }>
  | Readonly<{ kind: 'voltage-tier'; tiers: readonly (readonly Effect[])[] }>
  | Readonly<{ kind: 'protect-mental' }>
  | Readonly<{ kind: 'voltage-set'; amount: number }>
  | Readonly<{
      kind: 'resource-boost';
      target: 'excitement' | 'stamina';
      percent: number;
      uses: number;
      condition: 'voltage20' | 'mental100' | 'always';
      moodBonus?: MoodBonus;
    }>
  | Readonly<{ kind: 'collect' }>;

export type Card = Readonly<{
  id: string;
  name: string;
  costume: CostumeId;
  performer: PerformerId;
  member: MemberId;
  unit: UnitId | null;
  cost: number;
  appeal: StarGatherCardAppealParameters;
  beatPoint: number;
  effects: readonly Effect[];
  relay?: Readonly<{ threshold: number; hearts: number; beats?: boolean; moodBonus?: MoodBonus }>;
  token?: TokenKind;
  exhausts?: true;
  special?: Readonly<{ cost: number; extra: boolean; effects: readonly Effect[] }>;
  allHandCost?: 'sum' | 'library';
  drawRule?: Readonly<{ member?: MemberId; unit?: UnitId; priority?: true }>;
  passive?: Readonly<{
    heartsPercent?: number;
    handLimitDelta?: number;
    moodBonus?: MoodBonus;
    skillBoost?: Readonly<{ members: readonly MemberId[]; percent: number; moodBonus?: MoodBonus }>;
  }>;
  drawAbility?:
    | 'clock'
    | 'bookmark'
    | 'story'
    | 'library'
    | 'genesis'
    | 'camera'
    | 'perennial'
    | 'shadow';
  useAbility?: 'story-boost' | 'aurora' | 'class' | 'icy-sayaka' | 'shadow';
  collectionAbility?: 'icy-sayaka';
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
  stage: StageGauges;
  sections: readonly Section[];
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
export type TargetBoost = Readonly<{
  members: readonly MemberId[];
  percent: number;
  duration: 'stage' | 'section';
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
  cardPool: readonly Card[];
  hand: readonly string[];
  drawPile: readonly string[];
  discard: readonly string[];
  tokenCatalog: readonly Card[];
  nextTokenId: number;
  handLimit: number;
  drawContext: 'initial' | 'skill' | 'shuffle' | 'idle';
  lastUsedMember: MemberId | null;
  lastUsedUnit: UnitId | null;
  cardUseCounts: Readonly<Record<string, number>>;
  activation: Readonly<{
    sourceId: string;
    usedCards: readonly string[];
    allHand: boolean;
    shuffle: boolean;
    excluded: readonly string[];
  }> | null;
  randomSeed: number;
  energy: number;
  maxEnergy: number;
  apIntervalFactor: number;
  apStageIntervalFactor: number;
  apTimerSeconds: number;
  mentalTimerSeconds: number;
  voltageTimerSeconds: number;
  moodOffset: number;
  costReductions: Readonly<Record<string, number>>;
  storyAmplification: number;
  stamina: number;
  resting: boolean;
  mentalProtected: boolean;
  excitement: number;
  maximumVoltageLevel: number;
  specialUsed: readonly string[];
  score: bigint;
  scoreHistory: readonly ScoreSample[];
  moodHistory: readonly MoodSample[];
  hearts: StarGatherHeartRuntimeState;
  automaticHeart: AutomaticHeartState;
  heartRandomSeed: number;
  boosts: readonly Boost[];
  amplification: number;
  sectionAmplification: number;
  targetBoosts: readonly TargetBoost[];
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
  | Readonly<{ type: 'start' | 'pause' | 'resume' | 'collect' }>
  | Readonly<{ type: 'special'; cardId: string }>
  | Readonly<{ type: 'card'; index: number }>;

export const rules = {
  ticksPerSecond: 60,
  handSize: 5,
  maxDeckSize: 100,
  maxEnergy: 10,
  maxBloomGauge: 2_147_483_647n,
  comboWindowTicks: 120,
  maxScore: 9999n * 10n ** 68n,
} as const;
