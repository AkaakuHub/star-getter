import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { moodValue } from '@akaakuhub/suku-sute-core/game/projection';
import { voltageThreshold } from '@akaakuhub/suku-sute-core/game/live/voltageLevel';
import {
  notifyHandCardBeforeUse,
  notifyHandHeartCollect,
} from '@akaakuhub/suku-sute-core/game/cards/handInduce';
import { game, withHand } from './support/game';

it('ActionType37のSetで基礎熱気レベルが上がると手札誘発を起動する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('手札誘発カードがありません。');
  const card = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'voltage-increase' as const },
        effects: [{ kind: 'mood' as const, amount: 1 }],
      },
    ],
  };
  const state = withHand(
    {
      ...initial,
      deck: [card],
      cardPool: [card],
      currentVoltage: voltageThreshold(1),
    },
    [card.id],
  );
  const changed = applyEffect(state, { kind: 'voltage-set', amount: voltageThreshold(2) });
  expect(changed.moodOffset).toBe(1);
  expect(changed.handUseActivationCounts[`${card.id}:test-inducer`]).toBe(1);
});

it('Action903は回収数を合算し、閾値ごとに子効果を上限回数まで発動する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'heart-quantity-count' as const, count: 3n },
        effects: [{ kind: 'mood' as const, amount: 1 }],
        limit: 2n,
      },
    ],
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
  expect(next.handUseActivationCounts[`${source.id}:test-inducer`]).toBe(2);
  expect(next.handUseHeartCollectionCounts[`${source.id}:test-inducer`]).toBe(4);
  expect(next.deckOutCount).toBe(0);
});

it('Action903は子効果がないとき回収数の監視を登録しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'heart-quantity-count' as const, count: 1n },
        effects: [],
      },
    ],
  };
  const state = {
    ...initial,
    deck: initial.deck.map((card) => (card.id === source.id ? handCard : card)),
    cardPool: initial.cardPool.map((card) => (card.id === source.id ? handCard : card)),
    handEffectCardIds: [source.id],
  };
  const unchanged = notifyHandHeartCollect(state, 1, applyEffect);
  expect(unchanged.handUseActivationCounts[`${source.id}:test-inducer`]).toBeUndefined();
  expect(unchanged.handUseHeartCollectionCounts[`${source.id}:test-inducer`]).toBeUndefined();
});

it('Action903の回収閾値と発動上限を参照実装のint32へ変換する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'heart-quantity-count' as const, count: 4_294_967_296n },
        effects: [{ kind: 'mood' as const, amount: 1 }],
        limit: 4_294_967_296n,
      },
    ],
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
  expect(second.handUseActivationCounts[`${source.id}:test-inducer`]).toBe(2);
});

it('Action903は2^53超のlong閾値と発動上限をint32へ正確に変換する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'heart-quantity-count' as const, count: 9_007_199_254_740_993n },
        effects: [{ kind: 'mood' as const, amount: 1 }],
        limit: 9_007_199_254_740_993n,
      },
    ],
  };
  const state = {
    ...initial,
    deck: initial.deck.map((card) => (card.id === source.id ? handCard : card)),
    cardPool: initial.cardPool.map((card) => (card.id === source.id ? handCard : card)),
    handEffectCardIds: [source.id],
  };
  const first = notifyHandHeartCollect(state, 1, applyEffect);
  const second = notifyHandHeartCollect(first, 1, applyEffect);
  expect(first.moodOffset).toBe(1);
  expect(second.moodOffset).toBe(1);
  expect(second.handUseActivationCounts[`${source.id}:test-inducer`]).toBe(1);
});

it('Action903のUSEは発動前に発動元かつSkillType2の使用だけ反映する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'same-card' as const },
        effects: [{ kind: 'mood' as const, amount: 1 }],
      },
    ],
  };
  const state = {
    ...initial,
    deck: initial.deck.map((card) => (card.id === source.id ? handCard : card)),
    cardPool: initial.cardPool.map((card) => (card.id === source.id ? handCard : card)),
    handEffectCardIds: [source.id],
  };
  const skillTypeOne = notifyHandCardBeforeUse(state, handCard, 1, applyEffect);
  expect(skillTypeOne.handUseActivationCounts[`${source.id}:test-inducer`]).toBeUndefined();
  const skillTypeTwo = notifyHandCardBeforeUse(state, handCard, 2, applyEffect);
  expect(skillTypeTwo.moodOffset).toBe(
    applyEffect(state, { kind: 'mood', amount: 1 }, handCard).moodOffset,
  );
  expect(skillTypeTwo.handUseActivationCounts[`${source.id}:test-inducer`]).toBe(1);
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
        whenTrue: [{ kind: 'ap' as const, amount: 1 }],
        whenFalse: [],
      },
    ],
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'same-card' as const },
        effects: [{ kind: 'mood' as const, amount: 1 }],
      },
    ],
  };
  const state = withHand(
    {
      ...initial,
      deck: [card],
      cardPool: [card],
      lastActionTick: -1_000_000,
      ap: { ...initial.ap, currentAp: initial.ap.maxAp },
    },
    [card.id],
  );
  const next = act(state, { type: 'card', index: 0 });
  expect(next.ap.currentAp).toBe(initial.ap.maxAp - card.cost + 1);
});
