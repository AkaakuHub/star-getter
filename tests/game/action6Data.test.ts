import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType6の詳細値を元気継続回復Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 6 as const,
              skillEffectId: 6_001n,
              destination: 'effects' as const,
              details: [
                { id: 6_001_1n, detailType: 'REGEN_MENTAL_NUM_BASE', value: 12_500n },
                { id: 6_001_2n, detailType: 'REGEN_MENTAL_INTERVAL_NUM', value: 1_000n },
                { id: 6_001_3n, detailType: 'REGEN_MENTAL_DISPLAY_TIME', value: 10_000n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'gauge-regeneration')).toMatchObject({
    kind: 'gauge-regeneration',
    gauge: 'mental',
    amount: 1.25,
    amountBasis: 'maximum-gauge',
    intervalMilliseconds: 1_000,
    duration: { kind: 'milliseconds', value: 10_000 },
  });
});
