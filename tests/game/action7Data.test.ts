import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType7の耐久・減衰・期限詳細を元気バリアEffectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 7 as const,
              skillEffectId: 7_001n,
              destination: 'effects' as const,
              details: [
                { id: 7_001_1n, detailType: 'MENTAL_BARRIER_ENDURANCE_NUM', value: 25_000n },
                { id: 7_001_2n, detailType: 'MENTAL_BARRIER_ATTENUATION_NUM', value: 5_000n },
                { id: 7_001_3n, detailType: 'MENTAL_BARRIER_DISPLAY_TIME_TYPE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'mental-barrier')).toMatchObject({
    kind: 'mental-barrier',
    enduranceType: 'ratio',
    endurance: 2.5,
    attenuation: 0.5,
    duration: { kind: 'stage' },
  });
});
