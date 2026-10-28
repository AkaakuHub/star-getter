import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { game } from './support/game';

it('条件付きコスト変更は各効果を切り上げてから合計する', () => {
  const base = game();
  const source = base.deck[0];
  if (!source) throw new Error('検証用カードがありません。');
  const state = { ...base, cardUseCounts: { [source.cardInstanceId]: 1 } };
  const effect = {
    kind: 'skill-cost-change',
    amount: 0.4,
    minimum: -100,
    maximum: 100,
    conditionType: 2,
  } as const;
  const changed = applyEffect(applyEffect(state, effect, source), effect, source);
  expect(cardCost(changed, source) - cardCost(state, source)).toBe(2);
});

it('条件付きコストのFloat32の積を切り上げ前に丸める', () => {
  const base = game();
  const source = base.deck[0];
  if (!source) throw new Error('検証用カードがありません。');
  const state = { ...base, cardUseCounts: { [source.cardInstanceId]: 30 } };
  const changed = applyEffect(
    state,
    { kind: 'skill-cost-change', amount: 0.1, minimum: -100, maximum: 100, conditionType: 2 },
    source,
  );
  expect(cardCost(changed, source) - cardCost(state, source)).toBe(3);
});
