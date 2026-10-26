import type { GameState } from '../model';

export function completeDeckOutChecks(state: GameState): GameState {
  if (state.deckOutCount <= 0)
    return state.deckOutCount === 0 ? state : { ...state, deckOutCount: 0 };
  return {
    ...state,
    deckOutCount: state.deckOutCount - 1,
    afterMentalDownEvents: state.afterMentalDownEvents + 1,
  };
}
