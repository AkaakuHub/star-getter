import type { GameState } from '../model';

export function completeDeckOutChecks(state: GameState): GameState {
  return state.deckOutCount === 0 ? state : { ...state, deckOutCount: 0 };
}
