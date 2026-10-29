import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType11の詳細値を熱気継続回復Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 11 as const,
              skillEffectId: 11_001n,
              destination: 'effects' as const,
              details: [
                { id: 11_001_1n, detailType: 'REGEN_VOLTAGE_NUM_BASE', value: 12_500n },
                { id: 11_001_2n, detailType: 'REGEN_VOLTAGE_INTERVAL_NUM', value: 1_000n },
                { id: 11_001_3n, detailType: 'REGEN_VOLTAGE_DISPLAY_TIME', value: 10_000n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'gauge-regeneration')).toMatchObject({
    kind: 'gauge-regeneration',
    gauge: 'voltage',
    amount: 1.25,
    amountBasis: 'skill-fixed',
    intervalValue: 1_000,
    duration: { kind: 'milliseconds', value: 10_000 },
  });
});
