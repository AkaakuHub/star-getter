import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { game } from './support/game';

it('ActionType38はActionType52適用後のfloat値を保持する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('発動元カードがありません。');
  const skillBoost = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 1_234_567,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      uses: null,
    },
    source,
  );
  const active = applyEffect(
    skillBoost,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: 500_005n,
      target: { kind: 'all' },
    },
    source,
  );

  const base = Math.fround(Math.fround(500_005) / Math.fround(10_000));
  const percent = Math.fround(Math.fround(1_234_567) / Math.fround(10_000));
  expect(active.tokenBoosts[0]?.value).toBe(
    Math.fround((percent * base) / Math.fround(100) + base),
  );
});
