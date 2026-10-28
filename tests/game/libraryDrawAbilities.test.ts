import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyDrawAbility } from '@akaakuhub/suku-sute-core/game/cards/drawAbilities';
import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import type { Card, GameState, TokenId } from '@akaakuhub/suku-sute-core/game/model';
import { game, withHand } from './support/game';

function token(state: GameState, kind: TokenId): Card {
  const card = state.deck.find((item) => item.token === kind);
  if (!card) throw new Error('追加カードがありません。');
  return card;
}

function card(state: GameState, id: string): Card {
  const card = state.deck.find((item) => item.id === id);
  if (!card) throw new Error('基本カードがありません。');
  return card;
}

it('招待状自身を使用すると、生成した帆船を優先検索して補充する', () => {
  const initial = game('library');
  const state = withHand({ ...initial, ap: { ...initial.ap, currentAp: 10 } }, [
    'library-invitation',
  ]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(1);
  expect(
    used.hand.slice(0, 2).map((id) => used.deck.find((card) => card.id === id)?.token),
  ).toEqual(['ensemble', 'ensemble']);
});

it('生成帆船自身を使用した後に折り紙を2回検索し、他カードの使用では検索しない', () => {
  let state = addTokens(addTokens(game('library'), 'ensemble', 1), 'story', 2);
  const source = token(state, 'ensemble');
  state = withHand({ ...state, ap: { ...state.ap, currentAp: 1 } }, [source.id]);
  const used = act(state, { type: 'card', index: 0 });
  expect(
    used.hand.slice(0, 2).map((id) => used.deck.find((card) => card.id === id)?.token),
  ).toEqual(['story', 'story']);
});

it('招待状の追加901も実行し、鍵の消費減少を2回適用する', () => {
  let state = addTokens(addTokens(game('library'), 'story', 1), 'bookmark', 1);
  state = { ...state, costReductions: {} };
  const reduced = applyDrawAbility(state, card(state, 'library-invitation'));
  expect(cardCost(reduced, token(state, 'story'))).toBe(3);
  expect(cardCost(reduced, token(state, 'bookmark'))).toBe(1);
});
