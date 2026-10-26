import type { Card } from './cardTypes';
import { resolveActionEffect } from './resolveActionEffect';

export function resolveActionEffects(card: Card): Card {
  if (!card.actionEffects?.length) return card;
  const { actionEffects, ...resolved } = card;
  let effects = [...resolved.effects];
  let handPermanentEffects = [...(resolved.handPermanentEffects ?? [])];
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
  };
}
