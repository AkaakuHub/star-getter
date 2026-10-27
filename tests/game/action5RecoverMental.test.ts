import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { game } from './support/game';

it('Action5はActionType5・52補正後の割合を最大元気へ適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const state = { ...initial, stamina: 20 };
  const withAction5 = applyEffect(
    state,
    {
      kind: 'recover-mental-additional-buff',
      calculation: 1n,
      num: 100_000n,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      disabledType: 0,
      disabledCount: 0n,
    },
    source,
  );
  const withAction52 = applyEffect(withAction5, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const recovered = applyEffect(
    withAction52,
    { kind: 'recover-mental-skill', amount: 250_000, numberType: 1 },
    source,
  );
  expect(recovered.stamina).toBe(60);
  expect(recovered.action52Buffs).toHaveLength(0);
});

it('Action5は非割合の数値種別でもActionType5・52を消費して元気を変更しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const state = { ...initial, stamina: 20 };
  const withAction52 = applyEffect(state, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const unchanged = applyEffect(
    withAction52,
    { kind: 'recover-mental-skill', amount: 250_000, numberType: 2 },
    source,
  );
  expect(unchanged.stamina).toBe(20);
  expect(unchanged.action52Buffs).toHaveLength(0);
});
