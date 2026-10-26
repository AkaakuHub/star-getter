import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType1の詳細値をSkillHeart Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 1 as const,
              skillEffectId: 1_001n,
              destination: 'effects' as const,
              details: [
                { id: 1_001_1n, detailType: 'HEART_CALC_TYPE', value: 2n },
                { id: 1_001_2n, detailType: 'HEART_NUM_BASE', value: 10_000n },
                { id: 1_001_3n, detailType: 'HEART_DISPLAY_TIME_TYPE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'skill-hearts')).toMatchObject({
    kind: 'skill-hearts',
    calculation: 'fixed',
    amount: 10_000,
    displayTime: { kind: 'full-end' },
  });
});
