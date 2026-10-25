import { expect, it } from 'vite-plus/test';
import { advanceAutomaticGauges } from '../../src/domain/game/automaticGauges';
import { activateBloom } from '../../src/domain/game/bloom';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('標準条件のAP・元気・熱気は個別の間隔で整数ずつ変化する', () => {
  const initial = { ...game('library'), energy: 0 };
  expect(advanceTo(initial, 0.58).excitement).toBe(0);
  expect(advanceTo(initial, 0.6).excitement).toBe(1);
  const later = advanceTo(initial, 1.2);
  expect(later.energy).toBe(1);
  expect(later.stamina).toBe(99);
  expect(later.excitement).toBe(2);
});

it('開花中も通常APが上限未満なら自然回復を専用値へ変換し、通常APを保持する', () => {
  const initial = {
    ...advanceTo(game(), 12),
    moodOffset: -100,
    hand: ['horizon'],
    mentalProtected: true,
    apTimerSeconds: 0,
    voltageTimerSeconds: 0,
    energy: 0,
  };
  const empty = activateBloom(initial, 1);
  const full = activateBloom({ ...initial, energy: 10 }, 1);
  const emptyAfter = advanceAutomaticGauges(empty, 1.2);
  const fullAfter = advanceAutomaticGauges(full, 1.2);
  expect(emptyAfter.energy).toBe(0);
  expect(fullAfter.energy).toBe(10);
  expect((emptyAfter.bloom?.progress ?? 0n) - (empty.bloom?.progress ?? 0n)).toBe(10n);
  expect((fullAfter.bloom?.progress ?? 0n) - (full.bloom?.progress ?? 0n)).toBe(2n);
});

it('開花中の自然元気減少は専用値を減らし、休憩防止の付与後だけ停止する', () => {
  const initial = activateBloom(
    {
      ...advanceTo(game(), 12),
      moodOffset: -100,
      hand: ['horizon'],
      energy: 10,
      apTimerSeconds: 0,
      voltageTimerSeconds: 0,
      mentalTimerSeconds: 0,
    },
    1,
  );
  const protectedState = { ...initial, mentalProtected: true };
  const normal = advanceAutomaticGauges(initial, 1.2),
    protectedAfter = advanceAutomaticGauges(protectedState, 1.2);
  expect(normal.stamina).toBe(initial.stamina);
  expect(normal.excitement).toBe(initial.excitement);
  expect(normal.bloom?.progress).toBe(initial.bloom?.progress);
  expect(protectedAfter.bloom?.progress).toBe((initial.bloom?.progress ?? 0n) + 2n);
});
