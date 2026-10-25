import type { Card, Effect, GameState } from '../model';
import { activateMoodChangeSkill } from './moodChangeSkill';
import { activateGenesisSkill } from './genesisSkill';
import { activateSpecialAppealToken } from './specialAppealToken';
import { forceProxySkillActivation, registerProxySkill } from './proxySkill';
import { activateUseCountInduce, activateUseInduce } from './useInduce';
import { activateEffectInduce } from './effectInduce';
import { activateCardMoveInduce } from './cardMoveInduce';
import type { EffectApplier } from './induceSkillEffect';
import { activateHeartLimitBoost } from './heartLimitBoost';
import { activateMoodValueBoost } from './moodValueBoost';
import { activateVoltageConversion } from './voltageConversion';
import { activateBeatPointBuff } from './beatPointBuff';
import { activateRecoverMentalSkill } from './recoverMentalSkill';
import { activateAddVoltageSkill } from './addVoltageSkill';

export function dispatchEarlyEffect(
  state: GameState,
  effect: Effect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
  effectPower: number,
  apply: EffectApplier,
): GameState | undefined {
  if (effect.kind === 'proxy-skill-forced-activation')
    return forceProxySkillActivation(state, effect.targetType);
  if (effect.kind === 'proxy-skill') return registerProxySkill(state, effect, card);
  if (effect.kind === 'mood-change-skill')
    return activateMoodChangeSkill(state, effect, card, multiplier, addValue, effectPower);
  if (effect.kind === 'genesis-skill') return activateGenesisSkill(state, effect, card);
  if (effect.kind === 'special-appeal-token') return activateSpecialAppealToken(state, effect);
  if (effect.kind === 'use-induce') return activateUseInduce(state, effect, card, apply);
  if (effect.kind === 'use-count-induce') return activateUseCountInduce(state, effect, card, apply);
  if (effect.kind === 'effect-induce') return activateEffectInduce(state, effect, card);
  if (effect.kind === 'card-move-induce') return activateCardMoveInduce(state, effect, card);
  if (effect.kind === 'heart-limit-boost')
    return activateHeartLimitBoost(state, effect, multiplier, addValue);
  if (effect.kind === 'mood-value-boost')
    return activateMoodValueBoost(state, effect, card, multiplier, addValue);
  if (effect.kind === 'voltage-convert')
    return activateVoltageConversion(state, effect, card, multiplier, addValue);
  if (effect.kind === 'beat-point-buff')
    return activateBeatPointBuff(state, effect, card, multiplier, addValue);
  if (effect.kind === 'recover-mental-skill')
    return activateRecoverMentalSkill(
      state,
      effect,
      card,
      multiplier,
      addValue,
      effectPower,
      apply,
    );
  if (effect.kind === 'add-voltage-skill')
    return activateAddVoltageSkill(state, effect, card, multiplier, addValue, effectPower, apply);
  return undefined;
}
