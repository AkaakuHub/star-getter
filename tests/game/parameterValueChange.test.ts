import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import {
  applyParameterValueChange,
  initializeParameterValueFactors,
} from '../../src/domain/game/parameters/parameterValueChange';
import { game } from './support/game';

it('加算型の係数は今回の使用回数を含む', () => {
  const state = game();
  const card = state.deck.find((item) => item.id === 'class');
  if (!card) throw new Error('検証用カードがありません。');
  const updated = applyParameterValueChange(state, card, {
    kind: 'parameter-value-change',
    sourceEffectId: 'change-param',
    targetDetailId: 202141300101n,
    calculation: 'add',
    base: 10_000,
    increment: 2_500,
  });
  expect(updated.parameterValueFactors[0]?.factor).toBe(1.25);
});

it('倍率配列は発動回数で選択し、最終要素を超えて使わない', () => {
  const state = game();
  const card = state.deck.find((item) => item.id === 'class');
  if (!card) throw new Error('検証用カードがありません。');
  const updated = applyParameterValueChange(
    { ...state, parameterValueChangeCounts: { [card.id]: { 'change-param': 1 } } },
    card,
    {
      kind: 'parameter-value-change',
      sourceEffectId: 'change-param',
      targetDetailId: 202141300101n,
      calculation: 'multiply',
      base: 0,
      increment: 0,
      values: [120_000],
    },
  );
  expect(updated.parameterValueFactors[0]?.factor).toBeCloseTo(1.12);
});

it('ファンレベル型は指定メンバーだけを合算する', () => {
  const state = game();
  const card = state.deck.find((item) => item.id === 'class');
  if (!card) throw new Error('検証用カードがありません。');
  const updated = applyParameterValueChange(
    { ...state, supportLevels: { 1021: 20, 1030: 100 } },
    card,
    {
      kind: 'parameter-value-change',
      sourceEffectId: 'change-param',
      targetDetailId: 202141300101n,
      calculation: 'fan-level',
      base: 5_000,
      increment: 1_000,
      members: [1021],
    },
  );
  expect(updated.parameterValueFactors[0]?.factor).toBe(2.5);
});

it('カード生成時にResetSkillEffect相当の基礎係数を登録する', () => {
  const state = game();
  const source = state.deck.find((item) => item.id === 'class');
  if (!source) throw new Error('検証用カードがありません。');
  const effect = {
    kind: 'parameter-value-change',
    sourceEffectId: 'change-param',
    targetDetailId: 202141300101n,
    calculation: 'add',
    base: 12_500,
    increment: 2_500,
  } as const;
  const card = { ...source, effects: [effect] };
  const prepared = {
    ...state,
    deck: state.deck.map((item) => (item.id === source.id ? card : item)),
  };
  const initialized = initializeParameterValueFactors(prepared);
  expect(initialized.parameterValueFactors[0]?.factor).toBe(1.25);
  expect(initialized.parameterValueChangeCounts[source.id]?.['change-param']).toBe(0);
});

it('詳細ID係数を通常の効果値へ適用する', () => {
  const initial = game();
  const card = initial.deck.find((item) => item.id === 'class');
  if (!card) throw new Error('検証用カードがありません。');
  const changed = applyParameterValueChange(initial, card, {
    kind: 'parameter-value-change',
    sourceEffectId: 'change-param',
    targetDetailId: 202141300101n,
    calculation: 'add',
    base: 10_000,
    increment: 7_500,
  });
  const result = applyEffect(
    changed,
    {
      kind: 'energy',
      amount: 10,
      parameterDetails: {
        amount: {
          id: 202141300101n,
          value: 40_000n,
          unitsPerValue: 10_000,
        },
      },
    },
    card,
  );
  expect(result.energy).toBe(7);
});

it('amount以外の詳細値も効果実行前に補正する', () => {
  const initial = game();
  const card = initial.deck.find((item) => item.id === 'class');
  if (!card) throw new Error('検証用カードがありません。');
  const changed = applyParameterValueChange(initial, card, {
    kind: 'parameter-value-change',
    sourceEffectId: 'change-param',
    targetDetailId: 202141300101n,
    calculation: 'add',
    base: 10_000,
    increment: 2_500,
  });
  const result = applyEffect(
    changed,
    {
      kind: 'amplify',
      percent: 10,
      parameterDetails: {
        percent: {
          id: 202141300101n,
          value: 40_000n,
          unitsPerValue: 1_000,
        },
      },
    },
    card,
  );
  expect(result.amplification).toBe(150);
});
