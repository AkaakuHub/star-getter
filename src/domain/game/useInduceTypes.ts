import type { Effect } from './modelTypes';
import type { UseCountInduceEffect, UseInduceEffect } from './induceSkillEffectTypes';
import type { CardMoveInduceEffect, EffectInduceEffect } from './induceSkillEffectTypes';

import { isInt64 } from './numeric';

export function validateUseInduceEffect(
  effect: UseInduceEffect,
  validateChild: (effect: Effect) => void,
): void {
  if (!effect.sourceEffectId || !isInt64(effect.limit) || !effect.effects.length)
    throw new Error('使用誘発の設定が正しくありません。');
  for (const child of effect.effects) validateChild(child);
}

export function validateUseCountInduceEffect(
  effect: UseCountInduceEffect,
  validateChild: (effect: Effect) => void,
): void {
  if (
    !effect.sourceEffectId ||
    !isInt64(effect.requireCount) ||
    !isInt64(effect.limit) ||
    !effect.effects.length
  )
    throw new Error('使用回数誘発の設定が正しくありません。');
  for (const child of effect.effects) validateChild(child);
}

export function validateEffectInduceEffect(
  effect: EffectInduceEffect,
  validateChild: (effect: Effect) => void,
): void {
  if (
    !effect.sourceEffectId ||
    !['mental-barrier', 'bonus-score'].includes(effect.target) ||
    !['none', 'at-least', 'at-most'].includes(effect.threshold.kind) ||
    !Number.isFinite(effect.threshold.value) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string') ||
    !effect.effects.length
  )
    throw new Error('効果誘発の設定が正しくありません。');
  for (const child of effect.effects) validateChild(child);
}

export function validateCardMoveInduceEffect(
  effect: CardMoveInduceEffect,
  validateChild: (effect: Effect) => void,
): void {
  if (
    !effect.sourceEffectId ||
    effect.timing !== 'stage-to-graveyard' ||
    !isInt64(effect.limit) ||
    !isInt64(effect.requireCount)
  )
    throw new Error('カード移動誘発の設定が正しくありません。');
  for (const child of effect.effects) validateChild(child);
}
