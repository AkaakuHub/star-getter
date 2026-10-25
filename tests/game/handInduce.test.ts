import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { moodValue } from '../../src/domain/game/projection';
import {
  notifyHandCardBeforeUse,
  notifyHandHeartCollect,
} from '../../src/domain/game/cards/handInduce';
import { game, withHand } from './support/game';

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
    deckOutCount: 2,
  };
  let next = notifyHandHeartCollect(state, 2, applyEffect);
  expect(next.moodOffset).toBe(0);
  next = notifyHandHeartCollect(next, 1, applyEffect);
  next = notifyHandHeartCollect(next, 3, applyEffect);
  next = notifyHandHeartCollect(next, 4, applyEffect);
  expect(next.moodOffset).toBe(2);
  expect(next.handUseActivationCounts[source.id]).toBe(2);
  expect(next.handUseHeartCollectionCounts[source.id]).toBe(4);
  expect(next.deckOutCount).toBe(0);
});

it('Action903は子効果がないとき回収数の監視を登録しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handUse: {
      trigger: { kind: 'heart-quantity-count' as const, count: 1 },
      effects: [],
    },
  };
  const state = {
    ...initial,
    deck: initial.deck.map((card) => (card.id === source.id ? handCard : card)),
    cardPool: initial.cardPool.map((card) => (card.id === source.id ? handCard : card)),
    handEffectCardIds: [source.id],
  };
  const unchanged = notifyHandHeartCollect(state, 1, applyEffect);
  expect(unchanged.handUseActivationCounts[source.id]).toBeUndefined();
  expect(unchanged.handUseHeartCollectionCounts[source.id]).toBeUndefined();
});

it('Action903の回収閾値と発動上限をC#のint32へ変換する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handUse: {
      trigger: { kind: 'heart-quantity-count' as const, count: 4_294_967_296 },
      effects: [{ kind: 'mood' as const, amount: 1 }],
      limit: 4_294_967_296,
    },
  };
  const state = {
    ...initial,
    deck: initial.deck.map((card) => (card.id === source.id ? handCard : card)),
    cardPool: initial.cardPool.map((card) => (card.id === source.id ? handCard : card)),
    handEffectCardIds: [source.id],
  };
  const first = notifyHandHeartCollect(state, 1, applyEffect);
  const second = notifyHandHeartCollect(first, 1, applyEffect);
  expect(second.moodOffset).toBe(2);
  expect(second.handUseActivationCounts[source.id]).toBe(2);
});

it('Action903のUSEは発動前に発動元かつSkillType2の使用だけ反映する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handUse: {
      trigger: { kind: 'same-card' as const },
      effects: [{ kind: 'mood' as const, amount: 1 }],
    },
  };
  const state = {
    ...initial,
    deck: initial.deck.map((card) => (card.id === source.id ? handCard : card)),
    cardPool: initial.cardPool.map((card) => (card.id === source.id ? handCard : card)),
    handEffectCardIds: [source.id],
  };
  const skillTypeOne = notifyHandCardBeforeUse(state, handCard, 1, applyEffect);
  expect(skillTypeOne.handUseActivationCounts[source.id]).toBeUndefined();
  const skillTypeTwo = notifyHandCardBeforeUse(state, handCard, 2, applyEffect);
  expect(skillTypeTwo.moodOffset).toBe(
    applyEffect(state, { kind: 'mood', amount: 1 }, handCard).moodOffset,
  );
  expect(skillTypeTwo.handUseActivationCounts[source.id]).toBe(1);
});

it('Action903のUSE子効果はSkillType2の本体効果より先に適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const branchMood = moodValue(initial) + 1;
  const card = {
    ...source,
    effects: [
      {
        kind: 'branch' as const,
        condition: { kind: 'mood-at-least' as const, value: branchMood },
        whenTrue: [{ kind: 'energy' as const, amount: 1 }],
        whenFalse: [],
      },
    ],
    handUse: {
      trigger: { kind: 'same-card' as const },
      effects: [{ kind: 'mood' as const, amount: 1 }],
    },
  };
  const state = withHand(
    {
      ...initial,
      deck: [card],
      cardPool: [card],
      energy: initial.maxEnergy,
      lastActionTick: -1_000_000,
    },
    [card.id],
  );
  const next = act(state, { type: 'card', index: 0 });
  expect(next.energy).toBe(initial.maxEnergy - card.cost + 1);
});
