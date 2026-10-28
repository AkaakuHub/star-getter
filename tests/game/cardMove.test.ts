import { enqueueHandShuffle } from '@akaakuhub/suku-sute-core/game/cards/boardActions';
import type { ProxySkillEffect } from '@akaakuhub/suku-sute-core/game/proxySkillTypes';
import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import {
  liveBoardState,
  liveDeckBoardCardInstanceIds,
} from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { withBoardState } from './support/board';
import { cardSkillUseState } from '@akaakuhub/suku-sute-core/game/cards/skillUseAtBoardState';
import { applyUseAbility } from '@akaakuhub/suku-sute-core/game/cards/useAbilities';
import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { finishCardActivation } from '@akaakuhub/suku-sute-core/game/cards/cardZones';
import { game } from './support/game';

function activateSourceCard() {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('検証用カードがありません。');
  return {
    card,
    state: withBoardState(
      {
        ...state,
        activation: {
          sourceId: card.id,
          usedCards: [card.id],
          allHand: false,
          recoverDiscard: false,
          handCountChanges: {},
        },
      },
      {
        hand: state.hand.filter((id) => id !== card.id),
        deck: boardCardIds(state, liveBoardState.deck).filter((id) => id !== card.id),
      },
    ),
  };
}

it('Action19で使用後に発動元カードを山札へ戻し、指定を消費する', () => {
  const { card, state } = activateSourceCard();
  const moved = applyEffect(state, { kind: 'card-move', destination: 'deck' }, card);
  const finished = finishCardActivation(moved);
  expect(finished.deck.some((item) => item.id === card.id)).toBe(true);
  expect(boardCardIds(finished, liveBoardState.deck)).toContain(card.id);
  expect(boardCardIds(finished, liveBoardState.graveyard)).not.toContain(card.id);
  expect(cardSkillUseState(finished, card.id)).toMatchObject({ skillUseAtBoardState: 3 });
});

it('Action19で使用後に発動元カードを除外する', () => {
  const { card, state } = activateSourceCard();
  const moved = applyEffect(state, { kind: 'card-move', destination: 'exclusion' }, card);
  const finished = finishCardActivation(moved);
  expect(finished.deck.some((item) => item.id === card.id)).toBe(false);
  expect(boardCardIds(finished, liveBoardState.deck)).not.toContain(card.id);
  expect(boardCardIds(finished, liveBoardState.graveyard)).not.toContain(card.id);
});

it('Action19は既に除外先へ設定した移動先を山札へ上書きしない', () => {
  const { card, state } = activateSourceCard();
  const excluded = applyEffect(state, { kind: 'card-move', destination: 'exclusion' }, card);
  const moved = applyEffect(excluded, { kind: 'card-move', destination: 'deck' }, card);
  expect(cardSkillUseState(moved, card.id)).toMatchObject({ skillUseAtBoardState: 4 });
  expect(finishCardActivation(moved).deck.some((item) => item.id === card.id)).toBe(false);
});

it('全手札使用の子の除外特性は既存のProxy移動先を上書きしない', () => {
  const initial = game();
  const source = initial.deck[0];
  const child = initial.deck[1];
  if (!source || !child) throw new Error('検証用カードが足りません。');
  const state = withBoardState(
    {
      ...initial,
      activation: {
        sourceId: source.id,
        usedCards: [source.id, child.id],
        allHand: true,
        recoverDiscard: false,
        handCountChanges: {},
      },
    },
    {
      hand: initial.hand.filter((id) => id !== source.id && id !== child.id),
      deck: boardCardIds(initial, liveBoardState.deck).filter(
        (id) => id !== source.id && id !== child.id,
      ),
    },
    { [child.id]: { skillUseAtBoardState: 7 as const } },
  );
  const used = applyUseAbility(state, { ...child, exhausts: true });
  const finished = finishCardActivation(used);
  expect(finished.deck.some((card) => card.id === child.id)).toBe(true);
  expect(liveDeckBoardCardInstanceIds(finished.deckBoard, liveBoardState.proxy)).toContain(
    child.id,
  );
  expect(cardSkillUseState(finished, child.id)).toMatchObject({ skillUseAtBoardState: 3 });
});

it('ProxyはAction19の移動先より優先され、一斉引き直しで山札へ戻らない', () => {
  const initial = game();
  const source = initial.deck[0];
  const child = initial.deck[1];
  if (!source || !child) throw new Error('発動カードが足りません。');
  const proxyEffect: ProxySkillEffect = {
    kind: 'proxy-skill',
    absorbLimit: 1,
    periodType: 1 as const,
    periodParam: 3000n,
    induceTiming: 1,
    induceCondition: 1,
    inducePowerType: 1,
    inducePowerParam: 0,
    targets: [{ actionType: 20, targetAmount: 1 }],
    effects: [],
  };
  let state = applyEffect(initial, { kind: 'card-move', destination: 'exclusion' }, source);
  state = applyEffect(state, proxyEffect, source);
  state = applyEffect(state, { kind: 'card-move', destination: 'exclusion' }, child);
  state = applyEffect(state, proxyEffect, child);
  const activated = withBoardState(
    {
      ...state,
      activation: {
        sourceId: source.id,
        usedCards: [source.id, child.id],
        allHand: true,
        recoverDiscard: false,
        handCountChanges: {},
      },
    },
    {
      hand: state.hand.filter((id) => id !== source.id && id !== child.id),
      deck: boardCardIds(state, liveBoardState.deck).filter((id) => id !== child.id),
    },
  );
  const finished = finishCardActivation(
    enqueueHandShuffle(activated, { recoverDiscard: false, destination: 'draw' }, source.id),
  );
  expect(liveDeckBoardCardInstanceIds(finished.deckBoard, liveBoardState.proxy)).toEqual([
    source.id,
    child.id,
  ]);
  expect(boardCardIds(finished, liveBoardState.deck)).not.toContain(child.id);
  expect(boardCardIds(finished, liveBoardState.graveyard)).not.toContain(source.id);
  expect(boardCardIds(finished, liveBoardState.graveyard)).not.toContain(child.id);
});
