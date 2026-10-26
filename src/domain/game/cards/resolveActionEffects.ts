import type { Card } from './cardTypes';
import { createHandCardCountEffect } from '../actionTypeEffects/handCardCount';

export function resolveActionEffects(card: Card): Card {
  if (!card.actionEffects?.length) return card;
  const { actionEffects, ...resolved } = card;
  let effects = [...resolved.effects];
  let handPermanentEffects = [...(resolved.handPermanentEffects ?? [])];
  for (const actionEffect of actionEffects) {
    const effect = createHandCardCountEffect(actionEffect);
    if (actionEffect.destination === 'effects') effects.push(effect);
    else handPermanentEffects.push(effect);
  }
  return {
    ...resolved,
    effects,
    ...(handPermanentEffects.length > 0 ? { handPermanentEffects } : {}),
  };
}
