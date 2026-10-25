import type { GameCondition } from './conditions/model';
import type { ModeChange } from './live/modes';
import type { MemberId, TokenKind, UnitId } from './model';
import type { VoltageConvertEffect } from './voltageConversionTypes';
import type { StopVoltageIncreaseEffect } from './voltageConversionTypes';
import type { Action52BuffEffect } from './skillBoostTypes';
import type { MentalHeartInduceEffect } from './mentalHeartInduceTypes';

export type MoodBonus = Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
export type GaugeInfinity = Readonly<{
  gauge: 'ap' | 'voltage' | 'mental';
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
type InfinityGaugeEffect = Readonly<{
  kind: 'infinity-gauge';
  gauge: 'ap' | 'voltage' | 'mental';
  duration: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
}>;
export type GaugeRegeneration = Readonly<{
  gauge: 'mental' | 'voltage';
  sourceCardId: string | null;
  amount: number;
  intervalType: 1 | 2;
  intervalSeconds: number;
  elapsedSeconds: number;
  durationSeconds: number | null;
  durationElapsedSeconds: number;
  remainingSections: number | null;
  remainingHeartEvents: number | null;
}>;
export type GaugeRegenerationEffect = Readonly<{
  kind: 'gauge-regeneration';
  gauge: GaugeRegeneration['gauge'];
  amount: number;
  intervalType: 1 | 2;
  intervalMilliseconds: number;
  duration: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
}>;
type GaugeEffect = InfinityGaugeEffect | GaugeRegenerationEffect | MentalBarrierEffect;
export type MentalBarrier = Readonly<{
  kind: 'endurance' | 'attenuation';
  endurance: number;
  currentEndurance: number;
  attenuation: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
export type MentalBarrierEffect = Readonly<{
  kind: 'mental-barrier';
  barrier: 'endurance' | 'attenuation';
  enduranceType: 'ratio' | 'fixed' | 'infinite';
  endurance: number;
  attenuation: number;
  duration:
    | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>
    | Readonly<{ kind: 'stage' }>;
}>;
export type ComboInduceEffect = Readonly<{
  kind: 'combo-induce';
  members: readonly MemberId[];
  apPower: number;
  repeatAction: 0 | 1 | 2;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  effects: readonly Effect[];
  deactivationKey?: string;
}>;
type ResetSpecial = Readonly<{
  kind: 'reset-special';
  scope: 'normal' | 'extra' | 'all';
  target:
    | Readonly<{ kind: 'all' | 'source' | 'others' }>
    | Readonly<{ kind: 'member'; member: MemberId }>
    | Readonly<{ kind: 'unit'; unit: UnitId }>;
}>;
export type SearchTarget =
  | Readonly<{ kind: 'icon'; icon: number }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'token-series'; seriesId: number }>
  | Readonly<{ kind: 'token'; token: TokenKind }>;
export type SearchRequest = Readonly<{
  scope: 'grade' | 'section' | 'skill';
  target: SearchTarget;
}>;
export type TokenBoostTarget =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'card-series'; seriesId: number }>;
export type HeartBoostTarget =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'card-series'; seriesId: number }>;
type HeartBoostEffect = Readonly<{
  kind: 'heart-boost';
  percent: number;
  uses: number;
  target?: HeartBoostTarget;
  duration?: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
  moodBonus?: MoodBonus;
}>;
export type HeartBoostState = Readonly<{
  percent: number;
  uses: number;
  target: HeartBoostTarget;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
export type HandCardStats = Readonly<{
  enteredSectionIndex: number;
  cardUseCountsAtEntry: Readonly<Record<string, number>>;
}>;
export type SkillCostConditionType =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;
export type SkillCostChangeEffect = Readonly<{
  kind: 'skill-cost-change';
  amount: number;
  minimum: number;
  maximum: number;
  conditionType: SkillCostConditionType;
  conditionId?: number;
  addValue?: number;
  duration?: Readonly<{ sections: number }>;
}>;
export type SkillCostChange = Readonly<{
  sourceId: string;
  amount: number;
  minimum: number;
  maximum: number;
  conditionType: SkillCostConditionType;
  conditionId: number;
  remainingSections: number | null;
}>;
export type ParameterDetailValue = Readonly<{
  id: bigint;
  value: bigint;
  unitsPerValue: number;
}>;
export type ParameterValueChangeEffect = Readonly<{
  kind: 'parameter-value-change';
  sourceEffectId: string;
  targetDetailId: bigint;
  calculation: 'add' | 'multiply' | 'fan-level';
  base: number;
  increment: number;
  values?: readonly number[];
  members?: readonly MemberId[];
}>;
export type ParameterValueFactor = Readonly<{
  cardId: string;
  sourceEffectId: string;
  targetDetailId: bigint;
  factor: number;
}>;
export type TokenBoost = Readonly<{
  calculation: 'add' | 'multiply-percent';
  value: number;
  target: TokenBoostTarget;
  seriesIds?: readonly number[];
  remainingUses: number | null;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
export type ProxyAbsorption = Readonly<{
  id: number;
  sourceId: string;
  hasAbsorbLimit: boolean;
  isAbsoluteAdd: boolean;
  periodType: 1 | 2 | 3 | 4 | 5;
  remainingPeriod: number;
  isAbsorbEnd: boolean;
  induceTiming: number;
  induceCondition: number;
  inducePowerType: number;
  inducePowerParam: number;
  inducedEffects: readonly Readonly<{ actionType: number; effect: Effect }>[];
  effects: readonly Readonly<{
    actionType: number;
    targetAmount: bigint;
    totalAmount: bigint;
  }>[];
}>;
export type ProxySkillEffect = Readonly<{
  kind: 'proxy-skill';
  absorbLimit: number;
  periodType: 1 | 2 | 3 | 4 | 5;
  periodParam: number;
  induceTiming: number;
  induceCondition: number;
  inducePowerType: number;
  inducePowerParam: number;
  targets: readonly Readonly<{ actionType: number; targetAmount: number }>[];
  effects: readonly Readonly<{ actionType: number; effect: Effect }>[];
}>;
type ProxyForcedActivationEffect = Readonly<{
  kind: 'proxy-skill-forced-activation';
  targetType: 1 | 2 | 3 | 4 | 5;
}>;

type EffectShape =
  | Readonly<{
      kind: 'branch';
      condition: GameCondition;
      whenTrue: readonly Effect[];
      whenFalse: readonly Effect[];
    }>
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
      deactivationKey?: string;
    }>
  | Readonly<{ kind: 'mood'; amount: number }>
  | Readonly<{
      kind: 'conditional';
      condition: 'happy100' | 'mellow100' | 'mental0' | 'deck80' | 'first-section' | 'last-section';
      effects: readonly Effect[];
    }>
  | Readonly<{ kind: 'tokens'; token: TokenKind; count: number; seriesIds?: readonly number[] }>
  | Readonly<{
      kind: 'token-boost';
      calculation: TokenBoost['calculation'];
      num: number;
      addValue?: number;
      target: TokenBoostTarget;
      seriesIds?: readonly number[];
      uses?: number;
      duration?: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
    }>
  | Readonly<{
      kind: 'hand-limit';
      amount: number;
      duration?: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
      invocationType?: 0x388 | 0x38b;
      deactivationKey?: string;
    }>
  | Readonly<{ kind: 'heart-limit'; amount: number }>
  | Readonly<{
      kind: 'heart-limit-change';
      calculationType: 1 | 2;
      num: number;
      bonusMoodTarget: 0 | 1 | 2 | 3;
      bonusMoodValue: number;
      duration:
        | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>
        | Readonly<{ kind: 'stage' }>;
      invocationType?: number;
      deactivationKey?: string;
    }>
  | Readonly<{ kind: 'use-hand'; addAp?: number }>
  | Readonly<{ kind: 'card-move'; destination: 'deck' | 'exclusion' }>
  | Readonly<{ kind: 'shuffle'; recoverDiscard: boolean; destination: 'draw' | 'discard' }>
  | Readonly<{ kind: 'search-unit'; unit: UnitId; count: number }>
  | Readonly<{ kind: 'search-token'; token: TokenKind; count: number }>
  | Readonly<{ kind: 'search'; scope: SearchRequest['scope']; target: SearchTarget; count: number }>
  | Readonly<{ kind: 'bloom'; strength: number }>
  | Readonly<{ kind: 'skill-cooldown'; ratio: number }>
  | Readonly<{ kind: 'energy-limit'; amount: number }>
  | Readonly<{ kind: 'ap-speed'; percent: number; duration: 'stage' | 'section' }>
  | Readonly<{
      kind: 'ap-speed-change';
      calculationType: 1 | 2;
      num: number;
      bonusMoodTarget: 0 | 1 | 2 | 3;
      bonusMoodValue: number;
      duration:
        | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>
        | Readonly<{ kind: 'stage' }>;
      invocationType?: number;
      deactivationKey?: string;
    }>
  | VoltageConvertEffect
  | MentalHeartInduceEffect
  | ComboInduceEffect
  | Action52BuffEffect
  | ResetSpecial
  | Readonly<{ kind: 'voltage-limit'; amount: number }>
  | Readonly<{ kind: 'voltage-tier'; step: 100 | 200; tiers: readonly (readonly Effect[])[] }>
  | Readonly<{ kind: 'protect-mental'; duration?: 'section' }>
  | Readonly<{ kind: 'beat-count'; amount: number }>
  | Readonly<{
      kind: 'beat-point-buff';
      amount: number;
      addValue?: number;
      multiplier?: number;
      moodBonus?: MoodBonus;
      duration?: Readonly<{ sections: number }>;
    }>
  | HeartBoostEffect
  | Readonly<{ kind: 'mental-shield'; amount: number; moodBonus?: MoodBonus }>
  | Readonly<{
      kind: 'cost-reduction';
      amount: number;
      target:
        | Readonly<{ kind: 'unit'; unit: UnitId }>
        | Readonly<{ kind: 'token'; token: TokenKind }>;
    }>
  | SkillCostChangeEffect
  | ParameterValueChangeEffect
  | Readonly<{ kind: 'voltage-set'; amount: number }>
  | GaugeEffect
  | StopVoltageIncreaseEffect
  | Readonly<{
      kind: 'resource-boost';
      target: 'excitement' | 'stamina' | 'attract';
      percent: number;
      uses: number | null;
      condition: 'voltage20' | 'mental100' | 'always';
      members?: readonly MemberId[];
      moodBonus?: MoodBonus;
    }>
  | Readonly<{ kind: 'mode'; modeId: number; change: ModeChange['change'] }>
  | Readonly<{
      kind: 'mode-reaction';
      modeId: number;
      thresholds: readonly number[];
      effects: readonly Effect[];
      buffNum: number;
    }>
  | Readonly<{ kind: 'collect' }>
  | ProxySkillEffect
  | ProxyForcedActivationEffect;
export type Effect = EffectShape &
  Readonly<{
    parameterDetails?: Readonly<Record<string, ParameterDetailValue>>;
  }>;
