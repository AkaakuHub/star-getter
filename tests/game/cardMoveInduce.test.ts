import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { liveBoardState } from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { induceCardMoves } from '@akaakuhub/suku-sute-core/game/effects/cardMoveInduce';
import { finishCardActivation } from '@akaakuhub/suku-sute-core/game/cards/cardZones';
import { game } from './support/game';

function moveProxyCard(state: ReturnType<typeof game>, cardId: string) {
  return finishCardActivation(
    withBoardState(
      {
        ...state,
        activation: {
          sourceId: cardId,
          usedCards: [cardId],
          allHand: false,
          recoverDiscard: false,
          handCountChanges: {},
        },
      },
      { hand: [...new Set([...state.hand, cardId])] },
      { [cardId]: { skillUseAtBoardState: 7 as const } },
    ),
  );
}

it('Proxy領域へ入る移動では墓地行き誘発を発動しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const armed = applyEffect(
    initial,
    {
      kind: 'card-move-induce',
      sourceEffectId: 'proxy-graveyard',
      targetEffectId: 700n,
      timing: 'stage-to-graveyard',
      limit: 1n,
      requireCount: 2n,
      effects: [{ kind: 'boost', multiplier: 1.2, skillEffectId: 700n }],
    },
    source,
  );
  const moveProxyCard = (state: typeof armed) =>
    finishCardActivation(
      withBoardState(
        {
          ...state,
          activation: {
            sourceId: source.id,
            usedCards: [source.id],
            allHand: false,
            recoverDiscard: false,
            handCountChanges: {},
          },
        },
        { hand: [...new Set([...state.hand, source.id])] },
        { [source.id]: { skillUseAtBoardState: 7 as const } },
      ),
    );

  const firstMove = moveProxyCard(armed);
  expect(firstMove.boosts).toHaveLength(0);
  expect(firstMove.cardMoveInducers[0]?.useCount).toBe(0);
  const secondMove = moveProxyCard(firstMove);
  expect(secondMove.boosts).toHaveLength(0);
  expect(secondMove.cardMoveInducers[0]?.useCount).toBe(0);
  const thirdMove = moveProxyCard(secondMove);
  expect(thirdMove.boosts).toHaveLength(0);
  expect(thirdMove.cardMoveInducers[0]?.useCount).toBe(0);
});

it('通常カードの捨て札行きではカード移動誘発を発動しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const armed = applyEffect(
    initial,
    {
      kind: 'card-move-induce',
      sourceEffectId: 'proxy-graveyard-only',
      targetEffectId: 701n,
      timing: 'stage-to-graveyard',
      limit: 0n,
      requireCount: 0n,
      effects: [{ kind: 'boost', multiplier: 1.2, skillEffectId: 701n }],
    },
    source,
  );
  const finished = finishCardActivation(
    withBoardState(
      {
        ...armed,
        activation: {
          sourceId: source.id,
          usedCards: [source.id],
          allHand: false,
          recoverDiscard: false,
          handCountChanges: {},
        },
      },
      { hand: [...new Set([...armed.hand, source.id])] },
    ),
  );
  expect(boardCardIds(finished, liveBoardState.graveyard)).toContain(source.id);
  expect(finished.boosts).toHaveLength(0);
  expect(finished.cardMoveInducers[0]?.useCount).toBe(0);
});

it('Proxy領域へ入る時はint32化したLimitNumを使う誘発も発火しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const armed = applyEffect(
    initial,
    {
      kind: 'card-move-induce',
      sourceEffectId: 'proxy-limit-wrap',
      targetEffectId: 702n,
      timing: 'stage-to-graveyard',
      limit: 2_147_483_648n,
      requireCount: 0n,
      effects: [{ kind: 'boost', multiplier: 1.2, skillEffectId: 702n }],
    },
    source,
  );
  const moved = moveProxyCard(armed, source.id);
  expect(moved.boosts).toHaveLength(0);
  expect(moved.cardMoveInducers[0]?.useCount).toBe(0);
});

it('Proxy領域へ入る時はint32化したRequireNumを使う誘発も発火しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const armed = applyEffect(
    initial,
    {
      kind: 'card-move-induce',
      sourceEffectId: 'proxy-require-wrap',
      targetEffectId: 703n,
      timing: 'stage-to-graveyard',
      limit: 0n,
      requireCount: 4_294_967_297n,
      effects: [{ kind: 'boost', multiplier: 1.2, skillEffectId: 703n }],
    },
    source,
  );
  const moved = moveProxyCard(armed, source.id);
  expect(moved.boosts).toHaveLength(0);
  expect(moved.cardMoveInducers[0]?.useCount).toBe(0);
});

it('ActionType908の上限は通常実行済みの子効果回数も含める', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const child = { kind: 'boost' as const, multiplier: 1.2, skillEffectId: 706n };
  const usedNormally = applyEffect({ ...initial, boosts: [] }, child, source);
  const armed = applyEffect(
    usedNormally,
    {
      kind: 'card-move-induce',
      sourceEffectId: 'proxy-graveyard-shared-count',
      targetEffectId: 706n,
      timing: 'stage-to-graveyard',
      limit: 1n,
      requireCount: 0n,
      effects: [child],
    },
    source,
  );
  const inProxy = withBoardState({ ...armed }, { proxy: [source.id] });

  const moved = induceCardMoves(inProxy, new Set([source.id]), applyEffect);

  expect(moved.boosts).toEqual(inProxy.boosts);
  expect(moved.cardMoveInducers[0]?.useCount).toBe(1);
  expect(moved.skillEffectActivationCounts[`${source.id}:706`]).toBe(1);
});
