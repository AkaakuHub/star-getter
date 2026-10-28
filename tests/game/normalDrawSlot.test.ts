import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { game, withHand, withHandTarget } from './support/game';

it('通常使用では先頭と末尾の順序を変えず、中央の使用枠を補充する', () => {
  const deck: readonly Card[] = ['left', 'source', 'right', 'replacement'].map((id) => ({
    cardInstanceId: id,
    cardDatasId: id,
    name: id,
    costume: null,
    performer: null,
    charactersId: 0,
    unitIds: [],
    skillMainEffect: null,
    styleType: null,
    tokenCardSeriesIds: [],
    consumeAp: 1,
    appeal: { smile: 0, pure: 0, cool: 0 },
    beatPoint: 0,
    effects: [],
  }));
  const base = game();
  const state = withHand(
    withHandTarget({ ...base, deck, cardPool: deck, ap: { ...base.ap, currentAp: 20 } }, 3),
    ['left', 'source', 'right'],
  );
  const result = act(state, { type: 'card', index: 1 });
  expect(liveCurrentHandCardInstanceIds(result)).toEqual(['left', 'replacement', 'right']);
  expect(result.liveHands.main.handCount).toBe(3);
  expect(result.stats.cardsUsed).toBe(1);
  expect(state.liveHands.main.handCards.slice(0, 3)).toEqual(['left', 'source', 'right']);
});
