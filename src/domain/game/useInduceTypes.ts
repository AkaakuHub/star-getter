import type { Effect } from './modelTypes';
import type { UseInduceEffect } from './induceSkillEffectTypes';

export function validateUseInduceEffect(
  effect: UseInduceEffect,
  validateChild: (effect: Effect) => void,
): void {
  if (
    !effect.sourceEffectId ||
    !Number.isSafeInteger(effect.limit) ||
    effect.limit < 0 ||
    !effect.effects.length
  )
    throw new Error('使用誘発の設定が正しくありません。');
  for (const child of effect.effects) validateChild(child);
}
