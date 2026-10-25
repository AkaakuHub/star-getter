import type { Card, GameState } from '../model';
import { applyEffect } from '../effects';
import { handEffectCards } from './handEffects';

export function applyUseAbility(state: GameState, card: Card): GameState {
  let next = state;
  const count = state.cardUseCounts[card.id] ?? 0;
  if (card.useAbility === 'class' && count === 3)
    next = applyEffect(
      next,
      { kind: 'reset-special', scope: 'normal', target: { kind: 'all' } },
      card,
    );
  if (card.useAbility === 'shadow' && count === 14) {
    next = applyEffect(next, { kind: 'protect-mental' }, card);
    next = applyEffect(
      next,
      { kind: 'stamina', amount: -1000, moodBonus: { target: 3, perPoint: -5 } },
      card,
    );
    next = applyEffect(next, { kind: 'voltage-set', amount: 655000001 }, card);
  }
  if (
    card.exhausts ||
    (card.useAbility === 'class' && count >= 3) ||
    (card.useAbility === 'shadow' && count >= 14)
  ) {
    if (!next.activation) throw new Error('カードの使用処理がありません。');
    next = {
      ...next,
      activation: { ...next.activation, excluded: [...next.activation.excluded, card.id] },
    };
  }
  return next;
}

export function notifyHandSkillUse(state: GameState, used: Card): GameState {
  const listeners = handEffectCards(state).filter((card) => card.handUse?.trigger === used.unit);
  return listeners.reduce(
    (next, card) =>
      (card.handUse?.effects ?? []).reduce(
        (current, effect) => applyEffect(current, effect, card),
        next,
      ),
    state,
  );
}
