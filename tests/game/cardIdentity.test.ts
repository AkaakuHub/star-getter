import { withBoardState } from './support/board';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { expect, it } from 'vite-plus/test';
import {
  createCardDeckBoard,
  moveCardsToBoard,
} from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { liveBoardState } from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { game } from './support/game';

it('盤面の初期化はinstanceの識別子と定義IDを別々に保持する', () => {
  const base = game('library');
  const template = base.deck[0];
  if (!template) throw new Error('カードがありません。');
  const card = { ...template, cardInstanceId: 'physical-card', cardDatasId: 'authored-card' };
  const board = createCardDeckBoard([card], [card.cardInstanceId]);
  expect(board.cards).toEqual([
    {
      cardInstanceId: 'physical-card',
      cardDatasId: 'authored-card',
      boardState: liveBoardState.hand,
      skillUseAtBoardState: liveBoardState.graveyard,
    },
  ]);
});

it('同じ定義から生成したカードは定義IDを維持し、個別に移動できる', () => {
  const base = game('library');
  const prepared = {
    ...base,
    tokenCatalog: base.tokenCatalog.map((card) =>
      card.token === 'story'
        ? { ...card, cardInstanceId: 'story-template', cardDatasId: 'authored-story' }
        : card,
    ),
  };
  const generated = addTokens(prepared, 'story', 2);
  const cards = generated.deck.slice(base.deck.length);
  const first = cards[0];
  const second = cards[1];
  if (!first || !second) throw new Error('追加カードがありません。');
  expect(first.cardInstanceId).not.toBe(second.cardInstanceId);
  expect(cards.map((card) => card.cardDatasId)).toEqual(['authored-story', 'authored-story']);
  const moved = moveCardsToBoard(generated, [first.cardInstanceId], liveBoardState.exclusion);
  expect(
    moved.deckBoard.cards.filter((card) =>
      cards.some((item) => item.cardInstanceId === card.cardInstanceId),
    ),
  ).toEqual([
    {
      cardInstanceId: first.cardInstanceId,
      cardDatasId: 'authored-story',
      boardState: liveBoardState.exclusion,
      skillUseAtBoardState: liveBoardState.graveyard,
    },
    {
      cardInstanceId: second.cardInstanceId,
      cardDatasId: 'authored-story',
      boardState: liveBoardState.deck,
      skillUseAtBoardState: liveBoardState.graveyard,
    },
  ]);
  const regenerated = addTokens(moved, 'story', 1);
  expect(regenerated.deck.at(-1)?.cardDatasId).toBe('authored-story');
  expect(new Set(regenerated.deck.map((card) => card.cardInstanceId)).size).toBe(
    regenerated.deck.length,
  );
  expect(regenerated.deckBoard.cards.at(-1)?.cardDatasId).toBe('authored-story');
});

it.each([1, 2])('複数ユニットのカードを手札条件14の所属%sへ数える', (unit) => {
  const initial = game();
  const base = initial.deck[0];
  if (!base) throw new Error('発動元カードがありません。');
  const source = { ...base, unitIds: [1, 2] };
  const state = withBoardState(
    {
      ...initial,
      deck: initial.deck.map((card) =>
        card.cardInstanceId === source.cardInstanceId ? source : card,
      ),
      cardPool: initial.cardPool.map((card) =>
        card.cardInstanceId === source.cardInstanceId ? source : card,
      ),
    },
    { hand: [source.cardInstanceId] },
  );
  const changed = applyEffect(
    state,
    {
      kind: 'skill-cost-change',
      amount: 2,
      minimum: 0,
      maximum: 10,
      conditionType: 14,
      conditionId: unit,
    },
    source,
  );
  expect(cardCost(changed, source) - cardCost(state, source)).toBe(2);
});
