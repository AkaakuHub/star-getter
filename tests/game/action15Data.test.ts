import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType15の検索種別とIDを検索Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 15 as const,
              skillEffectId: 15_001n,
              destination: 'effects' as const,
              details: [
                { id: 15_001_1n, detailType: 'CARD_SEARCH_TYPE', value: 1n },
                { id: 15_001_2n, detailType: 'CARD_SEARCH_ID', value: 12n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'search')).toMatchObject({
    kind: 'search',
    scope: 'skill',
    target: { kind: 'main-effect', actionType: 12 },
    count: 1,
  });
});
