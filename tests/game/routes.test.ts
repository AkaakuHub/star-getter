import { describe, expect, it } from 'vite-plus/test';
import { routes, routeIds, type RouteId } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { cardCost } from '../../src/domain/game/cards/cost';
import { validateDeck } from '../../src/domain/game/deck';
import { type GameState } from '../../src/domain/game/model';
import { canUseCard } from '../../src/domain/game/projection';
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
  it('1曲と9枚ずつのプリセット2つだけを使用する', () => {
    expect(tracks).toHaveLength(1);
    expect(routeIds).toEqual(['library', 'bloom']);
    for (const route of Object.values(routes)) expect(() => validateDeck(route.deck)).not.toThrow();
    expect(routes.library.deck.map((card) => card.id)).not.toEqual(
      routes.bloom.deck.map((card) => card.id),
    );
  });

  it('書架は共演カード3枚を生成し、エナジーをまとめて支払い、一斉使用後に除外する', () => {
    let state = game('library');
    const hand = ['halo', 'orbit', 'ember', 'prism', 'flare'];
    state = {
      ...state,
      hand,
      drawPile: state.deck.map((card) => card.id).filter((id) => !hand.includes(id)),
    };
    state = act(state, { type: 'card', index: 0 });
    expect(state.deck.filter((card) => card.token === 'ensemble')).toHaveLength(3);
    state = advanceTo(state, 4);
    const index = state.hand.findIndex((id) =>
      state.deck.some((card) => card.id === id && card.token === 'ensemble'),
    );
    const source = state.deck.find((card) => card.id === state.hand[index]);
    if (!source) throw new Error('共演カードがありません。');
    expect(cardCost(state, source)).toBe(1);
    const before = state.stats.cardsUsed;
    state = act(state, { type: 'card', index });
    expect(state.stats.cardsUsed - before).toBe(5);
    expect(state.deck.some((card) => card.id === source.id)).toBe(false);
    expect(state.discard.includes(source.id)).toBe(false);
    expect(state.deck.filter((card) => card.token === 'clock')).toHaveLength(3);
    expect(state.deck.filter((card) => card.token === 'bookmark')).toHaveLength(3);
    expect(state.cardUses).toHaveLength(5);
    expectOwnedOnce(state);
  });

  it('開花は手札内の補助カードで手札を圧縮し、使用後は上限を戻す', () => {
    let state = game('bloom');
    const hand = ['spark', 'ripple', 'prism'];
    state = {
      ...state,
      hand,
      drawPile: state.deck.map((card) => card.id).filter((id) => !hand.includes(id)),
    };
    state = act(state, { type: 'card', index: 1 });
    const passiveInHand = state.hand.some(
      (id) => state.deck.find((card) => card.id === id)?.passive,
    );
    expect(state.hand.length).toBe(passiveInHand ? 3 : 5);
    expectOwnedOnce(state);
  });

  for (const routeId of routeIds) {
    for (const seed of [7, 456, 1234]) {
      it(`${routeId}を30秒循環し、カード所有と本家の得点上限を維持する（seed ${seed}）`, () => {
        let state = game(routeId, seed);
        let turn = 0;
        for (let tick = 1; tick <= 1800; tick++) {
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
          state = act(state, { type: 'special' });
        }
        expect(state.phase).toBe('finished');
        expect(state.score).toBeGreaterThan(0n);
        expect(state.score).toBeLessThan(10n ** 20n);
        expectOwnedOnce(state);
      });
    }
  }
});
