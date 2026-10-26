import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType14のAP回復詳細値と空模様補正をAP効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 14 as const,
              details: [
                { id: 1n, detailType: 'RECOVER_AP_NUM_BASE', value: 25000n },
                {
                  id: 2n,
                  detailType: 'RECOVER_AP_NUM_BONUS_MOOD',
                  targetMood: 1,
                  value: 5000n,
                },
              ],
              destination: 'effects' as const,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'energy')).toEqual({
    kind: 'energy',
    amount: 2.5,
    moodBonus: { target: 1, perPoint: 0.5 },
  });
});
