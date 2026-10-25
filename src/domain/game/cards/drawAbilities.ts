import type { Card, GameState } from '../model';
import { applyEffect, skillValue } from '../effects';
import { moodValue } from '../projection';

export function applyDrawAbility(state: GameState, card: Card): GameState {
  if (!card.drawAbility) return state;
  const count = state.deck.length;
  const next = state;
  if (card.drawAbility === 'library') {
    const amount =
      count >= 100
        ? 20
        : count >= 80
          ? 16
          : count >= 60
            ? 12
            : count >= 40
              ? 8
              : count >= 20
                ? 4
                : 2;
    return {
      ...state,
      costReductions: state.deck.reduce(
        (costs, item) => {
          if (item.token || item.performer !== 'lumen')
            costs[item.id] = (costs[item.id] ?? 0) + amount;
          return costs;
        },
        { ...state.costReductions },
      ),
    };
  }
  if (card.drawAbility === 'story') {
    const amount =
      count >= 100
        ? 200
        : count >= 80
          ? 160
          : count >= 60
            ? 120
            : count >= 40
              ? 80
              : count >= 20
                ? 40
                : 20;
    return applyEffect(state, { kind: 'beat-hearts', amount }, card);
  }
  if (card.drawAbility === 'bookmark') {
    const amount =
      count >= 100 ? 8 : count >= 80 ? 6 : count >= 60 ? 4 : count >= 40 ? 3 : count >= 20 ? 2 : 1;
    return applyEffect(next, { kind: 'energy', amount }, card);
  }
  const factorRate =
    count >= 100
      ? 2000
      : count >= 80
        ? 5000
        : count >= 60
          ? 7000
          : count >= 40
            ? 8000
            : count >= 20
              ? 9000
              : 9500;
  const reduction = Math.ceil(
    skillValue(state, 10000 - factorRate, { kind: 'energy', amount: 10000 - factorRate }, card),
  );
  const factor = Math.fround(Math.fround(10000 - reduction) / 10000);
  return {
    ...next,
    apIntervalFactor: Math.max(Math.fround(state.apIntervalFactor + Math.fround(factor - 1)), 0),
    storyAmplification:
      count >= 80
        ? Math.fround(state.storyAmplification + 1001 + Math.max(0, moodValue(state)) * 5.005)
        : state.storyAmplification,
  };
}
