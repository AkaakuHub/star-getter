import type { DrawProbabilityRule } from './cards/drawProbability';
import type { ScoreLimitSettings } from './live/scoreLimit';
import type { StarGatherHeartRuntimeState } from './live/heartTypes';
import type { StarGatherCardAppealParameters } from './live/clientScoreInput';
import type { StageGauges } from './live/gaugeTiming';
import type { AutomaticHeartState } from './live/automaticHeart';
import type { ScoreSample } from './scoreHistory';
import type { MoodSample } from './moodHistory';
import type { ModeState } from './live/modes';
import type { MoodKey } from './live/moodTimeline';
import type { Effect } from './modelTypes';
import type {
  GaugeInfinity,
  GaugeRegeneration,
  HeartBoostState,
  HandCardStats,
  MentalBarrier,
  MoodBonus,
  SearchRequest,
  SkillCostChange,
  ParameterValueFactor,
  ParameterValueChangeEffect,
  TokenBoost,
} from './modelTypes';

export type { MoodBonus, SearchRequest } from './modelTypes';
export type { SearchTarget, TokenBoost } from './modelTypes';
export type { Effect } from './modelTypes';

export type PerformerId = 'nova' | 'lumen' | 'tetra';
export type MemberId = 0 | 1021 | 1022 | 1030 | 1031 | 1032 | 1033 | 1041 | 1042 | 1053;
export type UnitId = 1 | 2 | 3;

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
export type HandShuffle = Readonly<{ recoverDiscard: boolean; destination: 'draw' | 'discard' }>;

export type TokenKind = 'ensemble' | 'story' | 'clock' | 'bookmark' | 'shadow';
export type Card = Readonly<{
  id: string;
  name: string;
  costume: CostumeId;
  performer: PerformerId;
  member: MemberId;
  unit: UnitId | null;
  cost: number;
  style?: number;
  appeal: StarGatherCardAppealParameters;
  beatPoint: number;
  modeIds?: readonly number[];
  modeParameterChanges?: Readonly<{
    modeId: number;
    off: readonly ParameterValueChangeEffect[];
    on: readonly ParameterValueChangeEffect[];
  }>;
  tokenSeriesIds?: readonly number[];
  effects: readonly Effect[];
  drawEffects?: readonly Effect[];
  beforeUseEffects?: readonly Effect[];
  handUse?: Readonly<{ trigger: UnitId; effects: readonly Effect[] }>;
  relay?: Readonly<{ threshold: number; hearts: number; beats?: boolean; moodBonus?: MoodBonus }>;
  token?: TokenKind;
  exhausts?: true;
  special?: Readonly<{ cost: number; extra: boolean; effects: readonly Effect[] }>;
  allHandCost?: Readonly<{
    reductions: readonly Readonly<{ minimumCards: number; amount: number }>[];
  }>;
  drawRules?: readonly DrawProbabilityRule[];
  skillIcon?: number;
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
  beforeUseAbility?: 'story-boost' | 'icy-sayaka';
  useAbility?: 'class' | 'shadow';
  collectionEffects?: Readonly<{ threshold: number; effects: readonly Effect[] }>;
  collectionAbility?: 'icy-sayaka' | 'icy-kosuzu';
}>;

export type Section = Readonly<{
  name: string;
  startBeat: number;
  climax: boolean;
}>;

export type Track = Readonly<{
  id: string;
  name: string;
  bpm: number;
  songTime: number;
  beats: number;
  stage: StageGauges;
  scoreLimit: ScoreLimitSettings;
  sections: readonly Section[];
  moodKeys: readonly MoodKey[];
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
  target: 'excitement' | 'stamina' | 'attract';
  members?: readonly MemberId[];
  percent: number;
  uses: number | null;
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
  supportLevels: Readonly<Record<number, number>>;
  modes: ModeState;
  modeReactions: readonly Readonly<{
    sourceId: string | null;
    modeId: number;
    thresholds: readonly number[];
    effects: readonly Effect[];
    buffNum: number;
    count: number;
  }>[];
  phase: 'ready' | 'playing' | 'paused' | 'finished';
  tick: number;
  track: Track;
  deck: readonly Card[];
  cardPool: readonly Card[];
  hand: readonly string[];
  handEffectCardIds: readonly string[];
  drawPile: readonly string[];
  deckOutCount: number;
  discard: readonly string[];
  tokenCatalog: readonly Card[];
  nextTokenId: number;
  tokenGroups: readonly Readonly<{
    sourceId: string;
    requests: readonly Readonly<{
      token: TokenKind;
      count: number;
      seriesIds?: readonly number[];
    }>[];
  }>[];
  tokenBoosts: readonly TokenBoost[];
  handLimit: number;
  drawContext: 'initial' | 'skill' | 'shuffle' | 'idle';
  deckActions: Readonly<{
    shuffles: readonly Readonly<{ sourceId: string | null; options: HandShuffle }>[];
    searches: readonly SearchRequest[];
  }>;
  lastUsedMember: MemberId | null;
  lastUsedUnit: UnitId | null;
  lastUsedSkillIcon: number | null;
  cardUseCounts: Readonly<Record<string, number>>;
  handCardStats: Readonly<Record<string, HandCardStats>>;
  skillCostChanges: readonly SkillCostChange[];
  parameterValueFactors: readonly ParameterValueFactor[];
  parameterValueChangeCounts: Readonly<Record<string, Readonly<Record<string, number>>>>;
  activeModeParameterChanges: readonly Readonly<{
    cardId: string;
    modeId: number;
    isOn: boolean;
  }>[];
  skillUseDestinations: Readonly<Record<string, 'deck' | 'exclusion'>>;
  activation: Readonly<{
    sourceId: string;
    usedCards: readonly string[];
    allHand: boolean;
    recoverDiscard: boolean;
    returnToDraw: readonly string[];
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
  voltageStops: readonly Readonly<{
    remainingSeconds: number | null;
    remainingSections: number | null;
  }>[];
  gaugeInfinities: readonly GaugeInfinity[];
  gaugeRegenerations: readonly GaugeRegeneration[];
  moodOffset: number;
  costReductions: Readonly<Record<string, number>>;
  storyAmplification: number;
  stamina: number;
  resting: boolean;
  mentalProtected: boolean;
  sectionMentalProtected: boolean;
  sectionBeatHeartBonus: number;
  beatPointBuffs: readonly Readonly<{ value: number; remainingSections: number | null }>[];
  heartBoosts: readonly HeartBoostState[];
  mentalShield: number;
  mentalBarriers: readonly MentalBarrier[];
  excitement: number;
  maximumVoltageLevel: number;
  specialUsed: readonly string[];
  score: bigint;
  scoreMultiplier: bigint;
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
  skillCooldownSeconds: number | null;
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
  maxBloomGauge: 2_147_483_647n,
  comboWindowTicks: 120,
  maxScore: 9999n * 10n ** 68n,
} as const;
