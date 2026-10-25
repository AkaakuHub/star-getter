import type { Card, GameState } from '../model';

export function handEffectCards(state: GameState): readonly Card[] {
  return state.handEffectCardIds.map((id) => {
    const card = state.cardPool.find((item) => item.id === id);
    if (!card) throw new Error('手札効果のカードがありません。');
    return card;
  });
}

export function disposeHandEffects(state: GameState, ids: readonly string[]): GameState {
  return { ...state, handEffectCardIds: state.handEffectCardIds.filter((id) => !ids.includes(id)) };
}
