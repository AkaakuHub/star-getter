import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { finishCardActivation } from '../../src/domain/game/cards/cardZones';
import { game } from './support/game';

it('代理カードの捨て札行きで使用回数・上限を判定する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const armed = applyEffect(
    initial,
    {
      kind: 'card-move-induce',
      sourceEffectId: 'proxy-graveyard',
      timing: 'stage-to-graveyard',
      limit: 1,
      requireCount: 2,
      effects: [{ kind: 'boost', multiplier: 1.2 }],
    },
    source,
  );
  const moveProxyCard = (state: typeof armed) =>
    finishCardActivation(
      {
        ...state,
        hand: [...new Set([...state.hand, source.id])],
        skillUseDestinations: { ...state.skillUseDestinations, [source.id]: 'proxy' },
        activation: {
          sourceId: source.id,
          usedCards: [source.id],
          allHand: false,
          recoverDiscard: false,
          returnToDraw: [],
          excluded: [],
          handCountChanges: {},
        },
      },
      applyEffect,
    );

  const firstMove = moveProxyCard(armed);
  expect(firstMove.boosts).toHaveLength(0);
  expect(firstMove.cardMoveInducers[0]?.useCount).toBe(1);
  const secondMove = moveProxyCard(firstMove);
  expect(secondMove.boosts).toHaveLength(1);
  expect(secondMove.cardMoveInducers[0]?.useCount).toBe(2);
  expect(secondMove.cardMoveInducers[0]?.activatedCount).toBe(1);
  const thirdMove = moveProxyCard(secondMove);
  expect(thirdMove.boosts).toHaveLength(1);
  expect(thirdMove.cardMoveInducers[0]?.useCount).toBe(3);
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
      timing: 'stage-to-graveyard',
      limit: 0,
      requireCount: 0,
      effects: [{ kind: 'boost', multiplier: 1.2 }],
    },
    source,
  );
  const finished = finishCardActivation(
    {
      ...armed,
      hand: [...new Set([...armed.hand, source.id])],
      activation: {
        sourceId: source.id,
        usedCards: [source.id],
        allHand: false,
        recoverDiscard: false,
        returnToDraw: [],
        excluded: [],
        handCountChanges: {},
      },
    },
    applyEffect,
  );
  expect(finished.discard).toContain(source.id);
  expect(finished.boosts).toHaveLength(0);
  expect(finished.cardMoveInducers[0]?.useCount).toBe(0);
});
