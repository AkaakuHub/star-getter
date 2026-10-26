import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType27/45/46の詳細と子EffectをcreateGameへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 27 as const,
              skillEffectId: 27_001n,
              destination: 'effects' as const,
              details: [
                {
                  id: 27_001_1n,
                  detailType: 'GET_ADDITIONAL_HEART_EFFECT_ID',
                  value: 27_002n,
                },
              ],
              heartAction: {
                skillEffectId: 27_002n,
                details: [
                  {
                    id: 27_002_1n,
                    detailType: 'HEART_CALC_TYPE',
                    value: 2n,
                  },
                  {
                    id: 27_002_2n,
                    detailType: 'HEART_NUM_BASE',
                    value: 10_000n,
                  },
                  {
                    id: 27_002_3n,
                    detailType: 'HEART_DISPLAY_TIME_TYPE',
                    value: 3n,
                  },
                ],
              },
            },
            {
              actionType: 45 as const,
              skillEffectId: 45_001n,
              destination: 'effects' as const,
              details: [
                { id: 45_001_1n, detailType: 'MODE_CHANGE_INDUCE_TARGET_MODE_ID', value: 1n },
              ],
              thresholds: [],
              childEffects: [],
            },
            {
              actionType: 46 as const,
              skillEffectId: 46_001n,
              destination: 'effects' as const,
              details: [
                { id: 46_001_1n, detailType: 'PROXY_SKILL_ABSORB_PERIOD_PARAM', value: 1n },
              ],
              absorbActionTypes: [],
              absorbAmounts: [],
              childEffects: [],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  const additionalHeart = compiled?.effects.find((item) => item.kind === 'additional-heart-induce');
  expect(additionalHeart).toMatchObject({
    heartEffect: {
      kind: 'skill-hearts',
      skillEffectId: 27_002n,
      calculation: 'fixed',
      amount: 10_000,
    },
  });
  expect(compiled?.effects.some((item) => item.kind === 'mode-reaction')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'proxy-skill')).toBe(true);
});
