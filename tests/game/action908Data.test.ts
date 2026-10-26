import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType908の墓地移動時点・要求数・上限と子効果IDを接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const child = { kind: 'energy' as const, amount: 2, skillEffectId: 90811n };
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 908 as const,
              skillEffectId: 90810n,
              details: [
                { id: 1n, detailType: 'EFFECT_INDUCE_TIMING', value: 1n },
                { id: 2n, detailType: 'EFFECT_INDUCE_LIMIT_NUM', value: 3n },
                { id: 3n, detailType: 'EFFECT_INDUCE_REQUIRE_NUM', value: 2n },
                { id: 90811n, detailType: 'EFFECT_INDUCE_ACTION', value: 0n },
              ],
              childEffects: [child],
              destination: 'effects' as const,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((effect) => effect.kind === 'card-move-induce')).toEqual({
    kind: 'card-move-induce',
    sourceEffectId: '90810',
    targetEffectId: 90811n,
    timing: 'stage-to-graveyard',
    limit: 3n,
    requireCount: 2n,
    effects: [child],
  });
});
