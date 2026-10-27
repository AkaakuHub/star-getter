import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType902の確率・条件・反転詳細を抽選ルールへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 902 as const,
              details: [
                { id: 1n, detailType: 'ON_DRAW_INDUCE_PROBABILITY_TYPE', value: 3n },
                { id: 2n, detailType: 'ON_DRAW_INDUCE_PROBABILITY_NUM', value: 2500n },
                { id: 3n, detailType: 'ON_DRAW_INDUCE_CONDITION_TYPE', value: 5n },
                { id: 4n, detailType: 'ON_DRAW_INDUCE_CONDITION_NOT_FLAG', value: 2n },
                { id: 5n, detailType: 'ON_DRAW_INDUCE_CONDITION_VALUE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.drawRules).toEqual([
    { condition: { kind: 'unit', value: 3 }, negated: true, weight: 2500 },
  ]);
});
