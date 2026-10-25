import { expect, it } from 'vite-plus/test';
import { drawCandidate, drawWeight } from '../../src/domain/game/cards/drawLottery';
import { fillHand } from '../../src/domain/game/cards/drawing';
import { addTokens } from '../../src/domain/game/cards/tokens';
import { game, withHand } from './support/game';

it('正の重みは累積確率で選び、0の候補は選ばない', () => {
  const candidates = [
    { id: 'zero', weight: 0 },
    { id: 'first', weight: 1 },
    { id: 'last', weight: 3 },
  ];
  expect(drawCandidate(candidates, () => 0)).toBe('first');
  expect(drawCandidate(candidates, () => 1)).toBe('last');
  expect(drawCandidate(candidates, () => 3)).toBe('last');
  expect(drawCandidate([{ id: 'zero', weight: 0 }], () => 0)).toBeNull();
});

it('負の優先群が複数ある場合も先頭固定にせず群の中から抽選する', () => {
  const candidates = [
    { id: 'first', weight: -1 },
    { id: 'last', weight: -1 },
    { id: 'normal', weight: 100 },
  ];
  expect(drawCandidate(candidates, () => 1)).toBe('last');
});

it('生成した30枚の末尾順で固定せず、各ドローで乱数を進める', () => {
  let state = addTokens(game('library'), 'story', 30);
  state = withHand({ ...state, handLimit: 8 }, []);
  const first = fillHand(state);
  expect(first.randomSeed).not.toBe(state.randomSeed);
  const stories = first.hand.filter((id) =>
    first.deck.some((card) => card.id === id && card.token === 'story'),
  );
  expect(stories.length).toBeGreaterThan(0);
  expect(stories).not.toEqual(
    state.deck
      .filter((card) => card.token === 'story')
      .slice(0, stories.length)
      .map((card) => card.id),
  );
});

it('条件一致時だけ対象を優先し、極光は開始時の優先を持たない', () => {
  const state = game();
  const source = (id: string) => {
    const card = state.deck.find((item) => item.id === id);
    if (!card) throw new Error('カードがありません。');
    return card;
  };
  const initial = { ...state, drawContext: 'initial' as const };
  const doll = {
    ...state,
    drawContext: 'skill' as const,
    lastUsedMember: 1032 as const,
    lastUsedUnit: 2 as const,
  };
  const cerise = { ...doll, lastUsedMember: 1031 as const, lastUsedUnit: 1 as const };
  expect(drawWeight(source('aurora-ensemble'), initial)).toBe(1);
  expect(drawWeight(source('aurora-ensemble'), doll)).toBe(-1);
  expect(drawWeight(source('library-ensemble'), initial)).toBe(0);
  expect(drawWeight(source('library-ensemble'), doll)).toBe(0);
  expect(drawWeight(source('library-ensemble'), cerise)).toBe(-1);
  expect(drawWeight(source('frost-pulse'), doll)).toBe(-1);
  expect(drawWeight(source('frost-pulse'), cerise)).toBe(0);
  expect(drawWeight(source('camera'), cerise)).toBe(-1);
});
