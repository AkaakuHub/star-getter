import type { GameState } from '../model';
import { disposeHandEffects } from './handEffects';
import { flushDeckActions } from './boardActions';
import { fillHand, handCapacity, removeRandomHandCards } from './drawing';

export function finishCardActivation(state: GameState): GameState {
  const activation = state.activation;
  if (!activation) throw new Error('カードの使用処理がありません。');
  const source = state.deck.find((card) => card.id === activation.sourceId);
  if (!source) throw new Error('使用したカードがありません。');
  const children = activation.usedCards.filter((id) => id !== source.id);
  const excludedIds = new Set([
    ...activation.excluded,
    ...activation.usedCards.filter((id) => state.skillUseDestinations[id] === 'exclusion'),
  ]);
  const returnToDrawIds = new Set([
    ...activation.returnToDraw,
    ...activation.usedCards.filter((id) => state.skillUseDestinations[id] === 'deck'),
  ]);
  let next = excludeCards(
    disposeHandEffects(state, children),
    [...excludedIds].filter((id) => id !== source.id),
  );
  const activeChildren = children.filter((id) => next.deck.some((card) => card.id === id));
  next = {
    ...next,
    drawPile: [
      ...next.drawPile,
      ...(activation.recoverDiscard ? next.discard : []),
      ...activeChildren.filter((id) => returnToDrawIds.has(id)),
    ],
    discard: [
      ...(activation.recoverDiscard ? [] : next.discard),
      ...activeChildren.filter((id) => !returnToDrawIds.has(id)),
    ],
  };
  next = flushDeckActions(next);
  const handCountChange = activation.handCountChanges[source.id] ?? 0;
  const handReady: GameState = {
    ...next,
    lastUsedMember: source.member,
    lastUsedUnit: source.unit,
    lastUsedSkillIcon: source.skillIcon ?? null,
    drawContext: 'skill',
  };
  if (handCountChange < 0) {
    const target = Math.min(handCapacity(handReady), handReady.deck.length);
    const removedCount = Math.max(0, handReady.hand.length + 1 - target);
    next = {
      ...removeRandomHandCards(handReady, removedCount),
      drawContext: 'idle',
    };
  } else {
    next = fillHand(handReady);
  }
  next = disposeHandEffects(next, [source.id]);
  next = excludedIds.has(source.id)
    ? excludeCards(next, [source.id])
    : returnToDrawIds.has(source.id)
      ? { ...next, drawPile: [...next.drawPile, source.id] }
      : { ...next, discard: [...next.discard, source.id] };
  return {
    ...next,
    skillUseDestinations: Object.fromEntries(
      Object.entries(next.skillUseDestinations).filter(
        ([id]) => !activation.usedCards.includes(id),
      ),
    ),
    activation: null,
  };
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
    activeModeParameterChanges: state.activeModeParameterChanges.filter(
      (item) => !ids.includes(item.cardId),
    ),
    skillUseDestinations: Object.fromEntries(
      Object.entries(state.skillUseDestinations).filter(([id]) => !ids.includes(id)),
    ),
    hand: state.hand.filter((id) => !ids.includes(id)),
    drawPile: state.drawPile.filter((id) => !ids.includes(id)),
    discard: state.discard.filter((id) => !ids.includes(id)),
  };
}
