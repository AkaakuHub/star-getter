import type { Card, GameState } from '../model';
import { applyEffect } from '../effects';
import { moodValue } from '../projection';

export function applyUseAbility(state: GameState, card: Card): GameState {
  let next = state;
  const count = state.cardUseCounts[card.id] ?? 0;
  if (card.useAbility === 'story-boost') {
    const size = state.deck.length;
    const percent =
      size >= 100
        ? 1001
        : size >= 80
          ? 700
          : size >= 60
            ? 500
            : size >= 40
              ? 300
              : size >= 20
                ? 200
                : 100;
    next = {
      ...next,
      storyAmplification: Math.fround(
        next.storyAmplification + percent + Math.max(0, moodValue(next)) * percent * 0.005,
      ),
    };
  }
  if (card.useAbility === 'aurora')
    next = applyEffect(next, { kind: 'set-energy', amount: 0 }, card);
  if (card.useAbility === 'icy-sayaka' && count === 1)
    next = applyEffect(next, { kind: 'tokens', token: 'shadow', count: 1 }, card);
  if (card.useAbility === 'class' && count === 3)
    next = applyEffect(next, { kind: 'reset-special', normalOnly: true }, card);
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
  const listeners = state.deck.filter(
    (card) => state.hand.includes(card.id) && card.handUse?.unit === used.unit,
  );
  return listeners.reduce(
    (next, card) =>
      (card.handUse?.effects ?? []).reduce(
        (current, effect) => applyEffect(current, effect, card),
        next,
      ),
    state,
  );
}
