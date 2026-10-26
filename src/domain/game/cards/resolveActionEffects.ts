import type { Card } from './cardTypes';
import { createHandCardCountEffect } from '../actionTypeEffects/handCardCount';
import { createApSpeedChangeEffect } from '../actionTypeEffects/apSpeedChange';
import { createVoltageConvertEffect } from '../actionTypeEffects/voltageConvert';
import { createMentalHeartInduceEffect } from '../actionTypeEffects/mentalHeartInduce';

export function resolveActionEffects(card: Card): Card {
  if (!card.actionEffects?.length) return card;
  const { actionEffects, ...resolved } = card;
  let effects = [...resolved.effects];
  let handPermanentEffects = [...(resolved.handPermanentEffects ?? [])];
  for (const actionEffect of actionEffects) {
    const effect =
      actionEffect.actionType === 20
        ? createHandCardCountEffect(actionEffect)
        : actionEffect.actionType === 21
          ? createApSpeedChangeEffect({
              ...actionEffect,
              details: actionEffect.details.map((detail) => ({
                ...detail,
                targetMood: detail.targetMood ?? 0,
              })),
            })
          : actionEffect.actionType === 22
            ? createVoltageConvertEffect(actionEffect)
            : createMentalHeartInduceEffect(actionEffect);
    if (actionEffect.destination === 'effects') effects.push(effect);
    else handPermanentEffects.push(effect);
  }
  return {
    ...resolved,
    effects,
    ...(handPermanentEffects.length > 0 ? { handPermanentEffects } : {}),
  };
}
