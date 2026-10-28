import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { applyMentalBarrierAdditionalBuff } from '@akaakuhub/suku-sute-core/game/effects/mentalBarrierAdditionalBuff';
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
      num: 500_000n,
      target: { kind: 'member', member: target.charactersId },
      duration: { kind: 'stage', value: 0n },
      disabledType: 1,
      disabledCount: 1n,
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
    num: 1_000_000n,
    target: { kind: 'all' },
    duration: { kind: 'milliseconds', value: 500n },
    disabledType: 0,
    disabledCount: 0n,
  } as const;
  expect(
    advanceTo(applyEffect(initial, effect, source), 0.6).mentalBarrierAdditionalBuffs,
  ).toHaveLength(0);
  expect(
    advanceTo(applyEffect(initial, { ...effect, invocationType: 0x388 }, source), 0.6)
      .mentalBarrierAdditionalBuffs,
  ).toHaveLength(1);
});

it('ActionType33は負数と小数の追加率を参照実装のintキャストで0方向へ切り捨てる', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const percentages = [6_000, -6_000, 5_000, 15_000].map((num) => {
    const changed = applyEffect(
      initial,
      {
        kind: 'mental-barrier-additional-buff',
        calculation: 1,
        num: BigInt(num),
        target: { kind: 'all' },
        duration: { kind: 'stage', value: 0n },
        disabledType: 0,
        disabledCount: 0n,
      },
      source,
    );
    return changed.mentalBarrierAdditionalBuffs[0]?.percent;
  });
  expect(percentages).toEqual([0, 0, 0, 1]);
});

it('ActionType33は参照実装 longの期限と使用回数をfloat32・int64範囲で保持する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const longValue = 9_007_199_254_740_993n;
  const armed = applyEffect(
    initial,
    {
      kind: 'mental-barrier-additional-buff',
      calculation: 1,
      num: 10_000n,
      moodBonus: { target: 1, perPoint: 1, perPointLong: longValue },
      target: { kind: 'all' },
      duration: { kind: 'sections', value: longValue },
      disabledType: 1,
      disabledCount: longValue,
    },
    source,
  );
  const buff = armed.mentalBarrierAdditionalBuffs[0];
  expect(buff?.remainingSections).toBe(longValue);
  expect(buff?.remainingUses).toBe(longValue);
  const consumed = applyMentalBarrierAdditionalBuff(armed, source, 10);
  expect(consumed.state.mentalBarrierAdditionalBuffs[0]?.remainingUses).toBe(longValue - 1n);
  expect(consumed.state.mentalBarrierAdditionalBuffs[0]?.remainingSections).toBe(longValue);
});
