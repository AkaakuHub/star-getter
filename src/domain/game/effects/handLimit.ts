import type { Card, GameState } from '../model';
import { skillValue } from './skillValue';

export function applyHandLimit(
  state: GameState,
  baseAmount: number,
  card: Card | undefined,
  multiplier: number,
): GameState {
  const amount = Math.trunc(
    Math.fround(
      skillValue(state, baseAmount, { kind: 'hand-limit', amount: baseAmount }, card) * multiplier,
    ),
  );
  const activation = state.activation;
  return {
    ...state,
    handLimit: state.handLimit + amount,
    ...(activation && card && amount !== 0
      ? {
          activation: {
            ...activation,
            handCountChanges: { ...activation.handCountChanges, [card.id]: amount },
          },
        }
      : {}),
  };
}
