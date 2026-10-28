import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { fillHandToCount } from '@akaakuhub/suku-sute-core/game/cards/drawing';

it('ActionType901の条件分岐と子効果をAbility893へ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
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
              whenFalse: [{ kind: 'ap' as const, amount: 1 }],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.ability893Effects?.[0]).toEqual({
    kind: 'draw-success-induce',
    sourceEffectId: '901',
    branchType: 2n,
    branchValue: 5000n,
    disabledType: 1n,
    whenTrue: [{ kind: 'mood', amount: 10 }],
    whenFalse: [{ kind: 'ap', amount: 1 }],
  });
  expect(compiled?.drawEffects).toBeUndefined();
});

it('ActionType901はドロー時とカード使用時にAbility893から条件付き子効果を発動する', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const card: Card = {
    cardInstanceId: 'action-901',
    cardDatasId: 'action-901',
    name: 'ActionType901',
    performer: 'nova',
    charactersId: 1021,
    unitIds: [1],
    skillMainEffect: null,
    styleType: null,
    costume: 'star',
    consumeAp: 0,
    appeal: { smile: 1, pure: 1, cool: 1 },
    beatPoint: 100,
    effects: [{ kind: 'mood' as const, amount: 0 }],
    actionEffects: [
      {
        actionType: 901 as const,
        skillEffectId: 901n,
        details: [
          { id: 1n, detailType: 'DRAW_SUCCESS_INDUCE_BRANCH_TYPE', value: 1n },
          { id: 2n, detailType: 'DRAW_SUCCESS_INDUCE_DISABLED_TYPE', value: 1n },
        ],
        whenTrue: [{ kind: 'mood' as const, amount: 10 }],
        whenFalse: [],
      },
    ],
  };
  const deck = [
    card,
    { ...card, cardInstanceId: 'action-901-b', actionEffects: [] },
    { ...card, cardInstanceId: 'action-901-c', actionEffects: [] },
  ];
  const initial = createGame(track, deck, 7);
  const drawState = withBoardState(
    { ...initial, handCardStats: {}, handEffectCardIds: [], drawContext: 'idle' as const },
    { hand: [], deck: [card.cardInstanceId], graveyard: [] },
  );
  const drawn = fillHandToCount(drawState, 1);
  expect(drawn.moodOffset - initial.moodOffset).toBe(10);
  const started = act(initial, { type: 'start' });
  const used = act(started, { type: 'card', index: 0 });
  expect(used.moodOffset - started.moodOffset).toBe(10);
});
