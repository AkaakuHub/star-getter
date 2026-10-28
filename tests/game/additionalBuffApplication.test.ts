import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { game } from './support/game';

describe('追加バフ適用条件', () => {
  it('正の熱気加算だけ追加増幅と使用回数を消費する', () => {
    const initial = {
      ...game(),
      currentVoltage: 50,
      resourceBoosts: [{ target: 'voltage' as const, percent: 100, uses: 1 }],
    };
    const positive = applyEffect(initial, { kind: 'voltage', amount: 10 });
    expect(positive.currentVoltage).toBe(70);
    expect(positive.resourceBoosts).toHaveLength(0);

    const negative = applyEffect(initial, { kind: 'voltage', amount: -10 });
    expect(negative.currentVoltage).toBe(40);
    expect(negative.resourceBoosts).toHaveLength(1);
  });

  it('元気・熱気の小数加算を参照実装の整数キャストと同じく0方向へ切り捨てる', () => {
    const initial = {
      ...game(),
      currentVoltage: 50,
      mental: { ...game().mental, currentMental: 50 },
    };
    expect(applyEffect(initial, { kind: 'mental', amount: -1.8 }).mental.currentMental).toBe(49);
    expect(applyEffect(initial, { kind: 'voltage', amount: 1.8 }).currentVoltage).toBe(51);
  });
});
