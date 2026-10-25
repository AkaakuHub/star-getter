import { expect, it } from 'vite-plus/test';
import { advanceAutomaticGauges } from '../../src/domain/game/automaticGauges';
import { act } from '../../src/domain/game/actions';
import { activateBloom } from '../../src/domain/game/bloom';
import { applyEffect } from '../../src/domain/game/effects';
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
    handEffectCardIds: ['horizon'],
    mentalProtected: true,
    apTimerSeconds: 0,
    voltageTimerSeconds: 0,
    energy: 0,
  };
  const empty = activateBloom(initial, 1);
  const full = activateBloom({ ...initial, energy: initial.maxEnergy }, 1);
  const emptyAfter = advanceAutomaticGauges(empty, 1.2);
  const fullAfter = advanceAutomaticGauges(full, 1.2);
  expect(emptyAfter.energy).toBe(0);
  expect(fullAfter.energy).toBe(initial.maxEnergy);
  expect((emptyAfter.bloom?.progress ?? 0n) - (empty.bloom?.progress ?? 0n)).toBe(9n);
  expect((fullAfter.bloom?.progress ?? 0n) - (full.bloom?.progress ?? 0n)).toBe(2n);
});

it('開花中の自然元気減少は専用値を減らし、休憩防止の付与後だけ停止する', () => {
  const base = advanceTo(game(), 12);
  const initial = activateBloom(
    {
      ...base,
      moodOffset: -100,
      hand: ['horizon'],
      handEffectCardIds: ['horizon'],
      energy: base.maxEnergy,
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

it('熱気の自然増加停止を重ねると、すべての停止期限が切れるまでタイマーも停止する', () => {
  const initial = game('library');
  expect(
    applyEffect(initial, {
      kind: 'stop-voltage-increase',
      duration: { kind: 'milliseconds', value: 0 },
    }),
  ).toBe(initial);
  const first = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'milliseconds', value: 500 },
  });
  const overlapping = applyEffect(first, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'milliseconds', value: 1000 },
  });
  const half = advanceTo(overlapping, 0.5);
  expect(half.voltageStops).toHaveLength(1);
  expect(half.voltageTimerSeconds).toBe(0);
  const expired = advanceTo(half, 1 + 1 / 60);
  expect(expired.voltageStops).toHaveLength(0);
  expect(expired.voltageTimerSeconds).toBe(0);
  expect(advanceTo(expired, 1.6).excitement).toBe(1);
});

it('パート数で指定した熱気停止は指定回数の切替まで継続する', () => {
  const initial = game('library');
  const stops = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'sections', value: 2 },
  });
  const firstSection = initial.track.sections[1];
  const secondSection = initial.track.sections[2];
  if (!firstSection || !secondSection) throw new Error('パートが不足しています。');
  const first = advanceTo(stops, (firstSection.startBeat * 60) / initial.track.bpm);
  expect(first.voltageStops[0]?.remainingSections).toBe(1);
  expect(first.excitement).toBe(0);
  const second = advanceTo(first, (secondSection.startBeat * 60) / initial.track.bpm + 1 / 60);
  expect(second.voltageStops).toHaveLength(0);
  expect(second.excitement).toBe(0);
});

it('外部解除型は指定期限で自動解除せず、Deactivatorで解除する', () => {
  const initial = game('library');
  const stopped = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'sections', value: 1 },
    invocationType: 0x388,
    deactivationKey: 'voltage-stop',
  });
  const section = initial.track.sections[1];
  if (!section) throw new Error('パートが不足しています。');
  const afterSection = advanceTo(stopped, (section.startBeat * 60) / initial.track.bpm + 1 / 60);
  expect(afterSection.voltageStops).toHaveLength(1);
  expect(
    act(afterSection, { type: 'deactivate-voltage-increase', deactivationKey: 'voltage-stop' })
      .voltageStops,
  ).toHaveLength(0);
});

it('負のミリ秒期限はC#同様に次の更新で停止を解除する', () => {
  const initial = game('library');
  const stopped = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'milliseconds', value: -1 },
  });
  expect(stopped.voltageStops).toHaveLength(1);
  expect(advanceTo(stopped, 1 / 60).voltageStops).toHaveLength(0);
});
