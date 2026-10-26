import type { DrawProbabilityRule } from './drawProbability';
import type { StarGatherCardAppealParameters } from '../live/clientScoreInput';
import type { PerformerId, MemberId, UnitId, CostumeId, TokenKind } from '../model';
import type { Effect } from '../modelTypes';
import type { MoodBonus, ParameterValueChangeEffect } from '../modelTypes';

type ActionTypeDetail = Readonly<{
  id: bigint;
  detailType: string;
  value: bigint;
  targetMood?: number;
}>;

export type ActionType20Record = Readonly<{
  actionType: 20;
  skillEffectId: bigint;
  details: readonly ActionTypeDetail[];
  destination: 'effects' | 'handPermanentEffects';
  invocationType?: number;
  deactivationKey?: string;
}>;

export type ActionType21Record = Readonly<{
  actionType: 21;
  skillEffectId: bigint;
  details: readonly ActionTypeDetail[];
  destination: 'effects' | 'handPermanentEffects';
  invocationType?: number;
  deactivationKey?: string;
}>;

export type ActionType22Record = Readonly<{
  actionType: 22;
  skillEffectId: bigint;
  details: readonly ActionTypeDetail[];
  destination: 'effects' | 'handPermanentEffects';
  invocationType?: number;
  deactivationKey?: string;
}>;

export type ActionType23Record = Readonly<{
  actionType: 23;
  skillEffectId: bigint;
  details: readonly ActionTypeDetail[];
  destination: 'effects' | 'handPermanentEffects';
  invocationType?: number;
  deactivationKey?: string;
}>;

export type ActionType24Record = Readonly<{
  actionType: 24;
  skillEffectId: bigint;
  details: readonly ActionTypeDetail[];
  childEffects: readonly Effect[];
  destination: 'effects' | 'handPermanentEffects';
  deactivationKey?: string;
}>;

export type HandPermanentEffect = Effect;

export type HandUseTrigger =
  | Readonly<{ kind: 'member'; member: bigint }>
  | Readonly<{ kind: 'skill-icon'; icon: bigint }>
  | Readonly<{ kind: 'unit'; unit: bigint }>
  | Readonly<{ kind: 'heart-quantity-count'; count: bigint }>
  | Readonly<{ kind: 'voltage-increase' | 'section-change' }>
  | Readonly<{ kind: 'same-card' | 'any-skill' }>;

export type ModeSkillVariant = Readonly<{
  cost: number;
  effects: readonly Effect[];
  skillIcon: number | null;
  special: Readonly<{ cost: number; extra: boolean; effects: readonly Effect[] }> | null;
}>;

export type ModeAbilityVariant = Readonly<{
  modeEffects: readonly Effect[];
  ability893Effects: readonly Effect[];
  ability894Effects: readonly Effect[];
}>;

export type Card = Readonly<{
  id: string;
  name: string;
  costume: CostumeId;
  performer: PerformerId;
  member: MemberId;
  unit: UnitId | null;
  mainEffect?: number;
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
  modeSkillChanges?: Readonly<{
    modeId: number;
    off: ModeSkillVariant;
    on: ModeSkillVariant;
  }>;
  modeAbilityChanges?: Readonly<{
    modeId: number;
    off: ModeAbilityVariant;
    on: ModeAbilityVariant;
  }>;
  handPermanentEffects?: readonly HandPermanentEffect[];
  tokenSeriesIds?: readonly number[];
  effects: readonly Effect[];
  actionEffects?: readonly (
    | ActionType20Record
    | ActionType21Record
    | ActionType22Record
    | ActionType23Record
    | ActionType24Record
  )[];
  ability893Effects?: readonly Effect[];
  ability894Effects?: readonly Effect[];
  drawEffects?: readonly Effect[];
  beforeUseEffects?: readonly Effect[];
  handUse?: Readonly<{
    trigger: HandUseTrigger;
    effects: readonly Effect[];
    limit?: bigint;
    limitMemory?: 'reset' | 'retain';
  }>;
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
  collectionEffects?: Readonly<{
    threshold: number;
    effects: readonly Effect[];
    limit?: number;
    limitMemory?: 'reset' | 'retain';
  }>;
  collectionAbility?: 'icy-sayaka' | 'icy-kosuzu';
}>;
