import { applyCostReduction } from '../cards/cost';
import { addSkillCostChange } from '../cards/skillCostChanges';
import type { Card, Effect, GameState } from '../model';
import { applyParameterValueChange } from './parameterValueChange';
import { applyDeckSkillCostChange } from '../cards/deckSkillCostChange';

type ParameterEffect = Extract<
  Effect,
  {
    kind:
      | 'cost-reduction'
      | 'skill-cost-change'
      | 'parameter-value-change'
      | 'deck-skill-cost-change';
  }
>;

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
  }
}
