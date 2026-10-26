import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType2の詳細値をSTAR上昇Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 2 as const,
              skillEffectId: 2_001n,
              destination: 'effects' as const,
              details: [
                { id: 2_001_1n, detailType: 'LOVE_UP_CALC_TYPE', value: 1n },
                { id: 2_001_2n, detailType: 'LOVE_UP_NUM_BASE', value: 12_500n },
                { id: 2_001_3n, detailType: 'LOVE_DISPLAY_TIME_TYPE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'skill-score-up')).toMatchObject({
    kind: 'skill-score-up',
    calculation: 1,
    amount: 12_500,
    duration: { kind: 'full-end' },
  });
});
