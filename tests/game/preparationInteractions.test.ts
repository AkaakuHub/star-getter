import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { advanceAutomaticGauges } from '../../src/domain/game/automaticGauges';
import { activateBloom } from '../../src/domain/game/bloom';
import { applyDrawAbility } from '../../src/domain/game/cards/drawAbilities';
import { notifyHandSkillUse } from '../../src/domain/game/cards/useAbilities';
import { flushDeckActions } from '../../src/domain/game/cards/boardActions';
import { fillHand } from '../../src/domain/game/cards/drawing';
import { addTokens } from '../../src/domain/game/cards/tokens';
import { applyEffect, skillValue } from '../../src/domain/game/effects';
import { addHearts, heartCount } from '../../src/domain/game/hearts';
import { moodValue, sectionAt } from '../../src/domain/game/projection';
import { tracks } from '../../src/content/tracks';
import { game, withHand } from './support/game';

it('自然な空模様に雨100%はなく、準備カードの使用で最初のパート中に段階的に下げる', () => {
  expect(tracks.flatMap((track) => track.moodKeys).every((key) => key.keyValue > -100)).toBe(true);
  let state = { ...game(), apIntervalFactor: 1 };
  for (const [index, expected] of [-50, -100].entries()) {
    state = withHand({ ...state, energy: 20, maxEnergy: 20, tick: (index + 1) * 20 }, [
      'rain-preparation',
    ]);
    state = act(state, { type: 'card', index: 0 });
    expect(moodValue(state)).toBe(expected);
    expect(sectionAt(state)).toBe(state.track.sections[0]);
  }
  expect(state.cardUseCounts['rain-preparation']).toBe(2);
  expect(state.mentalShield).toBeGreaterThan(0);
});

it('ドロー時の11段階増幅は雨音だけに適用し、同じ雨の凍空には適用しない', () => {
  const initial = game();
  const card = initial.deck.find((item) => item.id === 'rain-preparation');
  const sayaka = initial.deck.find((item) => item.id === 'frost-echo');
  const tsuzuri = initial.deck.find((item) => item.id === 'frost-pulse');
  if (!card || !sayaka || !tsuzuri) throw new Error('カードがありません。');
  const state = {
    ...initial,
    hand: [],
    handEffectCardIds: [],
    targetBoosts: [],
    excitement: 655_000_001,
    moodOffset: -150,
    hearts: { ...initial.hearts, heartLimit: 10_000_000, stageHearts: [], hiddenHeartBatches: [] },
  };
  const drawn = applyDrawAbility(state, card);
  expect(heartCount(drawn)).toBe(563);
  expect(skillValue(drawn, 100, { kind: 'energy', amount: 100 }, sayaka)).toBe(225);
  expect(skillValue(drawn, 100, { kind: 'energy', amount: 100 }, tsuzuri)).toBe(100);
});

it('手札中の雨の使用反応で、対応する基本カードとパズルだけの消費を減らす', () => {
  let state = addTokens(game(), 'shadow', 1);
  const used = state.deck.find((card) => card.id === 'frost-echo');
  const shadow = state.deck.find((card) => card.token === 'shadow');
  if (!used || !shadow) throw new Error('カードがありません。');
  state = withHand({ ...state, costReductions: {} }, ['rain-preparation']);
  const reacted = notifyHandSkillUse(state, used);
  expect(reacted.costReductions['rain-preparation']).toBe(9);
  expect(reacted.costReductions['frost-pulse']).toBe(9);
  expect(reacted.costReductions[shadow.id]).toBe(9);
  expect(reacted.costReductions.horizon).toBe(0);
  expect(reacted.deckActions.shuffles).toHaveLength(1);
});

it('シールドは負の回復効果を防ぎ、自然減少は防がない', () => {
  const initial = { ...game(), hand: [], handEffectCardIds: [], stamina: 100, targetBoosts: [] };
  const shield = applyEffect(initial, { kind: 'mental-shield', amount: 10 });
  const damaged = applyEffect(shield, { kind: 'stamina', amount: -14 });
  expect(damaged.stamina).toBe(96);
  expect(damaged.mentalShield).toBe(0);
  const natural = advanceAutomaticGauges({ ...shield, mentalTimerSeconds: 0 }, 1.2);
  expect(natural.stamina).toBe(99);
  expect(natural.mentalShield).toBe(10);
  const active = activateBloom({ ...shield, moodOffset: -150 }, 1);
  const converted = applyEffect(active, { kind: 'stamina', amount: -14 });
  expect(converted.stamina).toBe(100);
  expect(converted.mentalShield).toBe(0);
  expect(converted.bloom?.progress).toBe((active.bloom?.progress ?? 0n) - 4n);
});

it('同時に登録した引き直しをまとめず全回実行し、後登録の検索を先に4回消費する', () => {
  let state = game();
  state = applyEffect(state, { kind: 'shuffle' });
  state = applyEffect(state, { kind: 'shuffle' });
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
        stamina: 0,
        excitement: points,
        maximumVoltageLevel: 1500,
        hearts: {
          ...initial.hearts,
          heartLimit: 1_000_000,
          stageHearts: [],
          hiddenHeartBatches: [],
        },
      },
      ['frost-echo'],
    );
    state = act(addHearts(state, 500_000), { type: 'collect' });
    expect(state.excitement).toBe(expected);
  });
}

it('通常の引き直しは元の手札枚数を維持し、発動元の編成でドロー条件を判定する', () => {
  let state = withHand({ ...game(), handLimit: 8 }, ['frost-echo', 'camera']);
  const source = state.deck.find((card) => card.id === 'frost-echo');
  if (!source) throw new Error('発動元がありません。');
  state = applyEffect(state, { kind: 'shuffle' }, source);
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
      ...(card.token === 'shadow' ? { drawRule: { priority: 'always' as const } } : {}),
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
