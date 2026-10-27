import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType5の詳細値を元気回復Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 5 as const,
              skillEffectId: 5_001n,
              destination: 'effects' as const,
              details: [
                { id: 5_001_1n, detailType: 'RECOVER_MENTAL_NUM_TYPE', value: 1n },
                { id: 5_001_2n, detailType: 'RECOVER_MENTAL_NUM', value: 12_345n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'recover-mental-skill')).toMatchObject({
    kind: 'recover-mental-skill',
    numberType: 1,
    amount: Math.fround(12_345),
  });
});
