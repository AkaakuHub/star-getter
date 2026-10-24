import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { rules } from '../../src/domain/game/model';
import { canUseCard, durationSeconds } from '../../src/domain/game/projection';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function play(seed: number, collectInterval: number, cardInterval: number) {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  let state = act(createGame(track, resolveDeck(defaultDeckIds), seed), { type: 'start' });
  let turn = 0;
  for (let tick = 1; tick <= durationSeconds(state) * rules.ticksPerSecond; tick++) {
    state = advanceTo(state, tick / rules.ticksPerSecond);
    if (tick % cardInterval === 0) {
      const opening = !state.bloom
        ? state.hand.findIndex((id, index) => id === 'spark' && canUseCard(state, index))
        : -1;
      const index =
        opening >= 0
          ? opening
          : Array.from(
              { length: state.hand.length },
              (_, offset) => (turn + offset) % state.hand.length,
            ).find((slot) => canUseCard(state, slot));
      if (index !== undefined) {
        const previous = state.stats.cardsUsed;
        state = act(state, { type: 'card', index });
        if (state.stats.cardsUsed > previous) turn++;
      }
    }
    if (tick % collectInterval === 0) state = act(state, { type: 'collect' });
    state = act(state, { type: 'special' });
  }
  return state;
}

describe('30秒ライブの得点バランス', () => {
  for (const seed of [7, 456, 1234]) {
    it(`初期編成でカードを毎秒2回・回収を毎秒3回操作すると上限へ届く（seed ${seed}）`, () => {
      const fast = play(seed, 20, 30);
      const slow = play(seed, 180, 90);
      expect(fast.phase).toBe('finished');
      expect(fast.score).toBe(rules.maxScore);
      expect(slow.score).toBeLessThan(fast.score);
    });
  }
});
