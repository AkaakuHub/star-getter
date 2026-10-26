import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType901の条件分岐と子効果をドロー誘発効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 901 as const,
              skillEffectId: 901n,
              details: [
                { id: 1n, detailType: 'DRAW_SUCCESS_INDUCE_BRANCH_TYPE', value: 2n },
                { id: 2n, detailType: 'DRAW_SUCCESS_INDUCE_BRANCH_VALUE', value: 5000n },
                { id: 3n, detailType: 'DRAW_SUCCESS_INDUCE_DISABLED_TYPE', value: 1n },
              ],
              whenTrue: [{ kind: 'mood' as const, amount: 10 }],
              whenFalse: [{ kind: 'energy' as const, amount: 1 }],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.drawEffects?.[0]).toEqual({
    kind: 'draw-success-induce',
    sourceEffectId: '901',
    branchType: 2n,
    branchValue: 5000n,
    disabledType: 1n,
    whenTrue: [{ kind: 'mood', amount: 10 }],
    whenFalse: [{ kind: 'energy', amount: 1 }],
  });
});
