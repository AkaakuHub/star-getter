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
              details: [],
              heartEffect: { kind: 'hearts' as const, amount: 1 },
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
  expect(compiled?.effects.some((item) => item.kind === 'additional-heart-induce')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'mode-reaction')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'proxy-skill')).toBe(true);
});
