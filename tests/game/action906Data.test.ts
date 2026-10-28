import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType906の必要使用回数・上限と子効果IDを使用回数誘発へ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const child = { kind: 'ap' as const, amount: 2, skillEffectId: 90611n };
  const deck = routes.genesis.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 906 as const,
              skillEffectId: 90610n,
              details: [
                { id: 1n, detailType: 'USE_COUNT_INDUCE_REQUIRE_COUNT', value: 3n },
                { id: 2n, detailType: 'USE_COUNT_INDUCE_LIMIT_NUM', value: 2n },
                { id: 90611n, detailType: 'USE_COUNT_INDUCE_EFFECT_ID1', value: 0n },
              ],
              childEffects: [child],
              destination: 'effects' as const,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((effect) => effect.kind === 'use-count-induce')).toEqual({
    kind: 'use-count-induce',
    sourceEffectId: '90610',
    targetEffectId: 90611n,
    limit: 2n,
    effects: [child],
    requireCount: 3n,
  });
});
