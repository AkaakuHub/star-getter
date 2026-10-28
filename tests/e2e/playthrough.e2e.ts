import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { liveBoardState } from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { createPresetSetup } from '../../src/app/setup/gameSetup';
import { expect, test } from 'vite-plus/test';
import { createConfiguredGame } from '../../src/app/createConfiguredGame';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { routeIds } from '../../src/content/routes';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { rules } from '@akaakuhub/suku-sute-core/game/model';
import { canUseCard, durationSeconds } from '@akaakuhub/suku-sute-core/game/projection';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { canUseSpecial, specialCards } from '@akaakuhub/suku-sute-core/game/special';

test('全区間のカード使用と回収を最後まで処理する', () => {
  let state = act(createConfiguredGame(createPresetSetup('genesis'), 1234, 100), { type: 'start' });
  for (let frame = 1; frame <= Math.ceil(durationSeconds(state) * 4); frame++) {
    state = advanceTo(state, frame / 4);
    const cardIndex = liveCurrentHandCardInstanceIds(state).findIndex(
      (cardId, index) => Boolean(cardId) && canUseCard(state, index),
    );
    if (cardIndex >= 0) state = act(state, { type: 'card', index: cardIndex });
    const special = specialCards(state).find((card) => canUseSpecial(state, card.cardInstanceId));
    if (special) state = act(state, { type: 'special', cardId: special.cardInstanceId });
    if (frame % 12 === 0) state = act(state, { type: 'collect' });
  }
  expect(state.phase).toBe('finished');
  expect(state.stats.cardsUsed).toBeGreaterThan(5);
  expect(state.stats.specialsUsed).toBeGreaterThan(0);
  expect(state.score).toBeLessThanOrEqual(rules.maxScore);
  expect(state.score).toBeGreaterThan(0n);
});

function expectOwnedOnce(state: GameState) {
  const ids = [
    ...liveCurrentHandCardInstanceIds(state),
    ...boardCardIds(state, liveBoardState.deck),
    ...boardCardIds(state, liveBoardState.graveyard),
  ];
  expect(new Set(ids).size).toBe(ids.length);
  expect([...ids].sort()).toEqual(state.deck.map((card) => card.cardInstanceId).sort());
}

for (const routeId of routeIds) {
  for (const seed of [7, 456, 1234]) {
    test(`${routeId}を全区間循環し、カード所有と本家の得点上限を維持する（seed ${seed}）`, () => {
      let state = act(createConfiguredGame(createPresetSetup(routeId), seed, 100), {
        type: 'start',
      });
      let turn = 0;
      for (let tick = 1; tick <= durationSeconds(state) * rules.ticksPerSecond; tick++) {
        state = advanceTo(state, tick / rules.ticksPerSecond);
        if (tick % 24 === 0) {
          const available = Array.from(
            { length: liveCurrentHandCardInstanceIds(state).length },
            (_, offset) => (turn + offset) % liveCurrentHandCardInstanceIds(state).length,
          ).find((slot) => canUseCard(state, slot));
          if (available !== undefined) {
            state = act(state, { type: 'card', index: available });
            turn++;
            expectOwnedOnce(state);
          }
        }
        if (tick % 20 === 0) state = act(state, { type: 'collect' });
        const special = specialCards(state).find((card) =>
          canUseSpecial(state, card.cardInstanceId),
        );
        if (special) state = act(state, { type: 'special', cardId: special.cardInstanceId });
      }
      expect(state.phase).toBe('finished');
      expect(state.score).toBeGreaterThan(0n);
      expect(state.score).toBeLessThan(10n ** 20n);
      expectOwnedOnce(state);
    });
  }
}
