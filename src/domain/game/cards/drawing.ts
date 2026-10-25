import { createRangeRandom } from '../random';
import { drawCandidate, drawWeight } from './drawLottery';
import { disposeHandEffects } from './handEffects';
import { applyDrawAbility } from './drawAbilities';
import { shuffle } from '../deck';
import type { Card, GameState, HandShuffle } from '../model';

export function handCapacity(state: GameState): number {
  const penalty = state.deck.reduce(
    (sum, card) =>
      sum + (state.handEffectCardIds.includes(card.id) ? (card.passive?.handLimitDelta ?? 0) : 0),
    0,
  );
  return Math.max(3, Math.min(8, state.handLimit + penalty));
}

export function fillHand(state: GameState): GameState {
  return drawUntil(state, handCapacity(state));
}

export function fillHandToCount(state: GameState, count: number): GameState {
  return drawUntil(state, count);
}

function drawUntil(state: GameState, count: number): GameState {
  let next = state;
  const drawnCards: Card[] = [];

  while (next.hand.length < count) {
    if (!next.drawPile.length) {
      if (!next.discard.length) break;
      const shuffled = shuffle(next.discard, next.randomSeed);
      next = { ...next, drawPile: shuffled.items, discard: [], randomSeed: shuffled.seed };
    }
    const probability = (id: string) => {
      const card = next.deck.find((item) => item.id === id);
      if (!card) throw new Error('山札のカードがありません。');
      return drawWeight(card, next);
    };
    let candidates = next.drawPile.filter((id) => probability(id) !== 0);
    if (!candidates.length && next.discard.length) {
      const shuffled = shuffle([...next.drawPile, ...next.discard], next.randomSeed);
      next = { ...next, drawPile: shuffled.items, discard: [], randomSeed: shuffled.seed };
      candidates = next.drawPile.filter((id) => probability(id) !== 0);
    }
    const search = next.deckActions.searches.at(-1);
    if (search !== undefined) {
      const matches = candidates.filter((id) =>
        next.deck.some(
          (card) =>
            card.id === id &&
            (search.kind === 'unit' ? card.unit === search.unit : card.token === search.token),
        ),
      );
      if (matches.length) candidates = matches;
      next = {
        ...next,
        deckActions: { ...next.deckActions, searches: next.deckActions.searches.slice(0, -1) },
      };
    }
    const random = createRangeRandom(next.randomSeed);
    const randomIndex = (maximumExclusive: number) => Math.floor(random.range(0, maximumExclusive));
    const drawn =
      drawCandidate(
        candidates.map((id) => ({
          id,
          weight: probability(id),
        })),
        randomIndex,
      ) ?? next.drawPile[randomIndex(next.drawPile.length)];
    if (!drawn) break;
    next = {
      ...next,
      randomSeed: random.seed,
      hand: [...next.hand, drawn],
      drawPile: next.drawPile.filter((id) => id !== drawn),
      relayUsed: next.relayUsed.filter((id) => id !== drawn),
      handHeartCollectCounts: { ...next.handHeartCollectCounts, [drawn]: 0 },
    };
    const card = next.deck.find((item) => item.id === drawn);
    if (!card) throw new Error('引いたカードがありません。');
    drawnCards.push(card);
  }
  for (const card of drawnCards) {
    if (state.drawContext !== 'initial') next = applyDrawAbility(next, card);
    next = {
      ...next,
      handEffectCardIds: [...next.handEffectCardIds.filter((id) => id !== card.id), card.id],
    };
  }
  const maximum = handCapacity(next);
  if (next.hand.length > maximum) {
    const ordered = [...next.hand].sort(
      (left, right) =>
        Number(Boolean(next.deck.find((card) => card.id === right)?.passive)) -
        Number(Boolean(next.deck.find((card) => card.id === left)?.passive)),
    );
    next = {
      ...disposeHandEffects(next, ordered.slice(maximum)),
      hand: ordered.slice(0, maximum),
      discard: [...next.discard, ...ordered.slice(maximum)],
    };
  }
  return { ...next, drawContext: 'idle' };
}

export function shuffleHand(state: GameState, options: HandShuffle): GameState {
  const recovered = options.recoverDiscard ? state.discard : [];
  const returned = options.destination === 'draw' ? state.hand : [];
  const shuffled = shuffle([...state.drawPile, ...recovered, ...returned], state.randomSeed);
  return {
    ...state,
    hand: [],
    handEffectCardIds: state.handEffectCardIds.filter((id) => !state.hand.includes(id)),
    drawPile: shuffled.items,
    discard: [
      ...(options.recoverDiscard ? [] : state.discard),
      ...(options.destination === 'discard' ? state.hand : []),
    ],
    randomSeed: shuffled.seed,
    relayUsed: [],
    handHeartCollectCounts: {},
    drawContext: 'shuffle',
  };
}
