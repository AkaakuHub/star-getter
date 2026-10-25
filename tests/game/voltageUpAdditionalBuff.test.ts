import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('ActionType31は対象カードの熱気増加を増幅し、C#どおり使用回数では解除しない', () => {
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
    resourceBoosts: [],
  };
  const buffed = applyEffect(
    clean,
    {
      kind: 'voltage-up-additional-buff',
      calculation: 1,
      num: 500_000,
      target: { kind: 'member', member: target.member },
      duration: { kind: 'milliseconds', value: 10_000 },
      disabledType: 1,
      disabledCount: 1,
    },
    source,
  );
  const used = applyEffect(buffed, { kind: 'excitement', amount: 100 }, target);
  expect(Number(used.excitement - buffed.excitement)).toBe(150);
  expect(used.voltageUpAdditionalBuffs).toHaveLength(1);
  const unmatched = applyEffect(buffed, { kind: 'excitement', amount: 100 }, source);
  expect(Number(unmatched.excitement - buffed.excitement)).toBe(100);
});

it('ActionType31は期限を適用し、InvocationType 0x38bでは自動期限を抑止する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const effect = {
    kind: 'voltage-up-additional-buff',
    calculation: 1,
    num: 1_000_000,
    target: { kind: 'all' },
    duration: { kind: 'milliseconds', value: 500 },
    disabledType: 0,
    disabledCount: 0,
  } as const;
  const timed = applyEffect(initial, effect, source);
  expect(advanceTo(timed, 0.6).voltageUpAdditionalBuffs).toHaveLength(0);
  const persistent = applyEffect(initial, { ...effect, invocationType: 0x38b }, source);
  expect(advanceTo(persistent, 0.6).voltageUpAdditionalBuffs).toHaveLength(1);
});

it('ActionType31の追加率にActionType52を適用する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
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
      calculation: 1,
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0 },
      disabledType: 0,
      disabledCount: 0,
    },
    source,
  );
  expect(additional.voltageUpAdditionalBuffs[0]?.percent).toBe(75);
  expect(additional.action52Buffs).toHaveLength(0);
});
