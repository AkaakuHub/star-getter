import type { GameState } from '../model';
import { flushDeckActions } from './boardActions';
import { fillHand, shuffleHand } from './drawing';

export function finishCardActivation(state: GameState): GameState {
  const activation = state.activation;
  if (!activation) throw new Error('カードの使用処理がありません。');
  const source = state.deck.find((card) => card.id === activation.sourceId);
  if (!source) throw new Error('使用したカードがありません。');
  const children = activation.usedCards.filter((id) => id !== source.id);
  let next = excludeCards(
    state,
    activation.excluded.filter((id) => id !== source.id),
  );
  const activeChildren = children.filter((id) => next.deck.some((card) => card.id === id));
  next = activation.shuffle
    ? shuffleHand({ ...next, drawPile: [...next.drawPile, ...activeChildren] })
    : { ...next, discard: [...next.discard, ...activeChildren] };
  next = flushDeckActions(next);
  next = fillHand({
    ...next,
    lastUsedMember: source.member,
    lastUsedUnit: source.unit,
    drawContext: 'skill',
  });
  next = activation.excluded.includes(source.id)
    ? excludeCards(next, [source.id])
    : { ...next, discard: [...next.discard, source.id] };
  return { ...next, activation: null };
}

function excludeCards(state: GameState, ids: readonly string[]): GameState {
  return {
    ...state,
    deck: state.deck.filter((card) => !ids.includes(card.id)),
    hand: state.hand.filter((id) => !ids.includes(id)),
    drawPile: state.drawPile.filter((id) => !ids.includes(id)),
    discard: state.discard.filter((id) => !ids.includes(id)),
  };
}
