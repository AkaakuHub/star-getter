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
  let next = state;
  const activationCounts = { ...state.handUseActivationCounts };
  for (const card of handEffectCards(state)) {
    const handUse = card.handUse;
    if (!handUse || !handUse.effects.length || !matchesHandUseTrigger(handUse.trigger, card, used))
      continue;
    const activationCount = activationCounts[card.id] ?? 0;
    if (handUse.limit !== undefined && handUse.limit !== 0 && handUse.limit <= activationCount)
      continue;
    next = handUse.effects.reduce((current, effect) => applyEffect(current, effect, card), next);
    activationCounts[card.id] = activationCount + 1;
  }
  return { ...next, handUseActivationCounts: activationCounts };
}

function matchesHandUseTrigger(
  trigger: NonNullable<Card['handUse']>['trigger'],
  source: Card,
  used: Card,
) {
  switch (trigger.kind) {
    case 'member':
      return trigger.member === used.member;
    case 'skill-icon':
      return trigger.icon === used.skillIcon;
    case 'unit':
      return trigger.unit === used.unit;
    case 'same-card':
      return source.id === used.id;
    case 'any-skill':
      return true;
  }
}
