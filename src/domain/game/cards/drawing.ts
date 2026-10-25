import { applyDrawAbility } from './drawAbilities';
import { shuffle } from '../deck';
import type { GameState } from '../model';

export function handCapacity(state: GameState): number {
  const penalty = state.deck.reduce(
    (sum, card) => sum + (state.hand.includes(card.id) ? (card.passive?.handLimitDelta ?? 0) : 0),
    0,
  );
  return Math.max(3, Math.min(8, state.handLimit + penalty));
}

export function fillHand(state: GameState): GameState {
  let next = state;

  while (next.hand.length < handCapacity(next)) {
    if (!next.drawPile.length) {
      if (!next.discard.length) break;
      const shuffled = shuffle(next.discard, next.randomSeed);
      next = { ...next, drawPile: shuffled.items, discard: [], randomSeed: shuffled.seed };
    }
    const preferred = next.nextDrawPreference
      ? next.drawPile.find((id) =>
          next.deck.some((card) => card.id === id && card.token === next.nextDrawPreference),
        )
      : undefined;
    const drawn = preferred ?? next.drawPile[0];
    if (!drawn) break;
    next = {
      ...next,
      hand: [...next.hand, drawn],
      drawPile: next.drawPile.filter((id) => id !== drawn),
      relayUsed: next.relayUsed.filter((id) => id !== drawn),
      handHeartCollectCounts: { ...next.handHeartCollectCounts, [drawn]: 0 },
    };
    const card = next.deck.find((item) => item.id === drawn);
    if (!card) throw new Error('引いたカードがありません。');
    next = applyDrawAbility(next, card);
  }
  const limit = handCapacity(next);
  if (next.hand.length > limit) {
    const ordered = [...next.hand].sort(
      (left, right) =>
        Number(Boolean(next.deck.find((card) => card.id === right)?.passive)) -
        Number(Boolean(next.deck.find((card) => card.id === left)?.passive)),
    );
    next = {
      ...next,
      hand: ordered.slice(0, limit),
      discard: [...next.discard, ...ordered.slice(limit)],
    };
  }
  return { ...next, nextDrawPreference: null };
}

export function shuffleHand(state: GameState): GameState {
  const shuffled = shuffle([...state.hand, ...state.drawPile, ...state.discard], state.randomSeed);
  return {
    ...state,
    hand: [],
    drawPile: shuffled.items,
    discard: [],
    randomSeed: shuffled.seed,
    relayUsed: [],
    handHeartCollectCounts: {},
  };
}
