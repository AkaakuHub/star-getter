import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { createTokenCardEffect } from '../../src/domain/game/actionTypeEffects/tokenCard';
import {
  beginTokenGeneration,
  finishTokenGeneration,
  requestTokenCard,
} from '../../src/domain/game/cards/tokens';
import { game } from './support/game';

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
    templateId: '-2147483648',
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
    templateId: '0',
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

it('ActionType28はC# int32 castとAbility参照レベルを適用する', () => {
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

it('ActionType28はAbilityがないTokenCardCardDataを追加する', () => {
  const initial = game();
  const template = initial.tokenCatalog[0];
  const source = initial.deck[0];
  if (!template || !source) throw new Error('TokenCardCardDataがありません。');
  const state = {
    ...initial,
    tokenCatalog: [
      { ...template, id: 'token-without-skill-series', tokenCardAbilitySeriesId: null },
    ],
  };

  const result = requestTokenCard(state, 'token-without-skill-series', 1, source.id);
  expect(result.deck).toHaveLength(initial.deck.length + 1);
  expect(result.nextTokenId).toBe(initial.nextTokenId + 1);
});

it('ActionType28はseries detailのlong値で補正対象を照合し、生成カードにはint32値を設定する', () => {
  const initial = game();
  const template = initial.tokenCatalog[0];
  const source = initial.deck[0];
  if (!template || !source) throw new Error('TokenCardCardDataがありません。');
  const seriesId = (1n << 32n) + 42n;
  const state = {
    ...initial,
    tokenCatalog: [{ ...template, id: 'action28-series-template', tokenSeriesIds: [9] }],
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

  const grouped = beginTokenGeneration(state, source.id);
  const result = finishTokenGeneration(
    requestTokenCard(grouped, 'action28-series-template', 2n, source.id, [seriesId]),
    source.id,
  ).state;
  const generated = result.deck.filter((card) => card.id.startsWith('action28-series-template-'));
  expect(generated).toHaveLength(2);
  expect(generated.every((card) => card.tokenSeriesIds?.join(',') === '42')).toBe(true);
});

it('ActionType28のカード枚数にActionType18の詳細値係数を適用する', () => {
  const initial = game();
  const template = initial.tokenCatalog[0];
  const source = initial.deck[0];
  if (!template || !source) throw new Error('TokenCardCardDataがありません。');
  const tokenTemplate = { ...template, id: '481', tokenCardAbilitySeriesId: null };
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
  const state = {
    ...initial,
    tokenCatalog: [tokenTemplate],
    parameterValueFactors: [
      { cardId: source.id, sourceEffectId: '18', targetDetailId: countDetailId, factor: 2 },
    ],
  };

  const result = applyEffect(state, effect, source);

  expect(result.deck).toHaveLength(initial.deck.length + 4);
});
