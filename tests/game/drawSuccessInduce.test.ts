import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { act } from '../../src/domain/game/actions';
import { evaluateDrawSuccessInduce } from '../../src/domain/game/effects/drawSuccessInduce';
import { game, withHand } from './support/game';

it('C#のDrawSuccessInduce条件でHandCardStats.IsActiveによる分岐差を適用する', () => {
  const state = { ...game(), stamina: 40, maximumMental: 100, excitement: 100_000_000 };
  expect(evaluateDrawSuccessInduce(state, false, 2n, 500_000n)).toBe(true);
  expect(evaluateDrawSuccessInduce({ ...state, stamina: 80 }, false, 2n, 500_000n)).toBe(false);
  expect(evaluateDrawSuccessInduce({ ...state, stamina: 80 }, true, 2n, 500_000n)).toBe(true);
  expect(evaluateDrawSuccessInduce(state, false, 5n, 0n)).toBe(false);
  expect(evaluateDrawSuccessInduce(state, true, 5n, 0n)).toBe(true);
  expect(evaluateDrawSuccessInduce(state, true, 2n + 4_294_967_296n, 500_000n)).toBe(true);
});

it('Action901はAbility893の発火時にカード使用時点のHandCardStatsを参照する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('検証用カードがありません。');
  const card = {
    ...source,
    effects: [],
    ability893Effects: [
      {
        kind: 'draw-success-induce',
        sourceEffectId: 'test',
        branchType: 2n,
        branchValue: 500_000n,
        disabledType: 1n,
        whenTrue: [{ kind: 'mood', amount: 1 }],
        whenFalse: [{ kind: 'mood', amount: 2 }],
      },
    ],
  } as const;
  const base = {
    ...initial,
    deck: [card],
    cardPool: [card],
    energy: 100,
    lastActionTick: -1_000_000,
  };
  const state = withHand(base, [card.id]);
  const result = act(state, { type: 'card', index: 0 });
  expect(result.moodOffset).toBe(
    applyEffect(state, card.ability893Effects[0].whenTrue[0], card).moodOffset,
  );
});

it('disabledType0はHandCardStats終了時にAction31追加バフを解除する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('検証用カードがありません。');
  const state = {
    ...initial,
    activation: {
      sourceId: card.id,
      usedCards: [card.id],
      handCardStatsAtUse: {
        [card.id]: { isActive: false, enteredSectionIndex: 0, cardUseCountsAtEntry: {} },
      },
      allHand: false,
      recoverDiscard: false,
      returnToDraw: [],
      excluded: [],
      handCountChanges: {},
    },
  };
  const result = applyEffect(
    state,
    {
      kind: 'draw-success-induce',
      sourceEffectId: 'test',
      branchType: 1n,
      branchValue: 0n,
      disabledType: 0n,
      whenTrue: [
        {
          kind: 'voltage-up-additional-buff',
          calculation: 1,
          num: 500_000,
          target: { kind: 'all' },
          duration: { kind: 'stage', value: 0 },
          disabledType: 0,
          disabledCount: 0,
        },
      ],
      whenFalse: [],
    },
    card,
  );
  expect(result.voltageUpAdditionalBuffs).toHaveLength(0);
});

it('disabledType省略時はbranchType3を継続扱いにする', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('検証用カードがありません。');
  const state = {
    ...initial,
    activation: {
      sourceId: card.id,
      usedCards: [card.id],
      handCardStatsAtUse: {
        [card.id]: { isActive: false, enteredSectionIndex: 0, cardUseCountsAtEntry: {} },
      },
      allHand: false,
      recoverDiscard: false,
      returnToDraw: [],
      excluded: [],
      handCountChanges: {},
    },
  };
  const result = applyEffect(
    state,
    {
      kind: 'draw-success-induce',
      sourceEffectId: 'test',
      branchType: 3n,
      branchValue: 0n,
      whenTrue: [
        {
          kind: 'skill-boost',
          num: 500_000,
          target: { kind: 'all' },
          duration: { kind: 'stage', value: 0 },
          uses: null,
        },
      ],
      whenFalse: [],
    },
    card,
  );
  expect(result.action52Buffs).toHaveLength(1);
});
