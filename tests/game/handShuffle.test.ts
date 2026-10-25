import { act } from '../../src/domain/game/actions';
import { addTokens } from '../../src/domain/game/cards/tokens';
import { expect, it } from 'vite-plus/test';
import { shuffleHand } from '../../src/domain/game/cards/drawing';
import { game, withHand } from './support/game';

for (const recoverDiscard of [false, true]) {
  for (const destination of ['draw', 'discard'] as const) {
    it(`引き直しの捨て札回収${recoverDiscard}と手札移動先${destination}を独立して扱う`, () => {
      const prepared = withHand(game('library'), ['class']);
      const discarded = 'library-pages';
      const initial = {
        ...prepared,
        drawPile: prepared.drawPile.filter((id) => id !== discarded),
        discard: [discarded],
      };
      const next = shuffleHand(initial, { recoverDiscard, destination });
      expect(next.hand).toEqual([]);
      expect(next.randomSeed).toBe(initial.randomSeed);
      expect(next.drawPile.includes('class')).toBe(destination === 'draw');
      expect(next.discard.includes('class')).toBe(destination === 'discard');
      expect(next.drawPile.includes(discarded)).toBe(recoverDiscard);
      expect(next.discard.includes(discarded)).toBe(!recoverDiscard);
      expect([...next.drawPile, ...next.discard].sort()).toEqual(
        [...initial.drawPile, ...initial.hand, ...initial.discard].sort(),
      );
    });
  }
}

it('一斉使用内のリセットシャッフルは発動した本人を戻さず、他のカードを山札へ戻す', () => {
  const state = withHand(
    { ...addTokens(game('library'), 'story', 30), energy: 100, maxEnergy: 100 },
    ['aurora-ensemble', 'class'],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed - state.stats.cardsUsed).toBe(2);
  expect(used.discard).toContain('class');
  expect(used.hand).not.toContain('class');
  expect(used.drawPile).toContain('aurora-ensemble');
  expect(used.discard).not.toContain('aurora-ensemble');
});

it('一斉使用内の通常リシャッフルでは使用したカードを捨て札へ移す', () => {
  const state = withHand({ ...addTokens(game(), 'story', 30), energy: 100, maxEnergy: 100 }, [
    'aurora-ensemble',
    'frost-echo',
  ]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed - state.stats.cardsUsed).toBe(2);
  for (const id of ['aurora-ensemble', 'frost-echo']) {
    expect(used.discard).toContain(id);
    expect(used.hand).not.toContain(id);
    expect(used.drawPile).not.toContain(id);
  }
});
