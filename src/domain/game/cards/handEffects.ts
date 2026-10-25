import type { Card, GameState } from '../model';
import { deactivateParameterValueChanges } from '../parameters/parameterValueChange';

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
  return {
    ...next,
    handEffectCardIds: state.handEffectCardIds.filter((id) => !ids.includes(id)),
    activeModeParameterChanges: state.activeModeParameterChanges.filter(
      (item) => !ids.includes(item.cardId),
    ),
  };
}
