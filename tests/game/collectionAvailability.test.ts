import { expect, it } from 'vite-plus/test';
import {
  advanceHandCollectionAbilities,
  canActivateHandCollectionAbility,
} from '@akaakuhub/suku-sute-core/game/cards/collectionAbilities';
import { disposeHandEffects } from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { game, withHand } from './support/game';

it.each(['retain', 'reset'] as const)(
  '回収効果の上限と手札離脱時の%sを発動判定にも反映する',
  (limitMemory) => {
    const base = game();
    const original = base.deck[0];
    if (!original) throw new Error('確認用カードがありません。');
    const card = {
      ...original,
      collectionEffects: {
        threshold: 500_000,
        limit: 2,
        limitMemory,
        effects: [{ kind: 'mood' as const, amount: 1 }],
      },
    };
    const state = withHand({ ...base, deck: [card], cardPool: [card] }, [card.cardInstanceId]);
    const first = advanceHandCollectionAbilities(state, 500_000);
    expect(first.activated).toEqual([card]);
    expect(canActivateHandCollectionAbility(first.state, card)).toBe(true);
    const second = advanceHandCollectionAbilities(first.state, 500_000);
    expect(second.activated).toEqual([card]);
    expect(canActivateHandCollectionAbility(second.state, card)).toBe(false);
    expect(advanceHandCollectionAbilities(second.state, 500_000).activated).toEqual([]);
    const left = disposeHandEffects(second.state, [card.cardInstanceId]);
    expect(canActivateHandCollectionAbility(left, card)).toBe(limitMemory === 'reset');
  },
);

it('トークン名だけでは回収効果を発動しない', () => {
  const base = game();
  const original = base.deck[0];
  if (!original) throw new Error('確認用カードがありません。');
  const { collectionEffects: _collectionEffects, ...plain } = original;
  const card = { ...plain, token: 'story' };
  const state = withHand({ ...base, deck: [card], cardPool: [card] }, [card.cardInstanceId]);
  expect(canActivateHandCollectionAbility(state, card)).toBe(false);
  expect(advanceHandCollectionAbilities(state, 500_000).activated).toEqual([]);
});
