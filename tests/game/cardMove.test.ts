import { liveHandCardButtonId } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
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
          sourceId: card.cardInstanceId,
          handCardButtonId: liveHandCardButtonId(state, card.cardInstanceId),
          usedCards: [card.cardInstanceId],
          hasUseAllHandSkill: false,
        },
      },
      {
        hand: liveCurrentHandCardInstanceIds(state),
        deck: boardCardIds(state, liveBoardState.deck).filter((id) => id !== card.cardInstanceId),
      },
    ),
  };
}

it('Action19で使用後に発動元カードを山札へ戻し、指定を消費する', () => {
  const { card, state } = activateSourceCard();
  const moved = applyEffect(state, { kind: 'card-move', destination: 'deck' }, card);
  const finished = finishCardActivation(moved);
  expect(finished.deck.some((item) => item.cardInstanceId === card.cardInstanceId)).toBe(true);
  expect(boardCardIds(finished, liveBoardState.deck)).toContain(card.cardInstanceId);
  expect(boardCardIds(finished, liveBoardState.graveyard)).not.toContain(card.cardInstanceId);
  expect(cardSkillUseState(finished, card.cardInstanceId)).toMatchObject({
    skillUseAtBoardState: 3,
  });
});

it('Action19で使用後に発動元カードを除外する', () => {
  const { card, state } = activateSourceCard();
  const moved = applyEffect(state, { kind: 'card-move', destination: 'exclusion' }, card);
  const finished = finishCardActivation(moved);
  expect(finished.deck.some((item) => item.cardInstanceId === card.cardInstanceId)).toBe(false);
  expect(boardCardIds(finished, liveBoardState.deck)).not.toContain(card.cardInstanceId);
  expect(boardCardIds(finished, liveBoardState.graveyard)).not.toContain(card.cardInstanceId);
});

it('Action19は既に除外先へ設定した移動先を山札へ上書きしない', () => {
  const { card, state } = activateSourceCard();
  const excluded = applyEffect(state, { kind: 'card-move', destination: 'exclusion' }, card);
  const moved = applyEffect(excluded, { kind: 'card-move', destination: 'deck' }, card);
  expect(cardSkillUseState(moved, card.cardInstanceId)).toMatchObject({ skillUseAtBoardState: 4 });
  expect(
    finishCardActivation(moved).deck.some((item) => item.cardInstanceId === card.cardInstanceId),
  ).toBe(false);
});

it('全手札使用の子の除外特性は既存のProxy移動先を上書きしない', () => {
  const initial = game();
  const source = initial.deck[0];
  const child = initial.deck[1];
  if (!source || !child) throw new Error('検証用カードが足りません。');
  const state = withBoardState(
    {
      ...initial,
      tokenCardDeck: { ...initial.tokenCardDeck, isAllHandSkill: true },
      activation: {
        sourceId: source.cardInstanceId,
        handCardButtonId: liveHandCardButtonId(initial, source.cardInstanceId),
        usedCards: [source.cardInstanceId, child.cardInstanceId],
        hasUseAllHandSkill: true,
      },
    },
    {
      hand: liveCurrentHandCardInstanceIds(initial).filter(
        (id) => id !== source.cardInstanceId && id !== child.cardInstanceId,
      ),
      deck: boardCardIds(initial, liveBoardState.deck).filter(
        (id) => id !== source.cardInstanceId && id !== child.cardInstanceId,
      ),
    },
    { [child.cardInstanceId]: { skillUseAtBoardState: 7 as const } },
  );
  const used = applyUseAbility(state, { ...child, exhausts: true });
  const finished = finishCardActivation(used);
  expect(finished.deck.some((card) => card.cardInstanceId === child.cardInstanceId)).toBe(true);
  expect(liveDeckBoardCardInstanceIds(finished.deckBoard, liveBoardState.proxy)).toContain(
    child.cardInstanceId,
  );
  expect(cardSkillUseState(finished, child.cardInstanceId)).toMatchObject({
    skillUseAtBoardState: 3,
  });
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
    inducePowerParam: 0n,
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
      tokenCardDeck: { ...state.tokenCardDeck, isAllHandSkill: true },
      activation: {
        sourceId: source.cardInstanceId,
        handCardButtonId: liveHandCardButtonId(state, source.cardInstanceId),
        usedCards: [source.cardInstanceId, child.cardInstanceId],
        hasUseAllHandSkill: true,
      },
    },
    {
      hand: liveCurrentHandCardInstanceIds(state).filter(
        (id) => id !== source.cardInstanceId && id !== child.cardInstanceId,
      ),
      deck: boardCardIds(state, liveBoardState.deck).filter((id) => id !== child.cardInstanceId),
    },
  );
  const finished = finishCardActivation(
    enqueueHandShuffle(
      activated,
      { recoverDiscard: false, destination: 'draw' },
      source.cardInstanceId,
    ),
  );
  expect(liveDeckBoardCardInstanceIds(finished.deckBoard, liveBoardState.proxy)).toEqual([
    source.cardInstanceId,
    child.cardInstanceId,
  ]);
  expect(boardCardIds(finished, liveBoardState.deck)).not.toContain(child.cardInstanceId);
  expect(boardCardIds(finished, liveBoardState.graveyard)).not.toContain(source.cardInstanceId);
  expect(boardCardIds(finished, liveBoardState.graveyard)).not.toContain(child.cardInstanceId);
});
