import type { Effect } from './modelTypes';
import type { UseCountInduceEffect, UseInduceEffect } from './induceSkillEffectTypes';

export function validateUseInduceEffect(
  effect: UseInduceEffect,
  validateChild: (effect: Effect) => void,
): void {
  if (!effect.sourceEffectId || !Number.isSafeInteger(effect.limit) || !effect.effects.length)
    throw new Error('使用誘発の設定が正しくありません。');
  for (const child of effect.effects) validateChild(child);
}

export function validateUseCountInduceEffect(
  effect: UseCountInduceEffect,
  validateChild: (effect: Effect) => void,
): void {
  if (
    !effect.sourceEffectId ||
    !Number.isSafeInteger(effect.requireCount) ||
    !Number.isSafeInteger(effect.limit) ||
    !effect.effects.length
  )
    throw new Error('使用回数誘発の設定が正しくありません。');
  for (const child of effect.effects) validateChild(child);
}
