import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { game } from './support/game';

it.each([1, 2])('複数ユニットのカードを手札条件14の所属%sへ数える', (unit) => {
  const initial = game();
  const base = initial.deck[0];
  if (!base) throw new Error('発動元カードがありません。');
  const source = { ...base, unitIds: [1, 2] };
  const state = withBoardState(
    {
      ...initial,
      deck: initial.deck.map((card) => (card.id === source.id ? source : card)),
      cardPool: initial.cardPool.map((card) => (card.id === source.id ? source : card)),
    },
    { hand: [source.id] },
  );
  const changed = applyEffect(
    state,
    {
      kind: 'skill-cost-change',
      amount: 2,
      minimum: 0,
      maximum: 10,
      conditionType: 14,
      conditionId: unit,
    },
    source,
  );
  expect(cardCost(changed, source) - cardCost(state, source)).toBe(2);
});
