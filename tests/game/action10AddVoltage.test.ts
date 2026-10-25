import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { game } from './support/game';

it('Action10はActionType10・52適用後に熱気を加算する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0 },
    uses: 1,
  });
  const boosted = applyEffect(
    action52,
    { kind: 'add-voltage-skill', amount: 1_000_000, numberType: 1 },
    source,
  );
  expect(boosted.excitement).toBe(initial.excitement + 150);
  expect(boosted.action52Buffs).toHaveLength(0);
});

it('Action10は数値種別1以外では補正を消費して熱気を加算しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0 },
    uses: 1,
  });
  const unchanged = applyEffect(
    action52,
    { kind: 'add-voltage-skill', amount: 1_000_000, numberType: 2 },
    source,
  );
  expect(unchanged.excitement).toBe(initial.excitement);
  expect(unchanged.action52Buffs).toHaveLength(0);
});
