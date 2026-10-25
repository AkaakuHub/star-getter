import type { DrawProbabilityRule } from './drawProbability';
import type { StarGatherCardAppealParameters } from '../live/clientScoreInput';
import type { PerformerId, MemberId, UnitId, CostumeId, TokenKind } from '../model';
import type { Effect } from '../modelTypes';
import type { MoodBonus, ParameterValueChangeEffect } from '../modelTypes';
import type { BeatPointBuffEffect } from '../beatPointBuffTypes';

export type HandPermanentEffect =
  | ParameterValueChangeEffect
  | BeatPointBuffEffect
  | Extract<Effect, { kind: 'hand-limit' }>
  | (Extract<Effect, { kind: 'amplify' }> & Readonly<{ members: readonly MemberId[] }>);

export type HandUseTrigger =
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'skill-icon'; icon: number }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'voltage-increase' | 'section-change' }>
  | Readonly<{ kind: 'same-card' | 'any-skill' }>;

export type ModeSkillVariant = Readonly<{
  cost: number;
  effects: readonly Effect[];
  skillIcon: number | null;
  special: Readonly<{ cost: number; extra: boolean; effects: readonly Effect[] }> | null;
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
  handPermanentEffects?: readonly HandPermanentEffect[];
  tokenSeriesIds?: readonly number[];
  effects: readonly Effect[];
  drawEffects?: readonly Effect[];
  beforeUseEffects?: readonly Effect[];
  handUse?: Readonly<{
    trigger: HandUseTrigger;
    effects: readonly Effect[];
    limit?: number;
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
