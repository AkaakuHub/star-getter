import type { Card } from './cardTypes';
import { createHandCardCountEffect } from '../actionTypeEffects/handCardCount';
import { createApSpeedChangeEffect } from '../actionTypeEffects/apSpeedChange';
import { createVoltageConvertEffect } from '../actionTypeEffects/voltageConvert';
import { createMentalHeartInduceEffect } from '../actionTypeEffects/mentalHeartInduce';
import { createComboInduceEffect } from '../actionTypeEffects/comboInduce';
import { createHeartLimitChangeEffect } from '../actionTypeEffects/heartLimitChange';
import { createDeckSkillCostChangeEffect } from '../actionTypeEffects/deckSkillCostChange';
import { createLoveUpAdditionalBuffEffect } from '../actionTypeEffects/loveUpAdditionalBuff';
import { createVoltageUpAdditionalBuffEffect } from '../actionTypeEffects/voltageUpAdditionalBuff';
import { createMentalRecoverAdditionalBuffEffect } from '../actionTypeEffects/mentalRecoverAdditionalBuff';
import { createMentalBarrierAdditionalBuffEffect } from '../actionTypeEffects/mentalBarrierAdditionalBuff';
import { createDisableMentalDownEffect } from '../actionTypeEffects/disableMentalDown';
import { createChangeModeEffect } from '../actionTypeEffects/changeMode';
import { createVoltageLevelEffect } from '../actionTypeEffects/voltageLevel';

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
            : actionEffect.actionType === 23
              ? createMentalHeartInduceEffect(actionEffect)
              : actionEffect.actionType === 24
                ? createComboInduceEffect({
                    ...actionEffect,
                    effects: actionEffect.childEffects,
                  })
                : actionEffect.actionType === 25
                  ? createHeartLimitChangeEffect({
                      ...actionEffect,
                      details: actionEffect.details.map((detail) => ({
                        ...detail,
                        targetMood: detail.targetMood ?? 0,
                      })),
                    })
                  : actionEffect.actionType === 29
                    ? createDeckSkillCostChangeEffect(actionEffect)
                    : actionEffect.actionType === 30
                      ? createLoveUpAdditionalBuffEffect({
                          ...actionEffect,
                          details: actionEffect.details.map((detail) => ({
                            ...detail,
                            targetMood: detail.targetMood ?? 0,
                          })),
                        })
                      : actionEffect.actionType === 31
                        ? createVoltageUpAdditionalBuffEffect({
                            ...actionEffect,
                            details: actionEffect.details.map((detail) => ({
                              ...detail,
                              targetMood: detail.targetMood ?? 0,
                            })),
                          })
                        : actionEffect.actionType === 32
                          ? createMentalRecoverAdditionalBuffEffect({
                              ...actionEffect,
                              details: actionEffect.details.map((detail) => ({
                                ...detail,
                                targetMood: detail.targetMood ?? 0,
                              })),
                            })
                          : actionEffect.actionType === 33
                            ? createMentalBarrierAdditionalBuffEffect({
                                ...actionEffect,
                                details: actionEffect.details.map((detail) => ({
                                  ...detail,
                                  targetMood: detail.targetMood ?? 0,
                                })),
                              })
                            : actionEffect.actionType === 34
                              ? createDisableMentalDownEffect(actionEffect)
                              : actionEffect.actionType === 35
                                ? createChangeModeEffect(actionEffect)
                                : createVoltageLevelEffect(actionEffect);
    if (actionEffect.destination === 'effects') effects.push(effect);
    else handPermanentEffects.push(effect);
  }
  return {
    ...resolved,
    effects,
    ...(handPermanentEffects.length > 0 ? { handPermanentEffects } : {}),
  };
}
