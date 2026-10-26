import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType10の詳細値を熱気加算Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 10 as const,
              skillEffectId: 10_001n,
              destination: 'effects' as const,
              details: [
                { id: 10_001_1n, detailType: 'ADD_VOLTAGE_NUM', value: 12_345n },
                { id: 10_001_2n, detailType: 'ADD_VOLTAGE_NUM_TYPE', value: 1n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'add-voltage-skill')).toMatchObject({
    kind: 'add-voltage-skill',
    amount: 12_345,
    numberType: 1,
  });
});
