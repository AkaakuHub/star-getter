import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { initializeHandCardStats } from '@akaakuhub/suku-sute-core/game/cards/skillCostChanges';
import { notifyHandSkillUse } from '@akaakuhub/suku-sute-core/game/cards/handInduce';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { game } from './support/game';

it('条件1から15までのコスト変化を対応する現在値から計算する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const other = initial.deck.find((card) => card.id === 'rain-preparation');
  const poolCard = initial.deck.find((card) => card.id !== source?.id && card.id !== other?.id);
  if (!source || !other || !poolCard) throw new Error('検証用カードがありません。');
  const cards = [
    {
      ...source,
      member: 1021 as const,
      unit: 1 as const,
      skillIcon: 600,
      mainEffect: 800,
      style: 2,
    },
    {
      ...other,
      member: 1030 as const,
      unit: 2 as const,
      skillIcon: 700,
      mainEffect: 900,
      style: 4,
    },
  ];
  const sourceCard = cards[0];
  if (!sourceCard) throw new Error('発動元カードがありません。');
  const state: GameState = {
    ...initial,
    deck: cards,
    cardPool: [...cards, poolCard],
    hand: cards.map((card) => card.id),
    handCardStats: {
      [source.id]: {
        isActive: true,
        enteredSectionIndex: 0,
        skillUseCountsByMember: { 1030: 2 },
        skillUseCountsByIcon: { 700: 2 },
        skillUseCountsByUnit: { 2: 2 },
      },
      [other.id]: {
        isActive: true,
        enteredSectionIndex: 0,
        skillUseCountsByMember: {},
        skillUseCountsByIcon: {},
        skillUseCountsByUnit: {},
      },
    },
    cardUseCounts: { [source.id]: 2, [other.id]: 2 },
    stamina: 50,
    moodOffset: 12,
    boosts: [{ percent: 20, untilTick: 999999 }],
  };
  const expected = [10, 20, 0, 5, 0, 20, 20, 10, 200, 10, 10, 120, 20, 10, 10];
  for (let index = 0; index < expected.length; index++) {
    const effect = {
      kind: 'skill-cost-change',
      amount: 10,
      minimum: -10000,
      maximum: 10000,
      conditionType: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15,
      conditionId:
        index === 5 || index === 10
          ? 1030
          : index === 6
            ? 700
            : index === 7
              ? 900
              : index === 9
                ? 4
                : index === 12 || index === 13
                  ? 2
                  : index === 11
                    ? 2
                    : 0,
    } as const;
    const updated = applyEffect(state, effect, sourceCard);
    expect({
      condition: index + 1,
      delta: cardCost(updated, sourceCard) - cardCost(state, sourceCard),
    }).toEqual({ condition: index + 1, delta: expected[index] });
  }
});

it('セクション期限のスキルコスト変化を期限後に除去する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('検証用カードがありません。');
  const state = applyEffect(
    initial,
    {
      kind: 'skill-cost-change',
      amount: -2,
      minimum: -10,
      maximum: 0,
      conditionType: 1,
      duration: { sections: 1 },
    },
    source,
  );
  expect(state.skillCostChanges).toHaveLength(1);
  expect(state.skillCostChanges[0]?.remainingSections).toBe(1);
  const nextSection = state.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const expired = advanceTo(state, (nextSection.startBeat * 60) / state.track.bpm);
  expect(expired.skillCostChanges).toHaveLength(0);
});

it('Action17の条件4は最大元気に対する整数元気割合を使う', () => {
  const initial = { ...game(), maximumMental: 200, stamina: 100 };
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const changed = applyEffect(
    initial,
    {
      kind: 'skill-cost-change',
      amount: 10,
      minimum: -100,
      maximum: 100,
      conditionType: 4,
    },
    source,
  );
  expect(cardCost(changed, source) - cardCost(initial, source)).toBe(5);
});

it('Action17の条件9はC#のfloat精度に丸めたBonusScoreValueを使う', () => {
  const initial = {
    ...game(),
    boosts: [{ percent: 16_777_216, untilTick: 999_999 }],
    skillScoreUps: [
      {
        percent: 1,
        untilTick: 999_999,
        remainingSeconds: null,
        remainingSections: null,
        removeOnHeartCollect: false,
        deactivationKey: null,
      },
    ],
  };
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('検証用カードがありません。');
  const changed = applyEffect(
    initial,
    {
      kind: 'skill-cost-change',
      amount: 1,
      minimum: 0,
      maximum: 20_000_000,
      conditionType: 9,
    },
    source,
  );
  expect(cardCost(changed, source) - cardCost(initial, source)).toBe(16_777_216);
});

it('Action17のメンバー使用数は使用カードが手札を離れた後も手札統計に残す', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const used = initial.deck.find((card) => card.id === 'rain-preparation');
  if (!source || !used) throw new Error('検証用カードがありません。');
  const hand = {
    ...initial,
    hand: [source.id],
    handEffectCardIds: [],
    handCardStats: {},
  };
  const withStats = initializeHandCardStats(hand, [source.id]);
  const withCostChange = applyEffect(
    withStats,
    {
      kind: 'skill-cost-change',
      amount: 10,
      minimum: 0,
      maximum: 100,
      conditionType: 6,
      conditionId: used.member,
    },
    source,
  );
  const afterUse = notifyHandSkillUse(withCostChange, used, applyEffect);
  expect(afterUse.hand).toEqual([source.id]);
  expect(afterUse.handCardStats[source.id]?.skillUseCountsByMember[used.member]).toBe(1);
  expect(cardCost(afterUse, source) - cardCost(withCostChange, source)).toBe(10);
});

it('Action17は負数をActionType52で増幅してint32化する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const withAction52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const changed = applyEffect(
    withAction52,
    {
      kind: 'skill-cost-change',
      amount: -20,
      minimum: -100,
      maximum: 0,
      conditionType: 1,
    },
    source,
  );
  expect(changed.skillCostChanges[0]?.amount).toBe(-30);
  expect(changed.action52Buffs).toHaveLength(0);
});

it('Action17の解除キーで通常効果を解除し、InvocationType 0x388は期限とDeactivator解除を無視する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('検証用カードがありません。');
  const normal = applyEffect(
    initial,
    {
      kind: 'skill-cost-change',
      amount: -1,
      minimum: -10,
      maximum: 0,
      conditionType: 1,
      deactivationKey: 'cost-normal',
    },
    source,
  );
  expect(
    act(normal, { type: 'deactivate-skill-cost-change', deactivationKey: 'cost-normal' })
      .skillCostChanges,
  ).toHaveLength(0);

  const permanent = applyEffect(
    initial,
    {
      kind: 'skill-cost-change',
      amount: -1,
      minimum: -10,
      maximum: 0,
      conditionType: 1,
      duration: { sections: 1 },
      invocationType: 0x388,
      deactivationKey: 'cost-permanent',
    },
    source,
  );
  const nextSection = initial.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const advanced = advanceTo(permanent, (nextSection.startBeat * 60) / initial.track.bpm);
  expect(advanced.skillCostChanges).toHaveLength(1);
  expect(
    act(advanced, { type: 'deactivate-skill-cost-change', deactivationKey: 'cost-permanent' })
      .skillCostChanges,
  ).toHaveLength(1);
});

it('ActionType29は対象範囲に応じて一度だけ消費エナジーを変更する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const targetId = initial.hand[0];
  const target = initial.deck.find((card) => card.id === targetId);
  if (!source || !target) throw new Error('検証用カードがありません。');
  const changed = applyEffect(
    initial,
    {
      kind: 'deck-skill-cost-change',
      num: 20_000,
      targetRange: 2,
      target: 'member',
      targetId: target.member,
    },
    source,
  );
  expect(changed.onceSkillCostChanges[target.id]).toBe(2);
  expect(cardCost(changed, target)).toBe(cardCost(initial, target) + 2);
  const used = act(
    { ...changed, energy: 1000 },
    { type: 'card', index: initial.hand.indexOf(target.id) },
  );
  expect(used.onceSkillCostChanges[target.id]).toBeUndefined();
});

it('ActionType29は山札上の対象カードだけに適用し、負数をActionType52で増幅する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const targetId = initial.drawPile[0];
  const target = initial.deck.find((card) => card.id === targetId);
  if (!source || !target) throw new Error('検証用カードがありません。');
  const boosted = applyEffect(initial, {
    kind: 'skill-boost',
    num: 1_000_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const changed = applyEffect(
    boosted,
    { kind: 'deck-skill-cost-change', num: -20_000, targetRange: 3, target: 'all', targetId: 0 },
    source,
  );
  expect(changed.onceSkillCostChanges[target.id]).toBe(-4);
  expect(changed.onceSkillCostChanges[initial.hand[0] ?? '']).toBeUndefined();
  expect(changed.action52Buffs).toHaveLength(0);
});

it('ActionType29の全範囲にはProxy中のカードも含める', () => {
  const initial = game();
  const target = initial.deck[0];
  if (!target) throw new Error('対象カードがありません。');
  const proxyState = {
    ...initial,
    proxyCards: [target.id],
  };
  const changed = applyEffect(proxyState, {
    kind: 'deck-skill-cost-change',
    num: 10_000,
    targetRange: 1,
    target: 'all',
    targetId: 0,
  });

  expect(changed.onceSkillCostChanges[target.id]).toBe(1);
});
