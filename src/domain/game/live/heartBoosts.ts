import type { Card, Effect, GameState } from '../model';
import type { HeartBoostState } from '../modelTypes';
import { skillValue } from '../effects/skillValue';

export function addHeartBoost(
  state: GameState,
  effect: Extract<Effect, { kind: 'heart-boost' }>,
  card: Card | undefined,
  multiplier: number,
): GameState {
  return {
    ...state,
    heartBoosts: [
      ...state.heartBoosts,
      {
        percent: Math.trunc(
          Math.fround(skillValue(state, effect.percent, effect, card) * multiplier),
        ),
        uses: effect.uses,
        target: effect.target ?? { kind: 'all' },
        remainingSeconds:
          effect.duration === undefined
            ? 0
            : effect.duration.kind === 'milliseconds'
              ? Math.fround(effect.duration.value / 1000)
              : null,
        remainingSections: effect.duration?.kind === 'sections' ? effect.duration.value : null,
      },
    ],
  };
}

export function consumeHeartBoosts(
  state: GameState,
  card: Card | undefined,
  base: number,
): Readonly<{ state: GameState; percent: number }> {
  const matching = state.heartBoosts.filter((boost) => {
    if (base <= 0) return false;
    if (boost.target.kind === 'all') return true;
    if (!card) return false;
    if (boost.target.kind === 'member') return card.member === boost.target.member;
    if (boost.target.kind === 'unit') return card.unit === boost.target.unit;
    return card.tokenSeriesIds?.includes(boost.target.seriesId) ?? false;
  });
  const matchingSet = new Set(matching);
  return {
    state: {
      ...state,
      heartBoosts: state.heartBoosts.flatMap((boost) => {
        if (!matchingSet.has(boost)) return [boost];
        return boost.uses > 1 ? [{ ...boost, uses: boost.uses - 1 }] : [];
      }),
    },
    percent: matching.reduce((total, boost) => Math.fround(total + boost.percent), 0),
  };
}

export function advanceHeartBoosts(state: GameState, elapsedSeconds: number): GameState {
  return {
    ...state,
    heartBoosts: state.heartBoosts.flatMap((boost) => {
      if (boost.remainingSeconds === null) return [boost];
      const remainingSeconds = Math.fround(boost.remainingSeconds - Math.fround(elapsedSeconds));
      return remainingSeconds > 0 ? [{ ...boost, remainingSeconds }] : [];
    }),
  };
}

export function expireSectionHeartBoosts(
  boosts: readonly HeartBoostState[],
): readonly HeartBoostState[] {
  return boosts.flatMap((boost) => {
    if (boost.remainingSections === null) return [boost];
    const remainingSections = boost.remainingSections - 1;
    return remainingSections > 0 ? [{ ...boost, remainingSections }] : [];
  });
}
