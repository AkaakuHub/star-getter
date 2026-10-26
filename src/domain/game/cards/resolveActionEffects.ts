import type { Card } from './cardTypes';
import { resolveActionEffect } from './resolveActionEffect';
import { createDrawSuccessInduceEffect } from '../actionTypeEffects/drawSuccessInduce';
import { createOnDrawInduceRule } from '../actionTypeEffects/onDrawInduce';
import { createHandInducer } from '../actionTypeEffects/handInduce';
import { resolveHandPermanentEffects } from '../actionTypeEffects/handPermanent';

export function resolveActionEffects(card: Card): Card {
  if (!card.actionEffects?.length) return card;
  const { actionEffects, ...resolved } = card;
  let effects = [...resolved.effects];
  let handPermanentEffects = [...(resolved.handPermanentEffects ?? [])];
  let ability893Effects = [...(resolved.ability893Effects ?? [])];
  let drawEffects = [...(resolved.drawEffects ?? [])];
  let drawRules = [...(resolved.drawRules ?? [])];
  let handInducers = [...(resolved.handInducers ?? [])];
  let modeIds = [...(resolved.modeIds ?? [])];
  let modeParameterChanges = resolved.modeParameterChanges;
  let modeSkillChanges = resolved.modeSkillChanges;
  let modeAbilityChanges = resolved.modeAbilityChanges;
  for (const actionEffect of actionEffects) {
    if (actionEffect.actionType === 36) {
      modeIds = [...modeIds, ...(actionEffect.modeIds ?? [])];
      modeParameterChanges = actionEffect.modeParameterChanges ?? modeParameterChanges;
      modeSkillChanges = actionEffect.modeSkillChanges ?? modeSkillChanges;
      modeAbilityChanges = actionEffect.modeAbilityChanges ?? modeAbilityChanges;
      continue;
    }
    if (actionEffect.actionType === 901) {
      ability893Effects.push(createDrawSuccessInduceEffect(actionEffect));
      continue;
    }
    if (actionEffect.actionType === 902) {
      drawRules.push(createOnDrawInduceRule(actionEffect));
      continue;
    }
    if (actionEffect.actionType === 903) {
      handInducers.push(createHandInducer(actionEffect));
      continue;
    }
    if (actionEffect.actionType === 904) {
      handPermanentEffects.push(...resolveHandPermanentEffects(actionEffect));
      continue;
    }
    const effect = resolveActionEffect(actionEffect);
    if (actionEffect.destination === 'effects') effects.push(effect);
    else handPermanentEffects.push(effect);
  }
  return {
    ...resolved,
    effects,
    ...(modeIds.length > 0 ? { modeIds } : {}),
    ...(modeParameterChanges ? { modeParameterChanges } : {}),
    ...(modeSkillChanges ? { modeSkillChanges } : {}),
    ...(modeAbilityChanges ? { modeAbilityChanges } : {}),
    ...(handPermanentEffects.length > 0 ? { handPermanentEffects } : {}),
    ...(ability893Effects.length > 0 ? { ability893Effects } : {}),
    ...(drawEffects.length > 0 ? { drawEffects } : {}),
    ...(drawRules.length > 0 ? { drawRules } : {}),
    ...(handInducers.length > 0 ? { handInducers } : {}),
  };
}
