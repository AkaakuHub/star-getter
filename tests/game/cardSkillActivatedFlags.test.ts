import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import {
  liveCardSkillActivatedFlags,
  markLiveCardHandCountActivated,
  markLiveCardReshuffleActivated,
} from '@akaakuhub/suku-sute-core/runtime/cards/cardSkillActivatedFlags';
import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { game, withHand } from './support/game';

it('通常カードの次の使用開始で前回のフラグを消し、補充を実行する', () => {
  const initial = game();
  const card = initial.deck.find((item) => item.cardInstanceId === 'horizon');
  if (!card) throw new Error('発動元カードがありません。');
  const source = { ...card, consumeAp: 0, effects: [] };
  const ready = withHand(
    {
      ...initial,
      deck: initial.deck.map((item) => (item === card ? source : item)),
      cardPool: initial.cardPool.map((item) =>
        item.cardInstanceId === card.cardInstanceId ? source : item,
      ),
    },
    [
      source.cardInstanceId,
      ...initial.deck
        .filter((item) => item !== card)
        .slice(0, 4)
        .map((item) => item.cardInstanceId),
    ],
  );
  const state = {
    ...ready,
    deckBoard: markLiveCardHandCountActivated(
      markLiveCardReshuffleActivated(ready.deckBoard, source.cardInstanceId),
      source.cardInstanceId,
      -1,
    ),
  };
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(state.stats.cardsUsed + 1);
  expect(liveCurrentHandCardInstanceIds(used)).toHaveLength(5);
  expect(liveCardSkillActivatedFlags(used.deckBoard, source.cardInstanceId)).toMatchObject({
    skillReshuffleActivated: false,
    skillChangeHandCardCountActivated: false,
    skillChangeHandCardCountIsPositive: false,
  });
});
