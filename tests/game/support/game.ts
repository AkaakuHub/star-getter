import { createCardDeckBoard } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { routes, type RouteId } from '../../../src/content/routes';
import { tracks } from '../../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { initializeHandCardStats } from '@akaakuhub/suku-sute-core/game/cards/handCardStats';

export function game(route: RouteId = 'genesis', seed = 7, limit = 100): GameState {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const preset = routes[route];
  return act(createGame(track, preset.deck, seed, limit, preset.tokens), { type: 'start' });
}

export function withHand(state: GameState, hand: readonly string[]): GameState {
  for (const id of hand) {
    if (!state.deck.some((card) => card.id === id))
      throw new Error('手札に存在しないカードがあります。');
  }
  return initializeHandCardStats(
    {
      ...state,
      hand,
      handEffectCardIds: hand,
      deckBoard: { ...state.deckBoard, cards: createCardDeckBoard(state.deck, hand).cards },
    },
    hand,
  );
}
