import { applyCostReduction } from '../cards/cost';
import { addSkillCostChange } from '../cards/skillCostChanges';
import type { Card, Effect, GameState } from '../model';
import {
  applyParameterValueChange,
  resolveParameterDetailInteger,
  resolveParameterDetailValue,
} from './parameterValueChange';

type ParameterEffect = Extract<
  Effect,
  { kind: 'cost-reduction' | 'skill-cost-change' | 'parameter-value-change' }
>;

export function applyParameterEffect(
  state: GameState,
  effect: ParameterEffect,
  card: Card | undefined,
  multiplier: number,
): GameState {
  const detailValue = (key: string, fallback: number) =>
    resolveParameterDetailValue(state, card, effect, key, fallback);
  switch (effect.kind) {
    case 'cost-reduction':
      return applyCostReduction(state, { ...effect, amount: detailValue('amount', effect.amount) });
    case 'skill-cost-change':
      return addSkillCostChange(
        state,
        {
          ...effect,
          amount: detailValue('amount', effect.amount),
          minimum: detailValue('minimum', effect.minimum),
          maximum: detailValue('maximum', effect.maximum),
          ...(effect.addValue !== undefined
            ? { addValue: detailValue('addValue', effect.addValue) }
            : {}),
        },
        card,
        multiplier,
      );
    case 'parameter-value-change': {
      const baseEffect = {
        ...effect,
        base: detailValue('base', effect.base),
        increment: detailValue('increment', effect.increment),
        targetDetailId: resolveParameterDetailInteger(
          state,
          card,
          effect,
          'targetDetailId',
          effect.targetDetailId,
        ),
        ...(effect.values
          ? {
              values: effect.values.map((value, index) => detailValue(`values.${index}`, value)),
            }
          : {}),
      };
      return applyParameterValueChange(state, card, baseEffect);
    }
  }
}
