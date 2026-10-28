import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { game } from './support/game';

it('Action904のAction58子効果は手札離脱時に上限を戻す', () => {
  const initial = game();
  const original = initial.deck[0];
  if (!original) throw new Error('対象カードがありません。');
  const card = {
    ...original,
    handPermanentEffects: [
      {
        kind: 'fixed-parameter-extend' as const,
        target: 'ap' as const,
        calculation: 'add' as const,
        value: 10n,
        duration: { kind: 'stage' as const },
      },
    ],
  };
  const state = withBoardState(
    { ...initial, deck: [card], cardPool: [card], handEffectCardIds: [card.id] },
    { hand: [card.id], deck: [], graveyard: [] },
  );

  const active = activateHandPermanentEffects(state, card);

  expect(active.ap.maxAp).toBe(initial.ap.maxAp + 10);
  const disposed = disposeHandEffects(active, [card.id]);
  expect(disposed.ap.maxAp).toBe(initial.ap.maxAp);
  expect(disposed.fixedParameterExtends).toHaveLength(0);
});
