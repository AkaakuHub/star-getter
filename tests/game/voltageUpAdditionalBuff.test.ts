import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { game } from './support/game';

it('ActionType31は対象カードの熱気増加を増幅し、参照実装どおり使用回数では解除しない', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.cardInstanceId === 'class');
  const target = initial.deck.find((card) => card.cardInstanceId === 'rain-preparation');
  if (!source || !target) throw new Error('検証用カードがありません。');
  const clean = {
    ...initial,
    amplification: 100,
    storyAmplification: 0,
    handEffectCardIds: [],
    targetBoosts: [],
    resourceBoosts: [],
  };
  const buffed = applyEffect(
    clean,
    {
      kind: 'voltage-up-additional-buff',
      calculation: 1n,
      num: 500_000n,
      target: { kind: 'member', member: target.charactersId },
      duration: { kind: 'milliseconds', value: 10_000n },
      disabledType: 1,
      disabledCount: 1n,
    },
    source,
  );
  const used = applyEffect(buffed, { kind: 'voltage', amount: 100 }, target);
  expect(Number(used.voltage.currentVoltage - buffed.voltage.currentVoltage)).toBe(150);
  expect(used.voltageUpAdditionalBuffs).toHaveLength(1);
  const unmatched = applyEffect(buffed, { kind: 'voltage', amount: 100 }, source);
  expect(Number(unmatched.voltage.currentVoltage - buffed.voltage.currentVoltage)).toBe(100);
});

it('ActionType31は期限を適用し、InvocationType 0x38bでは自動期限を抑止する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.cardInstanceId === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const effect = {
    kind: 'voltage-up-additional-buff',
    calculation: 1n,
    num: 1_000_000n,
    target: { kind: 'all' },
    duration: { kind: 'milliseconds', value: 500n },
    disabledType: 0,
    disabledCount: 0n,
  } as const;
  const timed = applyEffect(initial, effect, source);
  expect(advanceTo(timed, 0.6).voltageUpAdditionalBuffs).toHaveLength(0);
  const persistent = applyEffect(initial, { ...effect, invocationType: 0x38b }, source);
  expect(advanceTo(persistent, 0.6).voltageUpAdditionalBuffs).toHaveLength(1);
});

it('ActionType31の追加率にActionType52を適用する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.cardInstanceId === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
    },
    source,
  );
  const additional = applyEffect(
    action52,
    {
      kind: 'voltage-up-additional-buff',
      calculation: 1n,
      num: 500_000n,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      disabledType: 0,
      disabledCount: 0n,
    },
    source,
  );
  expect(additional.voltageUpAdditionalBuffs[0]?.percent).toBe(75);
  expect(additional.action52Buffs).toHaveLength(0);
});

it('ActionType31は小数の追加率を参照実装のintキャストで0方向へ切り捨てる', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.cardInstanceId === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const percentages = [6_000, -6_000, 5_000, 15_000].map((num) => {
    const changed = applyEffect(
      initial,
      {
        kind: 'voltage-up-additional-buff',
        calculation: 1n,
        num: BigInt(num),
        target: { kind: 'all' },
        duration: { kind: 'stage', value: 0n },
        disabledType: 0,
        disabledCount: 0n,
      },
      source,
    );
    return changed.voltageUpAdditionalBuffs[0]?.percent;
  });
  expect(percentages).toEqual([undefined, undefined, undefined, 1]);
});
