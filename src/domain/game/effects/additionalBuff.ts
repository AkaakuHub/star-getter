import type { Card, GameState, ResourceBoost } from '../model';

export function applyAdditionalBuff(
  state: GameState,
  target: ResourceBoost['target'],
  value: number,
  card?: Card,
): Readonly<{ state: GameState; value: number }> {
  const matches = (boost: ResourceBoost) =>
    boost.target === target &&
    (!boost.members || (card !== undefined && boost.members.includes(card.member)));
  const percent = Math.max(
    -100,
    state.resourceBoosts.reduce(
      (sum, boost) => (matches(boost) ? Math.fround(sum + boost.percent) : sum),
      0,
    ),
  );
  return {
    value: Math.fround(value + Math.fround((value * percent) / 100)),
    state: {
      ...state,
      resourceBoosts: state.resourceBoosts.flatMap((boost) =>
        !matches(boost) || boost.uses === null
          ? [boost]
          : boost.uses > 1
            ? [{ ...boost, uses: boost.uses - 1 }]
            : [],
      ),
    },
  };
}
