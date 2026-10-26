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
import { createTokenBoostEffect } from '../actionTypeEffects/tokenBoost';
import { createInfinityGaugeEffect } from '../actionTypeEffects/infinityGauge';
import { createUseAllHandEffect } from '../actionTypeEffects/useAllHand';
import { createSwitchTokenDeckEffect } from '../actionTypeEffects/switchTokenDeck';
import { createIngameMissionEffect } from '../actionTypeEffects/ingameMission';
import { createBeatHeartValueEffect } from '../actionTypeEffects/beatHeartValue';
import { createMoodChangeEffect } from '../actionTypeEffects/moodChange';
import { createHeartLimitBoostEffect } from '../actionTypeEffects/heartLimitBoost';
import { createMoodValueBoostEffect } from '../actionTypeEffects/moodValueBoost';
import { createMentalShieldEffect } from '../actionTypeEffects/mentalShield';
import { createGenesisSkillEffect } from '../actionTypeEffects/genesisSkill';
import { createSkillBoostEffect } from '../actionTypeEffects/skillBoost';
import { createHandMaxCardEffect } from '../actionTypeEffects/handMaxCard';
import { createProxyForcedActivationEffect } from '../actionTypeEffects/proxyForcedActivation';
import { createFixedParameterExtendEffect } from '../actionTypeEffects/fixedParameterExtend';
import { createResetSpecialEffect } from '../actionTypeEffects/resetSpecial';
import { createSpecialAppealTokenEffect } from '../actionTypeEffects/specialAppealToken';
import { createAdditionalHeartInduceEffect } from '../actionTypeEffects/additionalHeart';
import { createModeChangeInduceEffect } from '../actionTypeEffects/modeChangeInduce';
import { createProxySkillEffect } from '../actionTypeEffects/proxySkill';
import { createTokenCardEffect } from '../actionTypeEffects/tokenCard';
import { createAddHeartEffect } from '../actionTypeEffects/addHeart';
import { createSkillCooldownEffect } from '../actionTypeEffects/skillCooldown';
import { createInduceSkillEffect } from '../actionTypeEffects/induceSkillEffect';

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
    const effect =
      actionEffect.actionType === 1
        ? createAddHeartEffect(actionEffect)
        : actionEffect.actionType === 20
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
                    : actionEffect.actionType === 27
                      ? createAdditionalHeartInduceEffect(actionEffect)
                      : actionEffect.actionType === 28
                        ? createTokenCardEffect(actionEffect)
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
                                      : actionEffect.actionType === 37
                                        ? createVoltageLevelEffect(actionEffect)
                                        : actionEffect.actionType === 38
                                          ? createTokenBoostEffect(actionEffect)
                                          : actionEffect.actionType === 39
                                            ? createInfinityGaugeEffect(actionEffect)
                                            : actionEffect.actionType === 40
                                              ? createSkillCooldownEffect(actionEffect)
                                              : actionEffect.actionType === 41
                                                ? createInduceSkillEffect({
                                                    ...actionEffect,
                                                    effects: actionEffect.childEffects,
                                                  })
                                                : actionEffect.actionType === 42
                                                  ? createUseAllHandEffect(actionEffect)
                                                  : actionEffect.actionType === 43
                                                    ? createSwitchTokenDeckEffect(actionEffect)
                                                    : actionEffect.actionType === 44
                                                      ? createIngameMissionEffect(actionEffect)
                                                      : actionEffect.actionType === 53
                                                        ? createSpecialAppealTokenEffect(
                                                            actionEffect,
                                                          )
                                                        : actionEffect.actionType === 45
                                                          ? createModeChangeInduceEffect({
                                                              ...actionEffect,
                                                              effects: actionEffect.childEffects,
                                                            })
                                                          : actionEffect.actionType === 46
                                                            ? createProxySkillEffect({
                                                                ...actionEffect,
                                                                effects: actionEffect.childEffects,
                                                              })
                                                            : actionEffect.actionType === 47
                                                              ? createBeatHeartValueEffect({
                                                                  ...actionEffect,
                                                                  details: actionEffect.details.map(
                                                                    (detail) => ({
                                                                      ...detail,
                                                                      targetMood:
                                                                        detail.targetMood ?? 0,
                                                                    }),
                                                                  ),
                                                                })
                                                              : actionEffect.actionType === 48
                                                                ? createMoodChangeEffect(
                                                                    actionEffect,
                                                                  )
                                                                : actionEffect.actionType === 49
                                                                  ? createHeartLimitBoostEffect({
                                                                      ...actionEffect,
                                                                      details:
                                                                        actionEffect.details.map(
                                                                          (detail) => ({
                                                                            ...detail,
                                                                            targetMood:
                                                                              detail.targetMood ??
                                                                              0,
                                                                          }),
                                                                        ),
                                                                    })
                                                                  : actionEffect.actionType === 50
                                                                    ? createMoodValueBoostEffect({
                                                                        ...actionEffect,
                                                                        details:
                                                                          actionEffect.details.map(
                                                                            (detail) => ({
                                                                              ...detail,
                                                                              targetMood:
                                                                                detail.targetMood ??
                                                                                0,
                                                                            }),
                                                                          ),
                                                                      })
                                                                    : actionEffect.actionType === 51
                                                                      ? createGenesisSkillEffect(
                                                                          actionEffect,
                                                                        )
                                                                      : actionEffect.actionType ===
                                                                          52
                                                                        ? createSkillBoostEffect({
                                                                            ...actionEffect,
                                                                            details:
                                                                              actionEffect.details.map(
                                                                                (detail) => ({
                                                                                  ...detail,
                                                                                  targetMood:
                                                                                    detail.targetMood ??
                                                                                    0,
                                                                                }),
                                                                              ),
                                                                          })
                                                                        : actionEffect.actionType ===
                                                                            54
                                                                          ? createHandMaxCardEffect(
                                                                              {
                                                                                skillEffectId:
                                                                                  actionEffect.skillEffectId,
                                                                                details:
                                                                                  actionEffect.details,
                                                                              },
                                                                            )
                                                                          : actionEffect.actionType ===
                                                                              55
                                                                            ? createResetSpecialEffect(
                                                                                actionEffect,
                                                                              )
                                                                            : actionEffect.actionType ===
                                                                                56
                                                                              ? createMentalShieldEffect(
                                                                                  {
                                                                                    ...actionEffect,
                                                                                    details:
                                                                                      actionEffect.details.map(
                                                                                        (
                                                                                          detail,
                                                                                        ) => ({
                                                                                          ...detail,
                                                                                          targetMood:
                                                                                            detail.targetMood ??
                                                                                            0,
                                                                                        }),
                                                                                      ),
                                                                                  },
                                                                                )
                                                                              : actionEffect.actionType ===
                                                                                  57
                                                                                ? createProxyForcedActivationEffect(
                                                                                    actionEffect,
                                                                                  )
                                                                                : actionEffect.actionType ===
                                                                                    58
                                                                                  ? createFixedParameterExtendEffect(
                                                                                      actionEffect,
                                                                                    )
                                                                                  : assertNever(
                                                                                      actionEffect,
                                                                                    );
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

function assertNever(value: never): never {
  throw new Error(`未対応のActionTypeです: ${String(value)}`);
}
