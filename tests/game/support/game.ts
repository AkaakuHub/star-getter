import { routes, type RouteId } from '../../../src/content/routes';
import { tracks } from '../../../src/content/tracks';
import { act } from '../../../src/domain/game/actions';
import type { GameState } from '../../../src/domain/game/model';
import { createGame } from '../../../src/domain/game/simulation';

export function game(route: RouteId = 'bloom', seed = 7, limit = 100): GameState {
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
  return {
    ...state,
    hand,
    handEffectCardIds: hand,
    drawPile: state.deck.map((card) => card.id).filter((id) => !hand.includes(id)),
    discard: [],
  };
}
