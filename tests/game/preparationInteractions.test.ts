import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { advanceAutomaticGauges } from '@akaakuhub/suku-sute-core/game/automaticGauges';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { activateGenesis } from '@akaakuhub/suku-sute-core/game/genesis';
import { applyDrawAbility } from '@akaakuhub/suku-sute-core/game/cards/drawAbilities';
import { disposeHandEffects } from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import {
  notifyHandCardBeforeUse,
  notifyHandSkillUse,
} from '@akaakuhub/suku-sute-core/game/cards/useAbilities';
import { flushDeckActions } from '@akaakuhub/suku-sute-core/game/cards/boardActions';
import { fillHand } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { applyEffect, skillValue } from '@akaakuhub/suku-sute-core/game/effects';
import { addHearts, heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { cardCooldownTicks, moodValue, sectionAt } from '@akaakuhub/suku-sute-core/game/projection';
import type { HandUseTrigger } from '@akaakuhub/suku-sute-core/game/cards/cardTypes';
import { tracks } from '../../src/content/tracks';
import { game, withHand } from './support/game';

it('自然な空模様に雨100%はなく、準備カードの使用で最初のパート中に段階的に下げる', () => {
  expect(tracks.flatMap((track) => track.moodKeys).every((key) => key.keyValue > -100)).toBe(true);
  let state = game();
  for (const expected of [-50, -100]) {
    state = withHand(
      { ...state, currentAp: 20, maxAp: 20, tick: state.tick + cardCooldownTicks(state) },
      ['rain-preparation'],
    );
    state = act(state, { type: 'card', index: 0 });
    expect(moodValue(state)).toBe(expected);
    expect(sectionAt(state)).toBe(state.track.sections[0]);
  }
  expect(state.cardUseCounts['rain-preparation']).toBe(2);
  expect(state.mentalShields).toHaveLength(2);
});

it('ドロー時の11段階増幅は雨音だけに適用し、同じ雨の凍空には適用しない', () => {
  const initial = game();
  const card = initial.deck.find((item) => item.id === 'rain-preparation');
  const echo = initial.deck.find((item) => item.id === 'frost-echo');
  const pulse = initial.deck.find((item) => item.id === 'frost-pulse');
  if (!card || !echo || !pulse) throw new Error('カードがありません。');
  const state = {
    ...initial,
    hand: [],
    handEffectCardIds: [],
    targetBoosts: [],
    currentVoltage: 655_000_001,
    moodOffset: -150,
    hearts: { ...initial.hearts, heartLimit: 10_000_000, stageHearts: [], hiddenHeartBatches: [] },
  };
  const drawn = applyDrawAbility(state, card);
  expect(heartCount(drawn)).toBe(563);
  expect(skillValue(drawn, 100, { kind: 'ap', amount: 100 }, echo)).toBe(225);
  expect(skillValue(drawn, 100, { kind: 'ap', amount: 100 }, pulse)).toBe(100);
});

it('手札中の雨の使用反応で、対応する基本カードとパズルだけの消費を減らす', () => {
  let state = addTokens(game(), 'shadow', 1);
  const used = state.deck.find((card) => card.id === 'frost-echo');
  const shadow = state.deck.find((card) => card.token === 'shadow');
  if (!used || !shadow) throw new Error('カードがありません。');
  state = withHand({ ...state, costReductions: {} }, ['rain-preparation']);
  const reacted = notifyHandSkillUse(state, used, applyEffect);
  expect(reacted.costReductions['rain-preparation']).toBe(9);
  expect(reacted.costReductions['frost-pulse']).toBe(9);
  expect(reacted.costReductions[shadow.id]).toBe(9);
  expect(reacted.costReductions.horizon).toBe(0);
  expect(reacted.deckActions.shuffles).toHaveLength(1);
});

it('手札誘発はメンバー・スキル記号・ユニット・同一カード・任意のスキルを判定し、上限を守る', () => {
  const initial = addTokens(game(), 'shadow', 1);
  const source = initial.deck.find((card) => card.id === 'rain-preparation');
  const baseUsed = initial.deck.find((card) => card.id === 'frost-echo');
  if (!source || !baseUsed) throw new Error('カードがありません。');
  const used = { ...baseUsed, skillIcon: 77 };
  const triggers: readonly HandUseTrigger[] = [
    { kind: 'member', member: BigInt(used.member) + 9_007_199_254_740_992n },
    { kind: 'skill-icon', icon: 77n },
    { kind: 'unit', unit: 2n },
    { kind: 'same-card' },
    { kind: 'any-skill' },
  ];
  for (const trigger of triggers) {
    const handCard = {
      ...source,
      handInducers: [
        {
          sourceEffectId: 'test-inducer',
          trigger,
          limit: 1n,
          limitMemory: 'reset' as const,
          effects: [{ kind: 'ap' as const, amount: 1 }],
        },
      ],
    };
    const deck = initial.deck.map((card) => (card.id === source.id ? handCard : card));
    const cardPool = initial.cardPool.map((card) => (card.id === source.id ? handCard : card));
    const state = withHand({ ...initial, deck, cardPool, currentAp: 0 }, [source.id]);
    const currentUsed = trigger.kind === 'same-card' ? handCard : used;
    const first =
      trigger.kind === 'same-card'
        ? notifyHandCardBeforeUse(state, currentUsed, 2, applyEffect)
        : notifyHandSkillUse(state, currentUsed, applyEffect);
    const second =
      trigger.kind === 'same-card'
        ? notifyHandCardBeforeUse(first, currentUsed, 2, applyEffect)
        : notifyHandSkillUse(first, currentUsed, applyEffect);
    expect(first.currentAp).toBe(1);
    expect(second.currentAp).toBe(1);
    expect(second.handUseActivationCounts[`${source.id}:test-inducer`]).toBe(1);
    expect(
      disposeHandEffects(second, [source.id]).handUseActivationCounts[`${source.id}:test-inducer`],
    ).toBeUndefined();
  }
});

it('熱気段階の上昇ごとに誘発し、自然増加と上限回数を適用する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'rain-preparation');
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'voltage-increase' as const },
        effects: [{ kind: 'ap' as const, amount: 1 }],
      },
    ],
  };
  const deck = initial.deck.map((card) => (card.id === source.id ? handCard : card));
  const cardPool = initial.cardPool.map((card) => (card.id === source.id ? handCard : card));
  const state = withHand(
    {
      ...initial,
      deck,
      cardPool,
      currentAp: 0,
      maximumVoltageLevel: 1500,
      currentVoltage: 655_000_001,
    },
    [source.id],
  );
  const changed = applyEffect(state, { kind: 'voltage', amount: 16_000_000 });
  expect(changed.currentAp).toBe(2);
  expect(changed.handUseActivationCounts[`${source.id}:test-inducer`]).toBe(2);
  const natural = advanceAutomaticGauges(
    { ...state, currentVoltage: 655_000_000 },
    state.track.stage.voltageIncreaseIntervalSeconds + 0.1,
    applyEffect,
  );
  expect(natural.handUseActivationCounts[`${source.id}:test-inducer`]).toBe(1);
});

it('パート切替時に手札誘発を一度実行する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'rain-preparation');
  if (!source) throw new Error('発動元カードがありません。');
  const handCard = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'section-change' as const },
        limit: 1n,
        effects: [{ kind: 'mood' as const, amount: 1 }],
      },
    ],
  };
  const deck = initial.deck.map((card) => (card.id === source.id ? handCard : card));
  const cardPool = initial.cardPool.map((card) => (card.id === source.id ? handCard : card));
  const state = withHand({ ...initial, deck, cardPool, currentAp: 0 }, [source.id]);
  const changed = advanceTo(state, 25);
  expect(sectionAt(changed)).not.toBe(sectionAt(state));
  expect(changed.moodOffset).toBe(1);
  expect(changed.handUseActivationCounts[`${source.id}:test-inducer`]).toBe(1);
});

it('手札離脱時に子効果の詳細値と発動数を初期値へ戻す', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'rain-preparation');
  const used = initial.deck.find((card) => card.id === 'frost-echo');
  if (!source || !used) throw new Error('カードがありません。');
  const child = {
    kind: 'parameter-value-change' as const,
    sourceEffectId: 'hand-child',
    targetDetailId: 1n,
    calculation: 'add' as const,
    base: 10_000,
    increment: 10_000,
  };
  const handCard = {
    ...source,
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'any-skill' as const },
        limitMemory: 'reset' as const,
        effects: [child],
      },
    ],
  };
  const deck = initial.deck.map((card) => (card.id === source.id ? handCard : card));
  const cardPool = initial.cardPool.map((card) => (card.id === source.id ? handCard : card));
  const hand = withHand({ ...initial, deck, cardPool }, [source.id]);
  const first = notifyHandSkillUse(hand, used, applyEffect);
  const second = notifyHandSkillUse(first, used, applyEffect);
  expect(second.parameterValueChangeCounts[source.id]?.['hand-child']).toBe(2);
  expect(second.parameterValueFactors.find((factor) => factor.cardId === source.id)?.factor).toBe(
    3,
  );
  const disposed = disposeHandEffects(second, [source.id]);
  expect(disposed.parameterValueChangeCounts[source.id]?.['hand-child']).toBe(0);
  expect(disposed.parameterValueFactors.find((factor) => factor.cardId === source.id)?.factor).toBe(
    1,
  );
});

it('シールドはスキル由来の元気減少を防ぎ、自然減少では耐久値を消費しない', () => {
  const initial = {
    ...game(),
    hand: [],
    handEffectCardIds: [],
    targetBoosts: [],
    mental: { ...game().mental, currentMental: 100 },
  };
  const shield = applyEffect(initial, {
    kind: 'mental-shield',
    durabilityType: 2n,
    durability: 100_000n,
    duration: { kind: 'stage' },
    applyCount: 0n,
  });
  const damaged = applyEffect(shield, { kind: 'mental', amount: -14 });
  expect(damaged.mental.currentMental).toBe(96);
  expect(damaged.mentalShields).toHaveLength(0);
  const natural = advanceAutomaticGauges(
    { ...shield, mental: { ...shield.mental, timerSeconds: 0 } },
    1.2,
  );
  expect(natural.mental.currentMental).toBe(99);
  expect(natural.mentalShields[0]?.durability).toBe(10);
  const active = activateGenesis({ ...shield, moodOffset: -150 }, 1);
  const converted = applyEffect(active, { kind: 'mental', amount: -14 });
  expect(converted.mental.currentMental).toBe(100);
  expect(converted.mentalShields).toHaveLength(0);
  expect(converted.genesis.currentGauge).toBe(active.genesis.currentGauge - 4);
});

it('同時に登録した引き直しをまとめず全回実行し、後登録の検索を先に4回消費する', () => {
  let state = game();
  state = applyEffect(state, { kind: 'shuffle', recoverDiscard: false, destination: 'discard' });
  state = applyEffect(state, { kind: 'shuffle', recoverDiscard: false, destination: 'discard' });
  state = applyEffect(state, { kind: 'search-unit', unit: 2, count: 4 });
  expect(state.deckActions.shuffles).toHaveLength(2);
  expect(state.deckActions.searches).toHaveLength(4);
  const flushed = flushDeckActions(state);
  expect(flushed.deckActions.shuffles).toHaveLength(0);
  expect(flushed.deckActions.searches).toHaveLength(0);
  expect(flushed.targetBoosts.length).toBeGreaterThan(state.targetBoosts.length);
});

for (const [points, expected] of [
  [655_000_001, 653_600_001],
  [663_000_001, 647_600_001],
]) {
  it(`回収時の追加減少は最初の140万減少後の段階で判定する（${points}）`, () => {
    if (points === undefined || expected === undefined)
      throw new Error('熱気のテスト値がありません。');
    const initial = game();
    const deck = initial.deck.filter((card) =>
      ['frost-echo', 'library-ensemble', 'camera'].includes(card.id),
    );
    let state = withHand(
      {
        ...initial,
        deck,
        mentalProtected: true,
        currentVoltage: points,
        maximumVoltageLevel: 1500,
        hearts: {
          ...initial.hearts,
          heartLimit: 1_000_000,
          stageHearts: [],
          hiddenHeartBatches: [],
        },
        mental: { ...initial.mental, currentMental: 0 },
      },
      ['frost-echo'],
    );
    state = act(addHearts(state, 500_000), { type: 'collect' });
    expect(state.currentVoltage).toBe(expected);
  });
}

it('通常の引き直しは元の手札枚数を維持し、発動元の編成でドロー条件を判定する', () => {
  let state = withHand({ ...game(), handLimit: 8 }, ['frost-echo', 'camera']);
  const source = state.deck.find((card) => card.id === 'frost-echo');
  if (!source) throw new Error('発動元がありません。');
  state = applyEffect(
    state,
    { kind: 'shuffle', recoverDiscard: false, destination: 'discard' },
    source,
  );
  const replaced = flushDeckActions(state);
  expect(replaced.hand).toHaveLength(2);
  expect(replaced.lastUsedMember).toBe(source.member);
  expect(replaced.lastUsedUnit).toBe(2);
  expect(replaced.deckActions.shuffles).toHaveLength(0);
});

it('全枚数の補充を終えてからドロー能力を順番に実行し、途中の上限減少で抽選を打ち切らない', () => {
  let state = addTokens(game(), 'shadow', 1);
  const ids = [
    'horizon',
    'library-ensemble',
    'frost-echo',
    'frost-pulse',
    'rain-preparation',
    'perennial',
    'class',
  ];
  const deck = state.deck
    .filter((card) => ids.includes(card.id) || card.token === 'shadow')
    .map((card) => ({
      ...card,
      drawEffects: [{ kind: 'amplify' as const, percent: 1 }],
      ...(card.token === 'shadow'
        ? { drawRules: [{ condition: { kind: 'initial' as const }, negated: true, weight: -1 }] }
        : {}),
    }));
  state = {
    ...state,
    deck,
    cardPool: deck,
    hand: [],
    handEffectCardIds: [],
    drawPile: deck.map((card) => card.id),
    discard: [],
    handLimit: 8,
    amplification: 100,
    drawContext: 'skill',
    lastUsedUnit: 2,
  };
  const drawn = fillHand(state);
  expect(drawn.hand).toHaveLength(7);
  expect(drawn.amplification).toBe(108);
});
