import type { Card, GameState } from '../model';
import {
  applyParameterValueChange,
  deactivateParameterValueChanges,
} from '../parameters/parameterValueChange';

export function activateHandPermanentParameterChanges(state: GameState, card: Card): GameState {
  const effects = card.handPermanentParameterChanges;
  if (!effects?.length || state.activeHandPermanentCardIds.includes(card.id)) return state;
  const next = effects.reduce(
    (next, effect) => applyParameterValueChange(next, card, effect),
    state,
  );
  return {
    ...next,
    activeHandPermanentCardIds: [...state.activeHandPermanentCardIds, card.id],
  };
}

export function handEffectCards(state: GameState): readonly Card[] {
  return state.handEffectCardIds.map((id) => {
    const card = state.cardPool.find((item) => item.id === id);
    if (!card) throw new Error('手札効果のカードがありません。');
    return card;
  });
}

export function disposeHandEffects(state: GameState, ids: readonly string[]): GameState {
  let next = state;
  for (const active of state.activeModeParameterChanges) {
    if (!ids.includes(active.cardId)) continue;
    const card = state.cardPool.find((item) => item.id === active.cardId);
    if (!card?.modeParameterChanges) continue;
    const effects = active.isOn ? card.modeParameterChanges.on : card.modeParameterChanges.off;
    next = deactivateParameterValueChanges(next, card, effects);
  }
  const activeHandPermanentCardIds = state.activeHandPermanentCardIds.filter(
    (id) => !ids.includes(id),
  );
  for (const id of state.activeHandPermanentCardIds) {
    if (!ids.includes(id)) continue;
    const card = state.cardPool.find((item) => item.id === id);
    const effects = card?.handPermanentParameterChanges;
    if (!card || !effects) continue;
    next = deactivateParameterValueChanges(next, card, effects);
  }
  return {
    ...next,
    handEffectCardIds: state.handEffectCardIds.filter((id) => !ids.includes(id)),
    activeModeParameterChanges: state.activeModeParameterChanges.filter(
      (item) => !ids.includes(item.cardId),
    ),
    activeHandPermanentCardIds,
  };
}
