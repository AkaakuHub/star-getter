import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { voltageThreshold } from '../../src/domain/game/live/voltageLevel';
import { advanceTo } from '../../src/domain/game/simulation';
import { activateBloom } from '../../src/domain/game/bloom';
import { game } from './support/game';

describe('無限ゲージ', () => {
  it('期限中はAPを消費できず、AP無限の解除後も現在値を維持する', () => {
    const initial = { ...game(), energy: 2 };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'ap',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(active.energy).toBe(active.maxEnergy);
    const during = advanceTo(active, 0.25);
    expect(during.energy).toBe(during.maxEnergy);
    const ended = advanceTo(during, 0.5 + 1 / 60);
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.energy).toBe(ended.maxEnergy);
  });

  it('重複する熱気無限のうち最後の期限でレベル10へ戻す', () => {
    const initial = game();
    const first = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const second = applyEffect(first, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 1000 },
    });
    const overlap = advanceTo(second, 0.5 + 1 / 60);
    expect(overlap.gaugeInfinities).toHaveLength(1);
    expect(overlap.excitement).toBe(second.excitement);
    const ended = advanceTo(overlap, 1 + 1 / 60);
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.excitement).toBe(voltageThreshold(10));
  });

  it('元気無限の開始と最終解除で元気タイマーを0へ戻す', () => {
    const initial = { ...game(), stamina: 42, mentalTimerSeconds: 0.4 };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(active.stamina).toBe(100);
    expect(active.mentalTimerSeconds).toBe(0);
    const ended = advanceTo({ ...active, mentalTimerSeconds: 0.4 }, 0.5);
    expect(ended.stamina).toBe(100);
    expect(ended.mentalTimerSeconds).toBe(0);
  });

  it('開花中は500のGenesisゲージを加算し、無限状態を作らない', () => {
    const initial = activateBloom(game('bloom'), 1);
    const next = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(next.bloom?.progress).toBe((initial.bloom?.progress ?? 0n) + 500n);
    expect(next.gaugeInfinities).toHaveLength(0);
  });
});
