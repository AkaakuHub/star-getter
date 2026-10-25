import type { SkillCooldownEffectInput } from './skillCooldownTypes';
import type { InduceSkillEffectInput, InduceEffect } from './induceSkillEffectTypes';
import type { DisableMentalDownEffect } from './disableMentalDownTypes';
import type { MentalBarrierAdditionalBuffEffect } from './mentalBarrierAdditionalBuffTypes';
import type { MentalRecoverAdditionalBuffEffect } from './mentalRecoverAdditionalBuffTypes';
import type { VoltageUpAdditionalBuffEffect } from './voltageUpAdditionalBuffTypes';
import type { LoveUpAdditionalBuffEffect } from './loveUpAdditionalBuffTypes';
import type {
  DeckSkillCostChangeEffect,
  SkillCostChangeEffect,
  SkillCostConditionType,
} from './skillCostChangeTypes';
export type { SkillCostChangeEffect, SkillCostConditionType } from './skillCostChangeTypes';
import type { TokenCardEffect } from './tokenRequestTypes';
import type { GameCondition } from './conditions/model';
import type { ModeChange } from './live/modes';
import type { MemberId, TokenKind, UnitId } from './model';
import type { StopVoltageIncreaseEffect, VoltageConvertEffect } from './voltageConversionTypes';
import type { Action52BuffEffect } from './skillBoostTypes';
import type { MentalHeartInduceEffect } from './mentalHeartInduceTypes';
import type { AdditionalHeartInduceEffect } from './additionalHeartTypes';
import type { ProxyForcedActivationEffect, ProxySkillEffect } from './proxySkillTypes';
import type { MoodChangeSkillEffect } from './moodChangeSkillTypes';
import type { BeatHeartValueBuffEffect } from './beatHeartValueBuffTypes';
import type { HeartLimitBoostEffect } from './heartLimitBoostTypes';
import type { MoodValueBoostEffect } from './moodValueBoostTypes';
import type { GenesisSkillEffect } from './genesisSkillTypes';
import type { AddSpecialAppealTokenEffect } from './specialAppealTokenTypes';
import type { HandMaxCardEffect } from './handMaxCardTypes';
import type { MentalShieldEffect } from './mentalShieldTypes';
import type { FixedParameterExtendEffect } from './fixedParameterExtendTypes';
import type { BeatPointBuffEffect } from './beatPointBuffTypes';
import type { RecoverMentalSkillEffect } from './recoverMentalSkillTypes';
import type { GaugeRegenerationEffect } from './gaugeRegenerationTypes';
export type { GaugeRegeneration, GaugeRegenerationEffect } from './gaugeRegenerationTypes';
export type { ProxySkillEffect } from './proxySkillTypes';
export type MoodBonus = Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
export type GaugeInfinity = Readonly<{
  gauge: 'ap' | 'voltage' | 'mental';
  remainingSeconds: number | null;
  remainingSections: number | null;
  suspended: boolean;
  deactivationKey: string | null;
}>;
type InfinityGaugeEffect = Readonly<{
  kind: 'infinity-gauge';
  gauge: 'ap' | 'voltage' | 'mental';
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  invocationType?: number;
  deactivationKey?: string;
}>;
type GaugeEffect = InfinityGaugeEffect | GaugeRegenerationEffect | MentalBarrierEffect;
export type MentalBarrier = Readonly<{
  kind: 'endurance' | 'attenuation';
  endurance: number;
  currentEndurance: number;
  attenuation: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey?: string | null;
}>;
export type MentalBarrierEffect = Readonly<{
  kind: 'mental-barrier';
  barrier: 'endurance' | 'attenuation';
  enduranceType: 'ratio' | 'fixed' | 'infinite';
  endurance: number;
  attenuation: number;
  deactivationKey?: string;
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
  deactivationKey: string | null;
}>;
type EffectShape =
  | Readonly<{
      kind: 'branch';
      condition: GameCondition;
      whenTrue: readonly Effect[];
      whenFalse: readonly Effect[];
    }>
  | Readonly<{ kind: 'hearts'; amount: number; moodBonus?: MoodBonus; lifetimeSeconds?: number }>
  | RecoverMentalSkillEffect
  | Readonly<{
      kind: 'beat-hearts' | 'energy' | 'stamina' | 'excitement';
      amount: number;
      moodBonus?: MoodBonus;
    }>
  | Readonly<{
      kind: 'boost';
      multiplier: number;
      moodBonus?: MoodBonus;
      deactivationKey?: string;
    }>
  | Readonly<{
      kind: 'amplify';
      percent: number;
      moodBonus?: MoodBonus;
      members?: readonly MemberId[];
      duration?: 'section';
      deactivationKey?: string;
    }>
  | Readonly<{ kind: 'mood'; amount: number }>
  | MoodChangeSkillEffect
  | Readonly<{
      kind: 'conditional';
      condition: 'happy100' | 'mellow100' | 'mental0' | 'deck80' | 'first-section' | 'last-section';
      effects: readonly Effect[];
    }>
  | InduceEffect
  | Readonly<{ kind: 'tokens'; token: TokenKind; count: number; seriesIds?: readonly number[] }>
  | Readonly<{ kind: 'ingame-mission'; groupId: number }>
  | Readonly<{
      kind: 'token-deck-split';
      seriesIds: readonly number[] | null;
      duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
      invocationType?: number;
      deactivationKey?: string;
    }>
  | Readonly<{
      kind: 'token-boost';
      calculation: TokenBoost['calculation'];
      num: number;
      addValue?: number;
      target: TokenBoostTarget;
      seriesIds?: readonly number[];
      uses?: number;
      duration?: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
      invocationType?: number;
      deactivationKey?: string;
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
  | SkillCooldownEffectInput
  | InduceSkillEffectInput
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
  | AdditionalHeartInduceEffect
  | TokenCardEffect
  | ComboInduceEffect
  | Action52BuffEffect
  | ResetSpecial
  | Readonly<{ kind: 'voltage-limit'; amount: number }>
  | Readonly<{ kind: 'voltage-tier'; step: 100 | 200; tiers: readonly (readonly Effect[])[] }>
  | Readonly<{ kind: 'protect-mental'; duration?: 'section' }>
  | DisableMentalDownEffect
  | Readonly<{ kind: 'beat-count'; amount: number }>
  | BeatHeartValueBuffEffect
  | BeatPointBuffEffect
  | HeartBoostEffect
  | HeartLimitBoostEffect
  | MoodValueBoostEffect
  | GenesisSkillEffect
  | AddSpecialAppealTokenEffect
  | HandMaxCardEffect
  | LoveUpAdditionalBuffEffect
  | VoltageUpAdditionalBuffEffect
  | MentalRecoverAdditionalBuffEffect
  | MentalBarrierAdditionalBuffEffect
  | MentalShieldEffect
  | FixedParameterExtendEffect
  | Readonly<{
      kind: 'cost-reduction';
      amount: number;
      target:
        | Readonly<{ kind: 'unit'; unit: UnitId }>
        | Readonly<{ kind: 'token'; token: TokenKind }>;
    }>
  | SkillCostChangeEffect
  | ParameterValueChangeEffect
  | DeckSkillCostChangeEffect
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
  Readonly<{ parameterDetails?: Readonly<Record<string, ParameterDetailValue>> }>;
