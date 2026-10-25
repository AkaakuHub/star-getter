import { expect, test } from 'vite-plus/test';
import { createPresetGame } from '../../src/app/createPresetGame';
import { act } from '../../src/domain/game/actions';
import { rules } from '../../src/domain/game/model';
import { canUseCard, durationSeconds } from '../../src/domain/game/projection';
import { advanceTo } from '../../src/domain/game/simulation';
import { canUseSpecial, specialCards } from '../../src/domain/game/special';

test('60秒のカード使用と回収を最後まで処理する', () => {
  let state = act(createPresetGame('bloom', 1234, 100), { type: 'start' });
  for (let frame = 1; frame <= Math.ceil(durationSeconds(state) * 4); frame++) {
    state = advanceTo(state, frame / 4);
    const cardIndex = state.hand.findIndex(
      (cardId, index) => Boolean(cardId) && canUseCard(state, index),
    );
    if (cardIndex >= 0) state = act(state, { type: 'card', index: cardIndex });
    const special = specialCards(state).find((card) => canUseSpecial(state, card.id));
    if (special) state = act(state, { type: 'special', cardId: special.id });
    if (frame % 12 === 0) state = act(state, { type: 'collect' });
  }
  expect(state.phase).toBe('finished');
  expect(state.stats.cardsUsed).toBeGreaterThan(5);
  expect(state.stats.specialsUsed).toBeGreaterThan(0);
  expect(state.score).toBeLessThanOrEqual(rules.maxScore);
  expect(state.score).toBeGreaterThan(0n);
});
