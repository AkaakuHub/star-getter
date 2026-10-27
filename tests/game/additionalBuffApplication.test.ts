import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { game } from './support/game';

describe('追加バフ適用条件', () => {
  it('正の熱気加算だけ追加増幅と使用回数を消費する', () => {
    const initial = {
      ...game(),
      excitement: 50,
      resourceBoosts: [{ target: 'excitement' as const, percent: 100, uses: 1 }],
    };
    const positive = applyEffect(initial, { kind: 'excitement', amount: 10 });
    expect(positive.excitement).toBe(70);
    expect(positive.resourceBoosts).toHaveLength(0);

    const negative = applyEffect(initial, { kind: 'excitement', amount: -10 });
    expect(negative.excitement).toBe(40);
    expect(negative.resourceBoosts).toHaveLength(1);
  });

  it('元気・熱気の小数加算をC#の整数キャストと同じく0方向へ切り捨てる', () => {
    const initial = { ...game(), stamina: 50, excitement: 50 };
    expect(applyEffect(initial, { kind: 'stamina', amount: -1.8 }).stamina).toBe(49);
    expect(applyEffect(initial, { kind: 'excitement', amount: 1.8 }).excitement).toBe(51);
  });
});
