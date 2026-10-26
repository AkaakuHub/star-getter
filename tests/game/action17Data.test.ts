import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType17の条件付きコスト変更詳細を手札効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
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
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
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
