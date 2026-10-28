import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { createParameterValueChangeEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/parameterValueChange';

it('ActionType18の能力別詳細値変更を手札効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 18 as const,
              skillEffectId: 9001n,
              details: [
                { id: 1n, detailType: 'CHANGE_PARAM_VALUE_CALC_TYPE', value: 3n },
                { id: 2n, detailType: 'CHANGE_PARAM_VALUE_BASE_NUM', value: 12000n },
                { id: 3n, detailType: 'CHANGE_PARAM_VALUE_ADD_NUM', value: -2500n },
                { id: 4n, detailType: 'CHANGE_PARAM_VALUE_ACTION_ID', value: 123456n },
                {
                  id: 5n,
                  detailType: 'CHANGE_PARAM_VALUE_MULTIPLY_PARAMS_ID',
                  value: 0n,
                  paramValues: [75n],
                },
              ],
              destination: 'handPermanentEffects' as const,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(
    compiled?.handPermanentEffects?.find((item) => item.kind === 'parameter-value-change'),
  ).toEqual({
    kind: 'parameter-value-change',
    sourceEffectId: '9001',
    targetDetailId: 123456n,
    calculation: 'add',
    base: 12000,
    increment: -2500,
  });
});

it('ActionType18のlong倍率値をfloat32へ直接変換する', () => {
  const longValue = (1n << 54n) + (1n << 30n) + 1n;
  const effect = createParameterValueChangeEffect({
    skillEffectId: 18n,
    details: [
      { id: 1n, detailType: 'CHANGE_PARAM_VALUE_CALC_TYPE', value: 2n },
      {
        id: 2n,
        detailType: 'CHANGE_PARAM_VALUE_MULTIPLY_PARAMS_ID',
        value: 0n,
        paramValues: [longValue],
      },
    ],
  });
  expect(effect).toMatchObject({ values: [2 ** 54 + 2 ** 31] });
});

it('ActionType18は配列詳細がないfan-level効果を登録しない', () => {
  expect(createParameterValueChangeEffect({ skillEffectId: 18n, details: [] })).toBeNull();
});
