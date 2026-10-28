import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { createSkillCostChangeEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/skillCostChange';

it('ActionType17の条件付きコスト変更詳細を手札効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 17 as const,
              details: [
                { id: 1n, detailType: 'CHANGE_AP_NUM', value: -25000n },
                { id: 2n, detailType: 'CHANGE_AP_MAX', value: 10000n },
                { id: 3n, detailType: 'CHANGE_AP_MIN', value: -5000n },
                { id: 4n, detailType: 'CHANGE_AP_CONDITION_TYPE', value: 6n },
                { id: 5n, detailType: 'CHANGE_AP_CONDITION_ID', value: 103n },
                { id: 6n, detailType: 'CHANGE_AP_DISPLAY_TIME_TYPE', value: 2n },
                { id: 7n, detailType: 'CHANGE_AP_DISPLAY_TIME', value: 3n },
              ],
              destination: 'handPermanentEffects' as const,
              invocationType: 904,
              deactivationKey: 'ability:cost',
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.handPermanentEffects?.find((item) => item.kind === 'skill-cost-change')).toEqual(
    {
      kind: 'skill-cost-change',
      amount: -2.5,
      maximum: 1,
      minimum: -0.5,
      conditionType: 6,
      conditionId: 103,
      duration: { sections: 3 },
      invocationType: 904,
      deactivationKey: 'ability:cost',
    },
  );
});

it('ActionType17のlong値をfloat32へ直接変換してからNumToValueを適用する', () => {
  const longValue = (1n << 54n) + (1n << 30n) + 1n;
  const effect = createSkillCostChangeEffect({
    details: [
      { id: 1n, detailType: 'CHANGE_AP_NUM', value: longValue },
      { id: 2n, detailType: 'CHANGE_AP_CONDITION_TYPE', value: 1n },
    ],
  });
  expect(effect).toMatchObject({ amount: Math.fround((2 ** 54 + 2 ** 31) / 10_000) });
});
