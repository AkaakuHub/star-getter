import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { game, withHand } from './support/game';

it('ヨットの検索を先に登録し、巻き込んだ浮き輪の舵・編成検索から先に補充する', () => {
  let state = game('library');
  for (const token of ['story', 'clock', 'bookmark'] as const) state = addTokens(state, token, 10);
  state = addTokens(state, 'ensemble', 1);
  const yacht = state.deck.find((card) => card.token === 'ensemble');
  const bookmark = state.deck.find((card) => card.token === 'bookmark');
  if (!yacht || !bookmark) throw new Error('検証する追加カードがありません。');
  state = withHand({ ...state, ap: { ...state.ap, currentAp: 100, maxAp: 100 } }, [
    yacht.cardInstanceId,
    bookmark.cardInstanceId,
  ]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed - state.stats.cardsUsed).toBe(2);
  expect(
    liveCurrentHandCardInstanceIds(used).map((id) => {
      const card = used.deck.find((candidate) => candidate.cardInstanceId === id);
      if (!card) throw new Error('補充したカードがありません。');
      return card.token ?? card.unitIds[0];
    }),
  ).toEqual([1, 'clock', 1, 'clock', 'story']);
});

it('追い風は使用開始時にエナジーを失い、その後に巻き込んだ乗船の準備で回復する', () => {
  const state = withHand(
    {
      ...addTokens(game('library'), 'story', 30),
      ap: { ...addTokens(game('library'), 'story', 30).ap, currentAp: 100, maxAp: 100 },
    },
    ['aurora-ensemble', 'class'],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed - state.stats.cardsUsed).toBe(2);
  expect(used.ap.currentAp).toBeGreaterThan(0);
});

it('97枚から潮の便りを使うと残り3枠に貝がら・舵・浮き輪を1枚ずつ追加する', () => {
  let state = game('library');
  for (let batch = 0; batch < 3; batch++) state = addTokens(state, 'story', 30);
  state = addTokens(state, 'story', 1);
  expect(state.deck).toHaveLength(97);
  state = withHand({ ...state, ap: { ...state.ap, currentAp: 100, maxAp: 100 } }, [
    'library-pages',
  ]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.deck).toHaveLength(100);
  expect(used.deck.filter((card) => card.token === 'story')).toHaveLength(92);
  expect(used.deck.filter((card) => card.token === 'clock')).toHaveLength(1);
  expect(used.deck.filter((card) => card.token === 'bookmark')).toHaveLength(1);
  expect(used.tokenGroups).toEqual([]);
});
