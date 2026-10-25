import { describe, expect, it } from 'vite-plus/test';
import { routes, routeIds, type RouteId } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { validateDeck } from '../../src/domain/game/deck';
import { type GameState } from '../../src/domain/game/model';
import { canUseCard } from '../../src/domain/game/projection';
import { canUseSpecial, specialCards } from '../../src/domain/game/special';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game(routeId: RouteId, seed = 7): GameState {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const route = routes[routeId];
  return act(createGame(track, route.deck, seed, 100, route.tokens), { type: 'start' });
}

function expectOwnedOnce(state: GameState) {
  const ids = [...state.hand, ...state.drawPile, ...state.discard];
  expect(new Set(ids).size).toBe(ids.length);
  expect([...ids].sort()).toEqual(state.deck.map((card) => card.id).sort());
}

describe('固定プリセット', () => {
  it('1曲と用途に応じた6枚・8枚のプリセット2つを使用する', () => {
    expect(tracks).toHaveLength(1);
    expect(routeIds).toEqual(['library', 'bloom']);
    expect(routes.library.deck).toHaveLength(6);
    expect(routes.bloom.deck).toHaveLength(8);
    for (const route of Object.values(routes)) expect(() => validateDeck(route.deck)).not.toThrow();
    expect(routes.library.deck.map((card) => card.id)).not.toEqual(
      routes.bloom.deck.map((card) => card.id),
    );
  });

  for (const routeId of routeIds) {
    for (const seed of [7, 456, 1234]) {
      it(`${routeId}を60秒循環し、カード所有と本家の得点上限を維持する（seed ${seed}）`, () => {
        let state = game(routeId, seed);
        let turn = 0;
        for (let tick = 1; tick <= 3600; tick++) {
          state = advanceTo(state, tick / 60);
          if (tick % 24 === 0) {
            const available = Array.from(
              { length: state.hand.length },
              (_, offset) => (turn + offset) % state.hand.length,
            ).find((slot) => canUseCard(state, slot));
            if (available !== undefined) {
              state = act(state, { type: 'card', index: available });
              turn++;
              expectOwnedOnce(state);
            }
          }
          if (tick % 20 === 0) state = act(state, { type: 'collect' });
          const special = specialCards(state).find((card) => canUseSpecial(state, card.id));
          if (special) state = act(state, { type: 'special', cardId: special.id });
        }
        expect(state.phase).toBe('finished');
        expect(state.score).toBeGreaterThan(0n);
        expect(state.score).toBeLessThan(10n ** 20n);
        expectOwnedOnce(state);
      });
    }
  }
});
