import type { GameState } from '../model';
import { fillHandToCount, shuffleHand } from './drawing';

export function flushDeckActions(state: GameState): GameState {
  let next = state;
  while (next.deckActions.shuffles.length) {
    const count = next.hand.length;
    const action = next.deckActions.shuffles[0];
    if (!action) throw new Error('引き直し処理がありません。');
    const id = action.sourceId;
    const source = id === null ? null : next.cardPool.find((card) => card.id === id);
    if (source === undefined) throw new Error('引き直しを発動したカードがありません。');
    const shuffled = shuffleHand(
      {
        ...next,
        deckActions: { ...next.deckActions, shuffles: next.deckActions.shuffles.slice(1) },
      },
      action.options,
    );
    next = fillHandToCount(
      {
        ...shuffled,
        drawContext: source ? 'skill' : 'shuffle',
        lastUsedMember: source?.member ?? null,
        lastUsedUnit: source?.unit ?? null,
        lastUsedSkillIcon: source?.skillIcon ?? null,
      },
      count,
    );
  }
  return next;
}
