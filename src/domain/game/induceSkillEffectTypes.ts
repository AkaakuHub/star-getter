export type InduceSkillCondition = 'voltage' | 'mental-recover' | 'mental-barrier';

export type UseInduceEffect = Readonly<{
  kind: 'use-induce';
  sourceEffectId: string;
  limit: bigint;
  effects: readonly import('./modelTypes').Effect[];
}>;

export type UseCountInduceEffect = Readonly<{
  kind: 'use-count-induce';
  sourceEffectId: string;
  requireCount: bigint;
  limit: bigint;
  effects: readonly import('./modelTypes').Effect[];
}>;

export type EffectInduceEffect = Readonly<{
  kind: 'effect-induce';
  sourceEffectId: string;
  target: 'mental-barrier' | 'bonus-score';
  threshold: Readonly<{ kind: 'none' | 'at-least' | 'at-most'; value: number }>;
  effects: readonly import('./modelTypes').Effect[];
}>;

export type CardMoveInduceEffect = Readonly<{
  kind: 'card-move-induce';
  sourceEffectId: string;
  timing: 'stage-to-graveyard';
  limit: number;
  requireCount: number;
  effects: readonly import('./modelTypes').Effect[];
}>;

export type InduceEffect =
  | EffectInduceEffect
  | CardMoveInduceEffect
  | UseCountInduceEffect
  | UseInduceEffect;

export type ActiveEffectInducer = Readonly<{
  sourceCardId: string;
  sourceEffectId: string;
  target: EffectInduceEffect['target'];
  threshold: EffectInduceEffect['threshold'];
  effects: EffectInduceEffect['effects'];
  active: boolean;
}>;

export type ActiveCardMoveInducer = Readonly<{
  sourceCardId: string;
  sourceEffectId: string;
  timing: CardMoveInduceEffect['timing'];
  limit: number;
  requireCount: number;
  effects: CardMoveInduceEffect['effects'];
  useCount: number;
  activatedCount: number;
}>;

export type InduceSkillEffectInput = Readonly<{
  kind: 'induce-skill-effect';
  condition: InduceSkillCondition;
  num: number;
  deckUnderAdd: number;
  deckOverAdd: number;
  deckUnderLimit: number;
  deckOverLimit: number;
  deckCardMax: number;
  effects: readonly Readonly<{ actionType: number; effect: import('./modelTypes').Effect }>[];
  duration:
    | Readonly<{ kind: 'stage' }>
    | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
  invocationType?: number;
  deactivationKey?: string;
}>;

export type InducedSkillEffect = Readonly<{
  id: number;
  condition: InduceSkillCondition;
  num: number;
  deckUnderAdd: number;
  deckOverAdd: number;
  deckUnderLimit: number;
  deckOverLimit: number;
  deckCardMax: number;
  addValue: number;
  multiplier: number;
  effects: InduceSkillEffectInput['effects'];
  remainingSeconds: number | null;
  remainingSections: number | null;
  sourceCardId: string | null;
  deactivationKey: string | null;
}>;

export function validateInduceSkillEffect(effect: InduceSkillEffectInput): void {
  const validDuration =
    effect.duration.kind === 'stage' ||
    (Number.isSafeInteger(effect.duration.value) &&
      effect.duration.value >= (effect.duration.kind === 'sections' ? 1 : 0));
  if (
    !['voltage', 'mental-recover', 'mental-barrier'].includes(effect.condition) ||
    !Number.isSafeInteger(effect.num) ||
    !Number.isSafeInteger(effect.deckUnderAdd) ||
    !Number.isSafeInteger(effect.deckOverAdd) ||
    !Number.isSafeInteger(effect.deckUnderLimit) ||
    effect.deckUnderLimit < 0 ||
    !Number.isSafeInteger(effect.deckOverLimit) ||
    effect.deckOverLimit < 0 ||
    !Number.isSafeInteger(effect.deckCardMax) ||
    effect.deckCardMax < 1 ||
    !validDuration ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('誘発スキル効果の設定が正しくありません。');
}
