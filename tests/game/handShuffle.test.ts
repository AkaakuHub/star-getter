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
