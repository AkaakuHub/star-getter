import type { Card, GameState } from '../model';
import { deactivateHandParameterChanges } from '../parameters/parameterValueChange';

export function handEffectCards(state: GameState): readonly Card[] {
  return state.handEffectCardIds.map((id) => {
    const card = state.cardPool.find((item) => item.id === id);
    if (!card) throw new Error('手札効果のカードがありません。');
    return card;
  });
}

export function disposeHandEffects(state: GameState, ids: readonly string[]): GameState {
  let next = state;
  for (const id of ids) {
    if (!state.handEffectCardIds.includes(id)) continue;
    const card = state.cardPool.find((item) => item.id === id);
    if (card) next = deactivateHandParameterChanges(next, card);
  }
  return {
    ...next,
    handEffectCardIds: state.handEffectCardIds.filter((id) => !ids.includes(id)),
  };
}
