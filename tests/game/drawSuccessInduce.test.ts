import { withBoardState } from './support/board';
import { createLiveHandCardStats } from '@akaakuhub/suku-sute-core/runtime/cards/handCardStats';
import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { finishCardActivation } from '@akaakuhub/suku-sute-core/game/cards/cardZones';
import { fillHandToCount } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { conditionContext } from '@akaakuhub/suku-sute-core/game/conditions/gameContext';
import { isLiveDrawSuccessConditionSatisfied } from '@akaakuhub/suku-sute-core/runtime/skills/drawSuccessCondition';
import { game } from './support/game';

it('ActionType901は実際のMentalとGenesis状態で判定する', () => {
  const initial = game();
  const state = {
    ...initial,
    maximumMental: 100,
    mental: { ...initial.mental, currentMental: 80 },
    voltage: { ...initial.voltage, currentVoltage: 100_000_000n },
  };
  const mentalCondition = { branchType: 2n, branchValue: 500_000n };
  expect(
    isLiveDrawSuccessConditionSatisfied(mentalCondition, conditionContext(state), state.genesis),
  ).toBe(false);
  const low = { ...state, mental: { ...state.mental, currentMental: 40 } };
  expect(
    isLiveDrawSuccessConditionSatisfied(mentalCondition, conditionContext(low), low.genesis),
  ).toBe(true);
  const genesis = applyEffect(state, { kind: 'genesis', effectValue: 1 });
  expect(
    isLiveDrawSuccessConditionSatisfied(
      mentalCondition,
      conditionContext(genesis),
      genesis.genesis,
    ),
  ).toBe(true);
  const voltageCondition = { branchType: 5n, branchValue: 0n };
  expect(
    isLiveDrawSuccessConditionSatisfied(voltageCondition, conditionContext(state), state.genesis),
  ).toBe(false);
  expect(
    isLiveDrawSuccessConditionSatisfied(
      voltageCondition,
      conditionContext(genesis),
      genesis.genesis,
    ),
  ).toBe(true);
});

it('Action901は有効な手札でもGenesisがなければMental条件を判定する', () => {
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
  const base = withBoardState(
    {
      ...initial,
      deck: [card],
      cardPool: [card],
      handCardStats: {},
      handEffectCardIds: [],
      drawContext: 'idle' as const,
      ap: { ...initial.ap, currentAp: 100 },
      mental: { ...initial.mental, currentMental: 100 },
      maximumMental: 100,
    },
    { hand: [], deck: [card.cardInstanceId], graveyard: [] },
  );
  const result = fillHandToCount(base, 1);
  expect(result.moodOffset).toBe(
    applyEffect(base, card.ability893Effects[0].whenFalse[0], card).moodOffset,
  );
});

it('ActionType31はHandCardStats終了時にも追加バフを解除しない', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('検証用カードがありません。');
  const state = withBoardState(
    {
      ...initial,
      handCardStats: { [card.cardInstanceId]: { ...createLiveHandCardStats(0), isActive: false } },
      activation: {
        sourceId: card.cardInstanceId,
        usedCards: [card.cardInstanceId],
        allHand: false,
        recoverDiscard: false,
        handCountChanges: {},
      },
    },
    {},
  );
  const active = applyEffect(
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
          calculation: 1n,
          num: 500_000n,
          target: { kind: 'all' },
          duration: { kind: 'stage', value: 0n },
          disabledType: 0,
          disabledCount: 0n,
        },
      ],
      whenFalse: [],
    },
    card,
  );
  expect(active.voltageUpAdditionalBuffs).toHaveLength(1);
  expect(finishCardActivation(active).voltageUpAdditionalBuffs).toHaveLength(1);
});

it('disabledType省略時はbranchType3を継続扱いにする', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('検証用カードがありません。');
  const state = withBoardState(
    {
      ...initial,
      handCardStats: { [card.cardInstanceId]: { ...createLiveHandCardStats(0), isActive: false } },
      activation: {
        sourceId: card.cardInstanceId,
        usedCards: [card.cardInstanceId],
        allHand: false,
        recoverDiscard: false,
        handCountChanges: {},
      },
    },
    {},
  );
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
          duration: { kind: 'stage', value: 0n },
          uses: null,
        },
      ],
      whenFalse: [],
    },
    card,
  );
  expect(result.action52Buffs).toHaveLength(1);
});
