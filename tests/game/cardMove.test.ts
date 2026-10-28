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
    state: {
      ...state,
      hand: state.hand.filter((id) => id !== card.id),
      drawPile: state.drawPile.filter((id) => id !== card.id),
      activation: {
        sourceId: card.id,
        usedCards: [card.id],
        allHand: false,
        recoverDiscard: false,
        handCountChanges: {},
      },
    },
  };
}

it('Action19で使用後に発動元カードを山札へ戻し、指定を消費する', () => {
  const { card, state } = activateSourceCard();
  const moved = applyEffect(state, { kind: 'card-move', destination: 'deck' }, card);
  const finished = finishCardActivation(moved);
  expect(finished.deck.some((item) => item.id === card.id)).toBe(true);
  expect(finished.drawPile).toContain(card.id);
  expect(finished.discard).not.toContain(card.id);
  expect(finished.cardSkillUseStates[card.id]).toEqual({ skillUseAtBoardState: 3 });
});

it('Action19で使用後に発動元カードを除外する', () => {
  const { card, state } = activateSourceCard();
  const moved = applyEffect(state, { kind: 'card-move', destination: 'exclusion' }, card);
  const finished = finishCardActivation(moved);
  expect(finished.deck.some((item) => item.id === card.id)).toBe(false);
  expect(finished.drawPile).not.toContain(card.id);
  expect(finished.discard).not.toContain(card.id);
});

it('Action19は既に除外先へ設定した移動先を山札へ上書きしない', () => {
  const { card, state } = activateSourceCard();
  const excluded = applyEffect(state, { kind: 'card-move', destination: 'exclusion' }, card);
  const moved = applyEffect(excluded, { kind: 'card-move', destination: 'deck' }, card);
  expect(moved.cardSkillUseStates[card.id]).toEqual({ skillUseAtBoardState: 4 });
  expect(finishCardActivation(moved).deck.some((item) => item.id === card.id)).toBe(false);
});

it('全手札使用の子の除外特性は既存のProxy移動先を上書きしない', () => {
  const initial = game();
  const source = initial.deck[0];
  const child = initial.deck[1];
  if (!source || !child) throw new Error('検証用カードが足りません。');
  const state = {
    ...initial,
    hand: initial.hand.filter((id) => id !== source.id && id !== child.id),
    drawPile: initial.drawPile.filter((id) => id !== source.id && id !== child.id),
    cardSkillUseStates: {
      ...initial.cardSkillUseStates,
      [child.id]: { skillUseAtBoardState: 7 as const },
    },
    activation: {
      sourceId: source.id,
      usedCards: [source.id, child.id],
      allHand: true,
      recoverDiscard: false,
      handCountChanges: {},
    },
  };
  const used = applyUseAbility(state, { ...child, exhausts: true });
  const finished = finishCardActivation(used);
  expect(finished.deck.some((card) => card.id === child.id)).toBe(true);
  expect(finished.proxyCards).toContain(child.id);
  expect(finished.cardSkillUseStates[child.id]).toEqual({ skillUseAtBoardState: 3 });
});
