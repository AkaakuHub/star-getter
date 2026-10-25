import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { addTokens } from '../../src/domain/game/cards/tokens';
import { game, withHand } from './support/game';

it('ヨットの検索を先に登録し、巻き込んだ浮き輪の舵・編成検索から先に補充する', () => {
  let state = game('library');
  for (const token of ['story', 'clock', 'bookmark'] as const) state = addTokens(state, token, 10);
  state = addTokens(state, 'ensemble', 1);
  const yacht = state.deck.find((card) => card.token === 'ensemble');
  const bookmark = state.deck.find((card) => card.token === 'bookmark');
  if (!yacht || !bookmark) throw new Error('検証する追加カードがありません。');
  state = withHand({ ...state, energy: 100, maxEnergy: 100 }, [yacht.id, bookmark.id]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed - state.stats.cardsUsed).toBe(2);
  expect(
    used.hand.map((id) => {
      const card = used.deck.find((candidate) => candidate.id === id);
      if (!card) throw new Error('補充したカードがありません。');
      return card.token ?? card.unit;
    }),
  ).toEqual([1, 'clock', 1, 'clock', 'story']);
});

it('追い風は使用開始時にエナジーを失い、その後に巻き込んだ乗船の準備で回復する', () => {
  const state = withHand(
    { ...addTokens(game('library'), 'story', 30), energy: 100, maxEnergy: 100 },
    ['aurora-ensemble', 'class'],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed - state.stats.cardsUsed).toBe(2);
  expect(used.energy).toBeGreaterThan(0);
});
