import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('ActionType33は対象カードの耐久値を増幅し、対象外では消費しない', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const target = initial.deck.find((card) => card.id === 'rain-preparation');
  if (!source || !target) throw new Error('検証用カードがありません。');
  const clean = {
    ...initial,
    amplification: 100,
    storyAmplification: 0,
    handEffectCardIds: [],
    targetBoosts: [],
  };
  const buffed = applyEffect(
    clean,
    {
      kind: 'mental-barrier-additional-buff',
      calculation: 1,
      num: 500_000,
      target: { kind: 'member', member: target.member },
      duration: { kind: 'stage', value: 0 },
      disabledType: 1,
      disabledCount: 1,
    },
    source,
  );
  const barrier = {
    kind: 'mental-barrier',
    barrier: 'endurance',
    enduranceType: 'fixed',
    endurance: 10,
    attenuation: 0,
    duration: { kind: 'stage' },
  } as const;
  const unmatched = applyEffect(buffed, barrier, source);
  expect(unmatched.mentalBarriers[0]?.endurance).toBe(10);
  expect(unmatched.mentalBarrierAdditionalBuffs).toHaveLength(1);
  const matched = applyEffect(buffed, barrier, target);
  expect(matched.mentalBarriers[0]?.endurance).toBe(15);
  expect(matched.mentalBarrierAdditionalBuffs).toHaveLength(0);
});

it('ActionType33の期限とInvocationType 0x388の期限抑止を適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const effect = {
    kind: 'mental-barrier-additional-buff',
    calculation: 1,
    num: 1_000_000,
    target: { kind: 'all' },
    duration: { kind: 'milliseconds', value: 500 },
    disabledType: 0,
    disabledCount: 0,
  } as const;
  expect(
    advanceTo(applyEffect(initial, effect, source), 0.6).mentalBarrierAdditionalBuffs,
  ).toHaveLength(0);
  expect(
    advanceTo(applyEffect(initial, { ...effect, invocationType: 0x388 }, source), 0.6)
      .mentalBarrierAdditionalBuffs,
  ).toHaveLength(1);
});

it('ActionType33は負数と小数の追加率をC#のMathf.Roundで登録する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const percentages = [6_000, -6_000, 5_000, 15_000].map((num) => {
    const changed = applyEffect(
      initial,
      {
        kind: 'mental-barrier-additional-buff',
        calculation: 1,
        num,
        target: { kind: 'all' },
        duration: { kind: 'stage', value: 0 },
        disabledType: 0,
        disabledCount: 0,
      },
      source,
    );
    return changed.mentalBarrierAdditionalBuffs[0]?.percent;
  });
  expect(percentages).toEqual([1, -1, 0, 2]);
});
