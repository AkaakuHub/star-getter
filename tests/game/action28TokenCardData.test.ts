import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { createTokenCardEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/tokenCard';
import { game } from './support/game';
import { tokenCardEffect } from './support/tokenCardEffect';

it('ActionType28はカードテンプレートとlong枚数・series IDを接続する', () => {
  expect(
    createTokenCardEffect({
      skillEffectId: 28n,
      skillType: 2,
      skillLevel: 1,
      specialAppealSkillLevel: 0,
      skillSkillLevel: 1,
      details: [
        { id: 1n, detailType: 'TOKEN_CARD_CARD_COUNT', value: 4_294_967_298n },
        { id: 2n, detailType: 'TOKEN_CARD_RESOURCE_ID', value: 9_007_201_402_224_640n },
        {
          id: 3n,
          detailType: 'TOKEN_CARD_SERIES_ID',
          value: 0n,
          paramValues: [(1n << 53n) + 1n],
        },
      ],
    }),
  ).toEqual({
    kind: 'token-card',
    resourceId: -2_147_483_648,
    count: 4_294_967_298n,
    style: 1,
    mood: 1,
    skillSeriesId: 0,
    skillLevel: 1,
    abilitySeriesId: 0,
    abilityLevel: 1,
    sourceSkillType: 2,
    sourceSkillLevel: 1,
    sourceSpecialAppealSkillLevel: 0,
    sourceSkillSkillLevel: 1,
    parameterDetails: {
      count: { id: 1n, value: 4_294_967_298n, unitsPerValue: 1 },
    },
    seriesIds: [(1n << 53n) + 1n],
  });
});

it('ActionType28は枚数とResourceIDの既定値を使う', () => {
  expect(
    createTokenCardEffect({
      skillEffectId: 28n,
      skillType: 2,
      skillLevel: 1,
      specialAppealSkillLevel: 0,
      skillSkillLevel: 1,
      details: [],
    }),
  ).toEqual({
    kind: 'token-card',
    resourceId: 0,
    count: 1n,
    style: 1,
    mood: 1,
    skillSeriesId: 0,
    skillLevel: 1,
    abilitySeriesId: 0,
    abilityLevel: 1,
    sourceSkillType: 2,
    sourceSkillLevel: 1,
    sourceSpecialAppealSkillLevel: 0,
    sourceSkillSkillLevel: 1,
  });
});

it('ActionType28は参照実装 int32 castとAbility参照レベルを適用する', () => {
  expect(
    createTokenCardEffect({
      skillEffectId: 28n,
      skillType: 3,
      skillLevel: 2,
      specialAppealSkillLevel: 3,
      skillSkillLevel: 4,
      details: [
        { id: 1n, detailType: 'TOKEN_CARD_STYLE_TYPE', value: (1n << 32n) + 5n },
        { id: 2n, detailType: 'TOKEN_CARD_MOOD_TYPE', value: 2n },
        {
          id: 3n,
          detailType: 'TOKEN_CARD_SKILL_CARD_SKILL_SERIES_ID',
          value: (1n << 32n) + 42n,
        },
        { id: 4n, detailType: 'TOKEN_CARD_ABILITY_CARD_SKILL_SERIES_ID', value: 81n },
        { id: 5n, detailType: 'TOKEN_CARD_ABILITY_LEVEL_REFERENCE', value: 1n },
      ],
    }),
  ).toMatchObject({
    style: 5,
    mood: 2,
    skillSeriesId: 42,
    skillLevel: 4,
    abilitySeriesId: 81,
    abilityLevel: 1,
    sourceSkillType: 3,
    sourceSkillLevel: 2,
    sourceSpecialAppealSkillLevel: 3,
    sourceSkillSkillLevel: 4,
  });
});

it('ActionType28はAbility系列が0のTokenCardDataを追加する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const result = applyEffect(initial, tokenCardEffect(481, 1n), source);
  const generated = result.deck.find((card) => card.tokenCard);
  expect(generated?.tokenCardAbilitySeriesId).toBeNull();
  expect(result.deck).toHaveLength(initial.deck.length + 1);
  expect(result.deckBoard.nextCardInstanceId).toBe(initial.deckBoard.nextCardInstanceId + 1);
});

it('ActionType28はseries detailのlong値で補正対象を照合し、生成カードにはint32値を設定する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const seriesId = (1n << 32n) + 42n;
  const state = {
    ...initial,
    tokenBoosts: [
      {
        calculation: 'add' as const,
        value: 1,
        target: { kind: 'all' as const },
        seriesIds: [seriesId],
        remainingUses: null,
        remainingSeconds: null,
        remainingSections: null,
        deactivationKey: null,
      },
    ],
  };

  const result = applyEffect(state, tokenCardEffect(481, 2n, [seriesId]), source);
  const generated = result.deck.filter((card) => card.tokenCard);
  expect(generated).toHaveLength(3);
  expect(generated.every((card) => card.tokenSeriesIds?.join(',') === '42')).toBe(true);
});

it('ActionType28のカード枚数にActionType18の詳細値係数を適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const countDetailId = 12_345n;
  const effect = createTokenCardEffect({
    skillEffectId: 28n,
    skillType: 2,
    skillLevel: 1,
    specialAppealSkillLevel: 0,
    skillSkillLevel: 1,
    details: [
      {
        id: countDetailId,
        detailType: 'TOKEN_CARD_CARD_COUNT',
        value: 2n,
      },
      { id: 28_001_2n, detailType: 'TOKEN_CARD_RESOURCE_ID', value: 481n },
    ],
  });
  const resolvedEffect = {
    ...effect,
    skill: {
      seriesId: 0,
      mainEffect: 0,
      skillIcon: 0,
      variant: { consumeAp: 1, effects: [], skillIcon: 0, special: null },
    },
    ability: null,
  } as const;
  const state = {
    ...initial,
    tokenCatalog: [],
    parameterValueFactors: [
      { cardId: source.id, sourceEffectId: '18', targetDetailId: countDetailId, factor: 2 },
    ],
  };

  const result = applyEffect(state, resolvedEffect, source);

  expect(result.deck).toHaveLength(initial.deck.length + 4);
  expect(result.deck.slice(initial.deck.length).every((card) => card.tokenCard)).toBe(true);
});
