import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import {
  advanceAdditionalHeartInducers,
  induceAdditionalHearts,
} from '../../src/domain/game/effects/additionalHeart';
import { heartCount } from '../../src/domain/game/hearts';
import { matchesAdditionalHeartCondition } from '../../src/domain/game/additionalHeartTypes';
import { game } from './support/game';

it('一致したスキル使用APからEffectPowerを求め、登録したAction1の子効果を実行する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  const used = initial.deck[1];
  if (!source || !used) throw new Error('追加きらめき誘発の検証カードがありません。');
  const armed = applyEffect(
    initial,
    {
      kind: 'additional-heart-induce',
      condition: { kind: 'all' },
      apPower: 10_000n,
      heartEffect: { kind: 'hearts', amount: 1, lifetimeSeconds: 2 },
      duration: { kind: 'stage', value: 0 },
    },
    source,
  );
  const usedState = induceAdditionalHearts({ ...armed, deckOutCount: 1 }, used, 2, applyEffect);
  expect(heartCount(usedState)).toBe(3);
  expect(usedState.deckOutCount).toBe(0);
  expect(usedState.additionalHeartInducers).toHaveLength(1);
});

it('Action27のMember・SkillMainEffect・Unit条件は使用カードの値で判定する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('追加きらめき誘発の検証カードがありません。');
  const withMainEffect = { ...card, mainEffect: 25 };
  expect(matchesAdditionalHeartCondition({ kind: 'member', member: card.member }, card)).toBe(true);
  expect(
    matchesAdditionalHeartCondition({ kind: 'main-effect', actionType: 25 }, withMainEffect),
  ).toBe(true);
  if (card.unit !== null)
    expect(matchesAdditionalHeartCondition({ kind: 'unit', unit: card.unit }, card)).toBe(true);
});

it('Action27は発動元カード自身の使用後に誘発し、外部解除キーで停止する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('追加きらめき誘発の発動元カードがありません。');
  const deck = initial.deck.map((card) => ({
    ...card,
    cost: card.id === source.id ? 1 : card.cost,
    effects:
      card.id === source.id
        ? ([
            {
              kind: 'additional-heart-induce',
              condition: { kind: 'member', member: source.member },
              apPower: 10_000n,
              heartEffect: { kind: 'hearts', amount: 1 },
              duration: { kind: 'stage', value: 0 },
              deactivationKey: 'extra-heart',
            },
          ] as const)
        : ([{ kind: 'hearts', amount: 0 }] as const),
    passive: {},
  }));
  const sourceCard = deck.find((card) => card.id === source.id);
  if (!sourceCard) throw new Error('追加きらめき誘発カードが編成にありません。');
  const state = {
    ...initial,
    deck,
    cardPool: deck,
    hand: [source.id],
    drawPile: deck.filter((card) => card.id !== source.id).map((card) => card.id),
    energy: 100,
  };
  const used = act(state, { type: 'card', index: 0 });
  expect(heartCount(used)).toBeGreaterThan(1);
  const stopped = act(used, {
    type: 'deactivate-additional-heart',
    deactivationKey: 'extra-heart',
  });
  expect(stopped.additionalHeartInducers).toHaveLength(0);
});

it('ActionType27はlong積をfloat32へ直接変換する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  const used = initial.deck[1];
  if (!source || !used) throw new Error('追加きらめき誘発の検証カードがありません。');
  const armed = applyEffect(
    initial,
    {
      kind: 'additional-heart-induce',
      condition: { kind: 'all' },
      apPower: 0n,
      heartEffect: { kind: 'hearts', amount: 1 },
      duration: { kind: 'stage', value: 0 },
    },
    source,
  );
  const apPower = 9_007_199_791_611_905n;
  const configured = {
    ...armed,
    additionalHeartInducers: armed.additionalHeartInducers.map((inducer) => ({
      ...inducer,
      apPower,
    })),
  };
  const effectPowers: number[] = [];

  induceAdditionalHearts(
    configured,
    used,
    1,
    (state, _effect, _card, _multiplier, _addValue, power) => {
      effectPowers.push(power ?? 1);
      return state;
    },
  );

  expect(effectPowers).toEqual([900_720_033_792]);
});

it('Action27の0ミリ秒期限は誘発を登録しない', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('追加きらめき誘発の発動元カードがありません。');
  const armed = applyEffect(
    initial,
    {
      kind: 'additional-heart-induce',
      condition: { kind: 'all' },
      apPower: 10_000n,
      heartEffect: { kind: 'hearts', amount: 1 },
      duration: { kind: 'milliseconds', value: 0 },
    },
    source,
  );
  expect(armed.additionalHeartInducers).toHaveLength(0);
  expect(advanceAdditionalHeartInducers(armed, 1 / 60).additionalHeartInducers).toHaveLength(0);
});
