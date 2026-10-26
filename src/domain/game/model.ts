import type { SkillCooldownEffect } from './skillCooldownTypes';
import type {
  ActiveCardMoveInducer,
  ActiveEffectInducer,
  InducedSkillEffect,
} from './induceSkillEffectTypes';
import type { DisableMentalDown } from './disableMentalDownTypes';
import type { MentalBarrierAdditionalBuff } from './mentalBarrierAdditionalBuffTypes';
import type { MentalRecoverAdditionalBuff } from './mentalRecoverAdditionalBuffTypes';
import type { VoltageUpAdditionalBuff } from './voltageUpAdditionalBuffTypes';
import type { LoveUpAdditionalBuff } from './loveUpAdditionalBuffTypes';
import type { ScoreLimitSettings } from './live/scoreLimit';
import type { StarGatherHeartRuntimeState } from './live/heartTypes';
import type { StageGauges } from './live/gaugeTiming';
import type { AutomaticHeartState } from './live/automaticHeart';
import type { ScoreSample } from './scoreHistory';
import type { MoodSample } from './moodHistory';
import type { ModeState } from './live/modes';
import type { MoodKey } from './live/moodTimeline';
import type { Effect } from './modelTypes';
import type { GameCondition } from './conditions/model';
import type { Card } from './cards/cardTypes';
export type { Action } from './actionTypes';
export type { Card } from './cards/cardTypes';
import type { TemporaryScoreBoost, VoltageConversion } from './voltageConversionTypes';
import type { Action52Buff } from './skillBoostTypes';
import type { MentalHeartInducer } from './mentalHeartInduceTypes';
import type { ComboInducer } from './comboInduceTypes';
import type { AdditionalHeartInducer } from './additionalHeartTypes';
import type { TokenRequest } from './tokenRequestTypes';
import type {
  GaugeInfinity,
  GaugeRegeneration,
  HeartBoostState,
  HandCardStats,
  MentalBarrier,
  SearchRequest,
  SkillCostChange,
  ParameterValueFactor,
  TokenBoost,
} from './modelTypes';
import type { TokenDeckSplit } from './tokenDeckSplitTypes';
import type { ProxyAbsorption } from './proxySkillTypes';
import type { IngameMission, IngameMissionGroup } from './ingameMissionTypes';
import type { HeartLimitAdditionalBuff } from './heartLimitBoostTypes';
import type { MoodValueAdditionalBuff } from './moodValueBoostTypes';
import type { SpecialAppealToken } from './specialAppealTokenTypes';
import type { HandMaxCardEffectState } from './handMaxCardTypes';
import type { MentalShield } from './mentalShieldTypes';
import type { FixedParameterExtend } from './fixedParameterExtendTypes';
import type { BeatPointBuff } from './beatPointBuffTypes';
import type { Boost, ResourceBoost, SkillScoreUp, TargetBoost } from './boostTypes';
export { rules } from './rules';
export type { Boost, ResourceBoost, TargetBoost } from './boostTypes';

export type { SearchRequest } from './modelTypes';
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
  masteryVoltageBonus: Readonly<{ demand: number; gain: number }>;
  scoreLimit: ScoreLimitSettings;
  sections: readonly Section[];
  moodKeys: readonly MoodKey[];
  ingameMissionGroups: readonly IngameMissionGroup[];
}>;

export type CardUse = Readonly<{
  key: number;
  card: Card;
  tick: number;
  handIndex: number;
  handCount: number;
  cost: number;
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
    thresholds: readonly bigint[];
    effects: readonly Effect[];
    buffNum: bigint;
    count: number;
  }>[];
  phase: 'ready' | 'playing' | 'paused' | 'finished';
  currentSkillType: number | null;
  tick: number;
  track: Track;
  deck: readonly Card[];
  cardPool: readonly Card[];
  hand: readonly string[];
  handEffectCardIds: readonly string[];
  activeHandPermanentCardIds: readonly string[];
  proxyCards: readonly string[];
  drawPile: readonly string[];
  tokenDeckSplit: TokenDeckSplit | null;
  ingameMission: IngameMission | null;
  deckOutCount: number;
  discard: readonly string[];
  tokenCatalog: readonly Card[];
  nextTokenId: number;
  tokenGroups: readonly Readonly<{
    sourceId: string;
    requests: readonly TokenRequest[];
  }>[];
  tokenBoosts: readonly TokenBoost[];
  handLimit: number;
  proxyAbsorptions: readonly ProxyAbsorption[];
  nextProxyAbsorptionId: number;
  handLimitEffects: readonly Readonly<{
    amount: number;
    expirationAmount: number;
    deactivationKey: string | null;
    remainingSeconds: number | null;
    remainingSections: bigint | null;
  }>[];
  heartLimitBase: number;
  heartLimitBuffs: readonly Readonly<{
    id: number;
    calculation: 'add' | 'multiply';
    value: number;
    remainingSeconds: number | null;
    remainingSections: number | null;
    deactivationKey: string | null;
  }>[];
  nextHeartLimitBuffId: number;
  heartLimitAdditionalBuffs: readonly HeartLimitAdditionalBuff[];
  nextHeartLimitAdditionalBuffId: number;
  moodValueAdditionalBuffs: readonly MoodValueAdditionalBuff[];
  nextMoodValueAdditionalBuffId: number;
  drawContext: 'initial' | 'skill' | 'shuffle' | 'idle';
  deckActions: Readonly<{
    shuffles: readonly Readonly<{
      sourceId: string | null;
      options: HandShuffle;
      skipSourceRefill: boolean;
    }>[];
    searches: readonly SearchRequest[];
  }>;
  lastUsedMember: MemberId | null;
  lastUsedUnit: UnitId | null;
  lastUsedSkillIcon: number | null;
  cardUseCounts: Readonly<Record<string, number>>;
  skillActivationCounts: Readonly<Record<string, number>>;
  handCardStats: Readonly<Record<string, HandCardStats>>;
  skillCostChanges: readonly SkillCostChange[];
  parameterValueFactors: readonly ParameterValueFactor[];
  parameterValueChangeCounts: Readonly<Record<string, Readonly<Record<string, number>>>>;
  activeModeParameterChanges: readonly Readonly<{
    cardId: string;
    modeId: number;
    isOn: boolean;
  }>[];
  skillUseDestinations: Readonly<Record<string, 'deck' | 'exclusion' | 'proxy'>>;
  activation: Readonly<{
    sourceId: string;
    usedCards: readonly string[];
    handCardStatsAtUse: Readonly<Record<string, HandCardStats>>;
    allHand: boolean;
    skipSourceRefill?: boolean;
    recoverDiscard: boolean;
    returnToDraw: readonly string[];
    excluded: readonly string[];
    handCountChanges: Readonly<Record<string, number>>;
    pendingHandStatsDeactivationKeys?: readonly string[];
  }> | null;
  randomSeed: number;
  energy: number;
  maxEnergy: number;
  fixedParameterBase: Readonly<{ ap: number; voltage: number; mental: number }>;
  maximumMental: number;
  fixedParameterExtends: readonly FixedParameterExtend[];
  nextFixedParameterExtendId: number;
  apTimeEffects: readonly Readonly<{
    calculation: 'add' | 'multiply';
    value: number;
    remainingSeconds: number | null;
    remainingSections: bigint | null;
    deactivationKey: string | null;
  }>[];
  voltageConversions: readonly VoltageConversion[];
  action52Buffs: readonly Action52Buff[];
  mentalHeartInducers: readonly MentalHeartInducer[];
  nextMentalHeartInducerId: number;
  additionalHeartInducers: readonly AdditionalHeartInducer[];
  nextAdditionalHeartInducerId: number;
  comboInducer: ComboInducer | null;
  apTimerSeconds: number;
  mentalTimerSeconds: number;
  voltageTimerSeconds: number;
  voltageStops: readonly Readonly<{
    id: number;
    remainingSeconds: number | null;
    remainingSections: number | null;
    deactivationKey: string | null;
  }>[];
  nextVoltageStopId: number;
  nextVoltageConversionId: number;
  nextAction52BuffId: number;
  loveUpAdditionalBuffs: readonly LoveUpAdditionalBuff[];
  voltageUpAdditionalBuffs: readonly VoltageUpAdditionalBuff[];
  mentalRecoverAdditionalBuffs: readonly MentalRecoverAdditionalBuff[];
  mentalBarrierAdditionalBuffs: readonly MentalBarrierAdditionalBuff[];
  nextSkillAdditionalBuffId: number;
  temporaryScoreBoosts: readonly TemporaryScoreBoost[];
  gaugeInfinities: readonly GaugeInfinity[];
  gaugeRegenerations: readonly GaugeRegeneration[];
  moodOffset: number;
  moodSkillBuffs: readonly Readonly<{
    calculation: 'add' | 'fixed';
    value: number;
    remainingSeconds: number | null;
    remainingSections: bigint | null;
    deactivationKey: string | null;
  }>[];
  costReductions: Readonly<Record<string, number>>;
  onceSkillCostChanges: Readonly<Record<string, number>>;
  storyAmplification: number;
  stamina: number;
  resting: boolean;
  mentalProtected: boolean;
  disableMentalDownEffects: readonly DisableMentalDown[];
  nextDisableMentalDownId: number;
  sectionMentalProtected: boolean;
  sectionBeatHeartBonus: number;
  beatPointBuffs: readonly BeatPointBuff[];
  beatHeartValueBuffs: readonly Readonly<{
    calculation: 'add' | 'multiply' | 'fixed';
    value: number;
    remainingSeconds: number | null;
    remainingSections: bigint | null;
    deactivationKey: string | null;
  }>[];
  heartBoosts: readonly HeartBoostState[];
  mentalShields: readonly MentalShield[];
  mentalBarriers: readonly MentalBarrier[];
  excitement: number;
  masteryVoltageProgress: number;
  maximumVoltageLevel: number;
  specialAppealTokens: readonly SpecialAppealToken[];
  handMaxCardEffects: readonly HandMaxCardEffectState[];
  specialUsed: readonly string[];
  score: bigint;
  scoreMultiplier: bigint;
  scoreHistory: readonly ScoreSample[];
  moodHistory: readonly MoodSample[];
  hearts: StarGatherHeartRuntimeState;
  automaticHeart: AutomaticHeartState;
  heartRandomSeed: number;
  boosts: readonly Boost[];
  skillScoreUps: readonly SkillScoreUp[];
  amplification: number;
  sectionAmplification: number;
  targetBoosts: readonly TargetBoost[];
  resourceBoosts: readonly ResourceBoost[];
  bloom: Bloom | null;
  relayUsed: readonly string[];
  handHeartCollectCounts: Readonly<Record<string, number>>;
  handCollectionActivationCounts: Readonly<Record<string, number>>;
  handUseActivationCounts: Readonly<Record<string, number>>;
  handUseHeartCollectionCounts: Readonly<Record<string, number>>;
  skillEffectActivationCounts: Readonly<Record<string, number>>;
  effectInducers: readonly ActiveEffectInducer[];
  branchInducers: readonly Readonly<{
    id: number;
    condition: GameCondition;
    whenTrue: readonly Effect[];
    whenFalse: readonly Effect[];
    active: boolean | null;
    deactivationKey: string | null;
    sourceCardId: string | null;
  }>[];
  nextBranchInducerId: number;
  cardMoveInducers: readonly ActiveCardMoveInducer[];
  combo: number;
  lastCollectTick: number;
  lastActionTick: number;
  skillCooldownEffects: readonly SkillCooldownEffect[];
  nextSkillCooldownEffectId: number;
  inducedSkillEffects: readonly InducedSkillEffect[];
  nextInducedSkillEffectId: number;
  lastPerformer: PerformerId | null;
  lastCardName: string;
  cardUses: readonly CardUse[];
  lastGain: bigint;
  stats: PlayStats;
}>;
