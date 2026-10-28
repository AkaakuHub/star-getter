import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { applyEffect, skillValue } from '@akaakuhub/suku-sute-core/game/effects';
import {
  applyParameterValueChange,
  initializeParameterValueFactors,
  resolveEffectParameterDetails,
} from '@akaakuhub/suku-sute-core/game/parameters/parameterValueChange';
import { disposeHandEffects } from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { fillHand, removeRandomHandCards } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { createModes } from '@akaakuhub/suku-sute-core/game/live/modes';
import { game } from './support/game';

it('加算型の係数は今回の使用回数を含む', () => {
  const state = game();
  const card = state.deck.find((item) => item.cardInstanceId === 'class');
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
  const card = state.deck.find((item) => item.cardInstanceId === 'class');
  if (!card) throw new Error('検証用カードがありません。');
  const updated = applyParameterValueChange(
    { ...state, parameterValueChangeCounts: { [card.cardInstanceId]: { 'change-param': 1 } } },
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
  const card = state.deck.find((item) => item.cardInstanceId === 'class');
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
  const source = state.deck.find((item) => item.cardInstanceId === 'class');
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
    deck: state.deck.map((item) => (item.cardInstanceId === source.cardInstanceId ? card : item)),
  };
  const initialized = initializeParameterValueFactors(prepared);
  expect(initialized.parameterValueFactors[0]?.factor).toBe(1.25);
  expect(initialized.parameterValueChangeCounts[source.cardInstanceId]?.['change-param']).toBe(0);
});

it('詳細ID係数を通常の効果値へ適用する', () => {
  const initial = game();
  const card = initial.deck.find((item) => item.cardInstanceId === 'class');
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
      kind: 'ap',
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
  expect(result.ap.currentAp).toBe(7);
});

it('詳細値へ係数を掛けた結果をruntimeと同じく正の無限大方向へ丸める', () => {
  const initial = game();
  const card = initial.deck.find((item) => item.cardInstanceId === 'class');
  if (!card) throw new Error('検証用カードがありません。');
  const changed = applyParameterValueChange(initial, card, {
    kind: 'parameter-value-change',
    sourceEffectId: 'change-param',
    targetDetailId: 202141300101n,
    calculation: 'add',
    base: 10_000,
    increment: 2_500,
  });
  const effect = {
    kind: 'ap',
    amount: 0,
    parameterDetails: {
      amount: { id: 202141300101n, value: 1n, unitsPerValue: 1 },
    },
  } as const;
  expect(resolveEffectParameterDetails(changed, card, effect)).toMatchObject({ amount: 2 });
  const negative = resolveEffectParameterDetails(changed, card, {
    ...effect,
    parameterDetails: {
      amount: { id: 202141300101n, value: -1n, unitsPerValue: 1 },
    },
  });
  expect(negative).toMatchObject({ amount: -1 });
});

it('amount以外の詳細値も効果実行前に補正する', () => {
  const initial = game();
  const card = initial.deck.find((item) => item.cardInstanceId === 'class');
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

it('モード変更で前の能力を解除し、新しい能力の詳細値変更を発動する', () => {
  const initial = game();
  const source = initial.deck.find((item) => item.cardInstanceId === 'class');
  if (!source) throw new Error('検証用カードがありません。');
  const card = {
    ...source,
    modeParameterChanges: {
      modeId: 8,
      off: [
        {
          kind: 'parameter-value-change',
          sourceEffectId: 'mode-off-change',
          targetDetailId: 202141300101n,
          calculation: 'add',
          base: 10_000,
          increment: 0,
        },
      ],
      on: [
        {
          kind: 'parameter-value-change',
          sourceEffectId: 'mode-on-change',
          targetDetailId: 202141300101n,
          calculation: 'add',
          base: 20_000,
          increment: 0,
        },
      ],
    },
  } as const;
  const prepared = initializeParameterValueFactors({
    ...initial,
    deck: initial.deck.map((item) => (item.cardInstanceId === card.cardInstanceId ? card : item)),
    cardPool: initial.cardPool.map((item) =>
      item.cardInstanceId === card.cardInstanceId ? card : item,
    ),
    modes: createModes([8]),
    handEffectCardIds: [...initial.handEffectCardIds, card.cardInstanceId],
  });
  const enabled = applyEffect(prepared, { kind: 'mode', modeId: 8n, change: 'on' }, card);
  expect(enabled.parameterValueFactors[0]?.sourceEffectId).toBe('mode-on-change');
  const leftHand = disposeHandEffects(enabled, [card.cardInstanceId]);
  expect(leftHand.parameterValueFactors).toHaveLength(0);
  expect(leftHand.activeModeParameterChanges).toHaveLength(0);
  const disabled = applyEffect(enabled, { kind: 'mode', modeId: 8n, change: 'off' }, card);
  expect(disabled.parameterValueFactors[0]?.sourceEffectId).toBe('mode-off-change');
  expect(disabled.parameterValueChangeCounts[card.cardInstanceId]?.['mode-on-change']).toBe(1);
  expect(disabled.parameterValueChangeCounts[card.cardInstanceId]?.['mode-off-change']).toBe(1);
  expect(disabled.activeModeParameterChanges).toEqual([
    { cardId: card.cardInstanceId, modeId: 8, isOn: false },
  ]);
});

it('HandPermanentのAction18は手札追加で発動し、手札離脱で解除する', () => {
  const initial = game();
  const source = initial.deck.find((item) => item.cardInstanceId === 'class');
  if (!source) throw new Error('検証用カードがありません。');
  const effect = {
    kind: 'parameter-value-change',
    sourceEffectId: 'hand-permanent-change',
    targetDetailId: 202141300101n,
    calculation: 'add',
    base: 20_000,
    increment: 0,
  } as const;
  const card = {
    ...source,
    handPermanentEffects: [
      effect,
      {
        kind: 'amplify',
        percent: 300,
        members: [source.charactersId],
        moodBonus: { target: 3, perPoint: 1.5 },
      },
    ],
  } as const;
  const state = withBoardState(
    {
      ...initial,
      deck: [card],
      cardPool: [card],
      handEffectCardIds: [],
      deckDrawContext: { currentDrawType: 3 as const, usedCard: null, usedSkill: null },
    },
    { hand: [], deck: [card.cardInstanceId], graveyard: [] },
  );
  const unrelated = applyParameterValueChange(state, card, {
    ...effect,
    sourceEffectId: 'unrelated-change',
  });
  const inactiveLeft = disposeHandEffects(unrelated, [card.cardInstanceId]);
  expect(
    inactiveLeft.parameterValueFactors.some(
      (factor) => factor.sourceEffectId === 'unrelated-change',
    ),
  ).toBe(true);
  const active = fillHand(state);
  expect(active.activeHandPermanentCardIds).toEqual([card.cardInstanceId]);
  expect(active.targetBoosts).toEqual([
    {
      members: [source.charactersId],
      percent: 300,
      duration: 'stage',
      deactivationKey: `hand-permanent:${card.cardInstanceId}`,
    },
  ]);
  expect(skillValue(active, 100, { kind: 'ap', amount: 100 }, card)).toBe(400);
  expect(
    active.parameterValueFactors.find((factor) => factor.sourceEffectId === effect.sourceEffectId)
      ?.factor,
  ).toBe(2);
  const disposed = removeRandomHandCards(active, 1);
  expect(disposed.activeHandPermanentCardIds).toHaveLength(0);
  expect(disposed.targetBoosts).toHaveLength(0);
  expect(skillValue(disposed, 100, { kind: 'ap', amount: 100 }, card)).toBe(100);
  expect(
    disposed.parameterValueFactors.some(
      (factor) => factor.sourceEffectId === effect.sourceEffectId,
    ),
  ).toBe(false);
});
