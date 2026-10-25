import { expect, it } from 'vite-plus/test';
import { drawCandidate } from '../../src/domain/game/cards/drawLottery';
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
