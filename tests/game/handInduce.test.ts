import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { notifyHandHeartCollect } from '../../src/domain/game/cards/handInduce';
import { game } from './support/game';

it('Action903は回収数を合算し、閾値ごとに子効果を上限回数まで発動する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handUse: {
      trigger: { kind: 'heart-quantity-count' as const, count: 3 },
      effects: [{ kind: 'mood' as const, amount: 1 }],
      limit: 2,
    },
  };
  const state = {
    ...initial,
    deck: initial.deck.map((card) => (card.id === source.id ? handCard : card)),
    cardPool: initial.cardPool.map((card) => (card.id === source.id ? handCard : card)),
    handEffectCardIds: [source.id],
  };
  let next = notifyHandHeartCollect(state, 2, applyEffect);
  expect(next.moodOffset).toBe(0);
  next = notifyHandHeartCollect(next, 1, applyEffect);
  next = notifyHandHeartCollect(next, 3, applyEffect);
  next = notifyHandHeartCollect(next, 4, applyEffect);
  expect(next.moodOffset).toBe(2);
  expect(next.handUseActivationCounts[source.id]).toBe(2);
  expect(next.handUseHeartCollectionCounts[source.id]).toBe(4);
});
