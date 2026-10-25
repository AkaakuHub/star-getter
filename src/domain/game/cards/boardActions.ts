import type { GameState } from '../model';
import { fillHand, shuffleHand } from './drawing';

export function flushDeckActions(state: GameState): GameState {
  let next = state;
  while (next.deckActions.shuffles > 0) {
    next = fillHand(
      shuffleHand({
        ...next,
        deckActions: { ...next.deckActions, shuffles: next.deckActions.shuffles - 1 },
      }),
    );
  }
  return next;
}
