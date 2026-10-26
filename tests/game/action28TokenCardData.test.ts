import { expect, it } from 'vite-plus/test';
import { createTokenCardEffect } from '../../src/domain/game/actionTypeEffects/tokenCard';
import { requestTokenCard } from '../../src/domain/game/cards/tokens';
import { game } from './support/game';

it('ActionType28はカードテンプレートとlong枚数・series IDを接続する', () => {
  expect(
    createTokenCardEffect({
      skillEffectId: 28n,
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
    seriesIds: [(1n << 53n) + 1n],
  });
});

it('ActionType28は枚数とResourceIDの既定値を使う', () => {
  expect(createTokenCardEffect({ skillEffectId: 28n, details: [] })).toEqual({
    kind: 'token-card',
    templateId: '0',
    count: 1n,
  });
});

it('ActionType28はAbilityのSkillSeriesがないTokenCardCardDataを追加しない', () => {
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
  expect(result.deck).toHaveLength(initial.deck.length);
  expect(result.nextTokenId).toBe(initial.nextTokenId);
});
