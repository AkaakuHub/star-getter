import type { Card, GameState } from './model';
import { applyEffect } from './effects';
import { spendEnergy } from './resources';
import { flushDeckActions } from './cards/boardActions';
import { fillHand } from './cards/drawing';

export function specialCards(state: GameState): readonly Card[] {
  return state.deck.filter((card, index) => card.special && (index === 0 || card.special.extra));
}

export function specialCost(card: Card): number {
  if (!card.special) throw new Error('共鳴の効果がありません。');
  return card.special.cost;
}

export function isBloomSpecial(card: Card): boolean {
  return card.special?.effects.some((effect) => effect.kind === 'bloom') ?? false;
}

export function canUseSpecial(state: GameState, cardId: string): boolean {
  const card = specialCards(state).find((item) => item.id === cardId);
  return Boolean(
    card?.special &&
    (state.phase === 'playing' || state.phase === 'paused') &&
    !state.resting &&
    !state.specialUsed.includes(cardId) &&
    (state.bloom || state.energy >= specialCost(card)),
  );
}

export function hasAvailableSpecial(state: GameState): boolean {
  return specialCards(state).some((card) => canUseSpecial(state, card.id));
}

export function specialButtonCard(state: GameState): Card | undefined {
  const cards = specialCards(state);
  return (
    cards.find((card) => canUseSpecial(state, card.id)) ??
    cards.find((card) => !state.specialUsed.includes(card.id)) ??
    cards[0]
  );
}

export function useSpecial(state: GameState, cardId: string): GameState {
  if (state.phase !== 'playing' || !canUseSpecial(state, cardId)) return state;
  const card = specialCards(state).find((item) => item.id === cardId);
  if (!card?.special) throw new Error('共鳴のカードがありません。');
  let next = spendEnergy(state, specialCost(card));
  for (const effect of card.special.effects) next = applyEffect(next, effect, card);
  return fillHand(
    flushDeckActions({
      ...next,
      specialUsed: [...next.specialUsed.filter((id) => id !== cardId), cardId],
      stats: { ...next.stats, specialsUsed: next.stats.specialsUsed + 1 },
    }),
  );
}
