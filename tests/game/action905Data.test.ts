import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType905の回数上限と子効果IDを使用誘発へ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const child = { kind: 'mood' as const, amount: 2, skillEffectId: 90511n };
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 905 as const,
              skillEffectId: 90510n,
              details: [
                { id: 1n, detailType: 'USE_INDUCE_LIMIT_NUM', value: 2n },
                { id: 90511n, detailType: 'USE_INDUCE_EFFECT_ID1', value: 0n },
              ],
              childEffects: [child],
              destination: 'effects' as const,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((effect) => effect.kind === 'use-induce')).toEqual({
    kind: 'use-induce',
    sourceEffectId: '90510',
    targetEffectId: 90511n,
    limit: 2n,
    effects: [child],
  });
});
