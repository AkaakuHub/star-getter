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
        handCardStatsAtUse: {},
        allHand: false,
        recoverDiscard: false,
        returnToDraw: [],
        excluded: [],
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
  expect(finished.skillUseDestinations[card.id]).toBeUndefined();
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
  expect(moved.skillUseDestinations[card.id]).toBe('exclusion');
  expect(finishCardActivation(moved).deck.some((item) => item.id === card.id)).toBe(false);
});
