import { applyCostReduction } from '../cards/cost';
import { addSkillCostChange } from '../cards/skillCostChanges';
import type { Card, Effect, GameState } from '../model';
import { applyParameterValueChange } from './parameterValueChange';
import { applyDeckSkillCostChange } from '../cards/deckSkillCostChange';
import { activateLoveUpAdditionalBuff } from '../effects/loveUpAdditionalBuff';
import { activateVoltageUpAdditionalBuff } from '../effects/voltageUpAdditionalBuff';
import { activateMentalRecoverAdditionalBuff } from '../effects/mentalRecoverAdditionalBuff';
import { activateMentalBarrierAdditionalBuff } from '../effects/mentalBarrierAdditionalBuff';

type ParameterEffect = Extract<
  Effect,
  {
    kind:
      | 'cost-reduction'
      | 'skill-cost-change'
      | 'parameter-value-change'
      | 'deck-skill-cost-change'
      | 'love-up-additional-buff'
      | 'voltage-up-additional-buff'
      | 'recover-mental-additional-buff'
      | 'mental-barrier-additional-buff';
  }
>;

export function isParameterEffect(effect: Effect): effect is ParameterEffect {
  return [
    'cost-reduction',
    'skill-cost-change',
    'parameter-value-change',
    'deck-skill-cost-change',
    'love-up-additional-buff',
    'voltage-up-additional-buff',
    'recover-mental-additional-buff',
    'mental-barrier-additional-buff',
  ].includes(effect.kind);
}

export function applyParameterEffect(
  state: GameState,
  effect: ParameterEffect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
): GameState {
  switch (effect.kind) {
    case 'cost-reduction':
      return applyCostReduction(state, effect);
    case 'skill-cost-change':
      return addSkillCostChange(state, effect, card, multiplier);
    case 'parameter-value-change':
      return applyParameterValueChange(state, card, effect);
    case 'deck-skill-cost-change':
      return applyDeckSkillCostChange(state, effect, card, multiplier, addValue);
    case 'love-up-additional-buff':
      return activateLoveUpAdditionalBuff(state, effect, card, multiplier, addValue);
    case 'voltage-up-additional-buff':
      return activateVoltageUpAdditionalBuff(state, effect, card, multiplier, addValue);
    case 'recover-mental-additional-buff':
      return activateMentalRecoverAdditionalBuff(state, effect, card, multiplier, addValue);
    case 'mental-barrier-additional-buff':
      return activateMentalBarrierAdditionalBuff(state, effect, card, multiplier, addValue);
  }
}
