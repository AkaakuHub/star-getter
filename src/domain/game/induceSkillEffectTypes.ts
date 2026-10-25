export type InduceSkillCondition = 'voltage' | 'mental-recover' | 'mental-barrier';

export type UseInduceEffect = Readonly<{
  kind: 'use-induce';
  sourceEffectId: string;
  limit: number;
  effects: readonly import('./modelTypes').Effect[];
}>;

export type UseCountInduceEffect = Readonly<{
  kind: 'use-count-induce';
  sourceEffectId: string;
  requireCount: number;
  limit: number;
  effects: readonly import('./modelTypes').Effect[];
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
