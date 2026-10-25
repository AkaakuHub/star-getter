import { describe, expect, it } from 'vite-plus/test';
import { routes, routeIds, type RouteId } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { validateDeck } from '../../src/domain/game/deck';
import { type GameState } from '../../src/domain/game/model';
import { createGame } from '../../src/domain/game/simulation';

function game(routeId: RouteId, seed = 7): GameState {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const route = routes[routeId];
  return act(createGame(track, route.deck, seed, 100, route.tokens), { type: 'start' });
}

describe('固定プリセット', () => {
  it('1曲と用途に応じた6枚・10枚のプリセット2つを使用する', () => {
    expect(tracks).toHaveLength(1);
    expect(routeIds).toEqual(['library', 'bloom']);
    expect(routes.library.deck).toHaveLength(6);
    expect(routes.bloom.deck).toHaveLength(10);
    for (const route of Object.values(routes)) expect(() => validateDeck(route.deck)).not.toThrow();
    expect(routes.library.deck.map((card) => card.id)).not.toEqual(
      routes.bloom.deck.map((card) => card.id),
    );
  });

  it('開始時のエナジーは0で、開始能力による回復を捏造しない', () => {
    for (const routeId of routeIds) expect(game(routeId).energy).toBe(0);
  });
});
