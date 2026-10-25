import type { Card, Effect, GameState } from '../model';

export function applySpecialReset(
  state: GameState,
  effect: Extract<Effect, { kind: 'reset-special' }>,
  sourceCard?: Card,
): GameState {
  return {
    ...state,
    specialUsed: state.specialUsed.filter((id) => {
      const card = state.deck.find((item) => item.id === id);
      if (!card?.special || card.token !== undefined) return true;
      if (effect.scope === 'normal' && card.special.extra) return true;
      if (effect.scope === 'extra' && !card.special.extra) return true;
      const matchesTarget =
        effect.target.kind === 'all' ||
        (effect.target.kind === 'source' && card.id === sourceCard?.id) ||
        (effect.target.kind === 'others' && card.id !== sourceCard?.id) ||
        (effect.target.kind === 'member' && card.member === effect.target.member) ||
        (effect.target.kind === 'unit' && card.unit === effect.target.unit);
      return !matchesTarget || card.id === sourceCard?.id;
    }),
  };
}
