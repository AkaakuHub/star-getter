import type { Card, GameState } from '../model';

export function cardCost(state: GameState, card: Card): number {
  if (card.token !== 'ensemble') return card.cost;
  const total = state.hand.reduce((sum, id) => {
    const other = state.deck.find((item) => item.id === id);
    return sum + (other && other.id !== card.id && other.token !== 'ensemble' ? other.cost : 0);
  }, 0);
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
  return Math.max(0, total - reduction);
}
