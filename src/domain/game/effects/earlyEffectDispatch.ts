import type { Card, Effect, GameState } from '../model';
import { activateMoodChangeSkill } from './moodChangeSkill';
import { activateGenesisSkill } from './genesisSkill';
import { activateSpecialAppealToken } from './specialAppealToken';
import { forceProxySkillActivation, registerProxySkill } from './proxySkill';

export function dispatchEarlyEffect(
  state: GameState,
  effect: Effect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
  effectPower: number,
): GameState | undefined {
  if (effect.kind === 'proxy-skill-forced-activation')
    return forceProxySkillActivation(state, effect.targetType);
  if (effect.kind === 'proxy-skill') return registerProxySkill(state, effect, card);
  if (effect.kind === 'mood-change-skill')
    return activateMoodChangeSkill(state, effect, card, multiplier, addValue, effectPower);
  if (effect.kind === 'genesis-skill') return activateGenesisSkill(state, effect, card);
  if (effect.kind === 'special-appeal-token') return activateSpecialAppealToken(state, effect);
  return undefined;
}
