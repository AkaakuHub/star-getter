import { finalizeStarGatherSkillCost } from '../live/skillCost';
import type { Card, Effect, GameState } from '../model';

export function cardCost(state: GameState, card: Card): number {
  if (!card.allHandCost)
    return finalizeStarGatherSkillCost(card.cost, -(state.costReductions[card.id] ?? 0));
  const total = state.hand.reduce((sum, id) => {
    const other = state.deck.find((item) => item.id === id);
    return sum + (other && other.id !== card.id && !other.allHandCost ? cardCost(state, other) : 0);
  }, 0);
  if (card.allHandCost === 'sum') return Math.max(0, total - (state.costReductions[card.id] ?? 0));
  const reductions = [
    [0, 5],
    [20, 5],
    [40, 10],
    [60, 10],
    [80, 20],
    [100, 50],
  ] as const;
  const reduction = reductions.reduce(
    (sum, [minimum, amount]) => sum + (state.deck.length >= minimum ? amount : 0),
    0,
  );
  return Math.max(0, total - reduction - (state.costReductions[card.id] ?? 0));
}

export function applyCostReduction(
  state: GameState,
  effect: Extract<Effect, { kind: 'cost-reduction' }>,
): GameState {
  return {
    ...state,
    costReductions: Object.fromEntries(
      state.deck.map((card) => {
        const matches =
          effect.target.kind === 'unit'
            ? card.unit === effect.target.unit
            : card.token === effect.target.token;
        return [card.id, (state.costReductions[card.id] ?? 0) + (matches ? effect.amount : 0)];
      }),
    ),
  };
}
