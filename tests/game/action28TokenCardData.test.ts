import { expect, it } from 'vite-plus/test';
import { createTokenCardEffect } from '../../src/domain/game/actionTypeEffects/tokenCard';

it('ActionType28はカードテンプレートとlong枚数・series IDを接続する', () => {
  expect(
    createTokenCardEffect({
      skillEffectId: 28n,
      templateId: 'token-template',
      details: [
        { id: 1n, detailType: 'TOKEN_CARD_CARD_COUNT', value: 4_294_967_298n },
        { id: 2n, detailType: 'TOKEN_CARD_SERIES_ID', value: (1n << 53n) + 1n },
      ],
    }),
  ).toEqual({
    kind: 'token-card',
    templateId: 'token-template',
    count: 4_294_967_298n,
    seriesIds: [(1n << 53n) + 1n],
  });
});

it('ActionType28は枚数の既定値を1にし、カードテンプレート必須にする', () => {
  expect(
    createTokenCardEffect({ skillEffectId: 28n, templateId: 'token-template', details: [] }),
  ).toEqual({ kind: 'token-card', templateId: 'token-template', count: 1n });
  expect(() => createTokenCardEffect({ skillEffectId: 28n, templateId: '', details: [] })).toThrow(
    '追加カードのテンプレートがありません。',
  );
});
