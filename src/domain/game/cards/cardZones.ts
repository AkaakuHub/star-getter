import type { GameState } from '../model';
import { disposeHandEffects } from './handEffects';
import { flushDeckActions } from './boardActions';
import { fillHand } from './drawing';

export function finishCardActivation(state: GameState): GameState {
  const activation = state.activation;
  if (!activation) throw new Error('カードの使用処理がありません。');
  const source = state.deck.find((card) => card.id === activation.sourceId);
  if (!source) throw new Error('使用したカードがありません。');
  const children = activation.usedCards.filter((id) => id !== source.id);
  let next = excludeCards(
    disposeHandEffects(state, children),
    activation.excluded.filter((id) => id !== source.id),
  );
  const activeChildren = children.filter((id) => next.deck.some((card) => card.id === id));
  next = {
    ...next,
    drawPile: [
      ...next.drawPile,
      ...(activation.recoverDiscard ? next.discard : []),
      ...activeChildren.filter((id) => activation.returnToDraw.includes(id)),
    ],
    discard: [
      ...(activation.recoverDiscard ? [] : next.discard),
      ...activeChildren.filter((id) => !activation.returnToDraw.includes(id)),
    ],
  };
  next = flushDeckActions(next);
  next = fillHand({
    ...next,
    lastUsedMember: source.member,
    lastUsedUnit: source.unit,
    lastUsedSkillIcon: source.skillIcon ?? null,
    drawContext: 'skill',
  });
  next = disposeHandEffects(next, [source.id]);
  next = activation.excluded.includes(source.id)
    ? excludeCards(next, [source.id])
    : activation.returnToDraw.includes(source.id)
      ? { ...next, drawPile: [...next.drawPile, source.id] }
      : { ...next, discard: [...next.discard, source.id] };
  return { ...next, activation: null };
}

function excludeCards(state: GameState, ids: readonly string[]): GameState {
  return {
    ...state,
    deck: state.deck.filter((card) => !ids.includes(card.id)),
    handCardStats: Object.fromEntries(
      Object.entries(state.handCardStats).filter(([id]) => !ids.includes(id)),
    ),
    parameterValueFactors: state.parameterValueFactors.filter(
      (factor) => !ids.includes(factor.cardId),
    ),
    hand: state.hand.filter((id) => !ids.includes(id)),
    drawPile: state.drawPile.filter((id) => !ids.includes(id)),
    discard: state.discard.filter((id) => !ids.includes(id)),
  };
}
