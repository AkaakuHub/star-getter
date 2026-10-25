import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { cardCost } from '../../src/domain/game/cards/cost';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('条件1から15までのコスト変化を対応する現在値から計算する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const other = initial.deck.find((card) => card.id === 'rain-preparation');
  const poolCard = initial.deck.find((card) => card.id !== source?.id && card.id !== other?.id);
  if (!source || !other || !poolCard) throw new Error('検証用カードがありません。');
  const cards = [
    { ...source, member: 1021 as const, unit: 1 as const, skillIcon: 600, style: 2 },
    { ...other, member: 1030 as const, unit: 2 as const, skillIcon: 700, style: 4 },
  ];
  const sourceCard = cards[0];
  if (!sourceCard) throw new Error('発動元カードがありません。');
  const state = {
    ...initial,
    deck: cards,
    cardPool: [...cards, poolCard],
    hand: cards.map((card) => card.id),
    handCardStats: {
      [source.id]: { enteredSectionIndex: 0, cardUseCountsAtEntry: {} },
      [other.id]: { enteredSectionIndex: 0, cardUseCountsAtEntry: {} },
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
          : index === 6 || index === 7
            ? 700
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
