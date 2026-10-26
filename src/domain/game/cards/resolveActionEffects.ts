import type { Card, CardSkillVariantMaster, ModeSkillVariant } from './cardTypes';
import { resolveActionEffect } from './resolveActionEffect';
import { createDrawSuccessInduceEffect } from '../actionTypeEffects/drawSuccessInduce';
import { createOnDrawInduceRule } from '../actionTypeEffects/onDrawInduce';
import { createHandInducer } from '../actionTypeEffects/handInduce';
import { resolveHandPermanentEffects } from '../actionTypeEffects/handPermanent';
import { isInt64 } from '../numeric';

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
      const modeId = detailInt32(actionEffect.details, 'MODE_SKILL_CHANGE_MODE_ID');
      const offSeriesId = detailInt32(
        actionEffect.details,
        'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_1',
      );
      const onSeriesId = detailInt32(
        actionEffect.details,
        'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_2',
      );
      const off = resolveCardSkillVariant(
        actionEffect.cardSkillVariants,
        offSeriesId,
        actionEffect.skillType,
        actionEffect.skillLevel,
        actionEffect.specialAppealSkillLevel,
        actionEffect.skillSkillLevel,
      );
      const on = resolveCardSkillVariant(
        actionEffect.cardSkillVariants,
        onSeriesId,
        actionEffect.skillType,
        actionEffect.skillLevel,
        actionEffect.specialAppealSkillLevel,
        actionEffect.skillSkillLevel,
      );
      modeIds = [...modeIds, ...(actionEffect.modeIds ?? []), modeId];
      modeParameterChanges = actionEffect.modeParameterChanges ?? modeParameterChanges;
      modeSkillChanges = {
        modeId,
        off,
        on,
      };
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
    if (effect === null) continue;
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

function resolveCardSkillVariant(
  masters: readonly CardSkillVariantMaster[],
  seriesId: number,
  skillType: number,
  skillLevel: number,
  specialAppealSkillLevel: number,
  skillSkillLevel: number,
): ModeSkillVariant {
  const matches = masters.filter(
    (master) =>
      master.seriesId === seriesId &&
      master.skillType === skillType &&
      master.skillLevel === skillLevel &&
      master.specialAppealSkillLevel === specialAppealSkillLevel &&
      master.skillSkillLevel === skillSkillLevel,
  );
  if (matches.length !== 1) throw new Error('モード切替スキル系列Masterを一意に解決できません。');
  const match = matches[0];
  if (!match) throw new Error('モード切替スキル系列Masterがありません。');
  return match.variant;
}

function detailInt32(
  details: readonly Readonly<{ id: bigint; detailType: string; value: bigint }>[],
  detailType: string,
): number {
  const detail = details.find((item) => item.detailType === detailType);
  if (!detail || !isInt64(detail.id) || !isInt64(detail.value))
    throw new Error('モード切替の詳細値がありません。');
  return Number(BigInt.asIntN(32, detail.value));
}
