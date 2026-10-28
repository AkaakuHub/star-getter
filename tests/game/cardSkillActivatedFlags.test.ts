import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import {
  liveCardSkillActivatedFlags,
  markLiveCardHandCountActivated,
  markLiveCardReshuffleActivated,
} from '@akaakuhub/suku-sute-core/runtime/cards/cardSkillActivatedFlags';
import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { game, withHand } from './support/game';

function readyHand(count: number) {
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
        .slice(0, count - 1)
        .map((item) => item.cardInstanceId),
    ],
  );
  return { ready, source };
}

it('通常カードの次の使用開始で前回のフラグを消し、補充を実行する', () => {
  const { ready, source } = readyHand(5);
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

it('通常の使用後は1枚だけ引き、目標枚数までまとめて引かない', () => {
  const { ready } = readyHand(1);
  const used = act(ready, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(ready.stats.cardsUsed + 1);
  expect(liveCurrentHandCardInstanceIds(used)).toHaveLength(1);
});

it('引き直しを発動したカードは通常補充で枠を除かず、保持枚数で引き直す', () => {
  const { ready, source } = readyHand(5);
  const reshuffle = {
    ...source,
    effects: [{ kind: 'shuffle' as const, recoverDiscard: true, destination: 'draw' as const }],
  };
  const state = {
    ...ready,
    deck: ready.deck.map((card) =>
      card.cardInstanceId === source.cardInstanceId ? reshuffle : card,
    ),
    cardPool: ready.cardPool.map((card) =>
      card.cardInstanceId === source.cardInstanceId ? reshuffle : card,
    ),
  };
  const used = act(state, { type: 'card', index: 0 });
  expect(liveCurrentHandCardInstanceIds(used)).toHaveLength(5);
  expect(used.liveHands.handCardButtonOrder).toEqual(state.liveHands.handCardButtonOrder);
  expect(used.deckActions.queue).toEqual([]);
});
