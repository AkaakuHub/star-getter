import { beginTokenGeneration, finishTokenGeneration } from './cards/tokens';
import { applyBeforeUseAbility } from './cards/beforeUse';
import { drainModeChanges } from './effects/modeChange';
import { collectHearts } from './hearts';
import { type Action, type Card, type GameState } from './model';
import { applyEffect } from './effects';
import { spendEnergy } from './resources';
import { canUseCard, cardAt } from './projection';
import { cardCost } from './cards/cost';
import { finishCardActivation } from './cards/cardZones';
import { useSpecial } from './special';
import { applyUseAbility, notifyHandSkillUse } from './cards/useAbilities';
import { advanceProxySkillUses } from './effects/proxySkill';
import { deactivateHandLimitEffects } from './effects/handLimit';
import { deactivateApSpeedEffects } from './effects/apSpeed';
import { deactivateVoltageConversions } from './effects/voltageConversion';
import { deactivateAction52SkillBoosts } from './effects/action52SkillBoost';
import { restoreHandLimitCount } from './cards/drawing';
import { deactivateMentalHeartInducers } from './effects/mentalHeartInduce';
import { deactivateComboInducer, notifyComboSkillPoint } from './effects/comboInduce';
import { deactivateHeartLimitBuffs } from './effects/heartLimit';
import { deactivateVoltageIncreaseStops } from './effects/stopVoltageIncrease';
import {
  deactivateAdditionalHeartInducers,
  induceAdditionalHearts,
} from './effects/additionalHeart';

export function act(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return state.phase === 'ready' ? { ...state, phase: 'playing' } : state;
    case 'pause':
      return state.phase === 'playing' ? { ...state, phase: 'paused' } : state;
    case 'resume':
      return state.phase === 'paused' ? { ...state, phase: 'playing' } : state;
    case 'collect':
      return state.phase === 'playing' ? collectHearts(state) : state;
    case 'special':
      return useSpecial(state, action.cardId);
    case 'card':
      return useCard(state, action.index);
    case 'deactivate-hand-limit': {
      const expired = deactivateHandLimitEffects(state, action.deactivationKey);
      return expired.handAdjustment > 0
        ? restoreHandLimitCount(expired.state, expired.handAdjustment)
        : expired.state;
    }
    case 'deactivate-ap-speed':
      return deactivateApSpeedEffects(state, action.deactivationKey);
    case 'deactivate-voltage-convert':
      return deactivateVoltageConversions(state, action.deactivationKey);
    case 'deactivate-skill-boost':
      return deactivateAction52SkillBoosts(state, action.deactivationKey);
    case 'deactivate-mental-heart-induce':
      return deactivateMentalHeartInducers(state, action.deactivationKey);
    case 'deactivate-combo-induce':
      return deactivateComboInducer(state, action.deactivationKey);
    case 'deactivate-heart-limit':
      return deactivateHeartLimitBuffs(state, action.deactivationKey);
    case 'deactivate-voltage-increase':
      return deactivateVoltageIncreaseStops(state, action.deactivationKey);
    case 'deactivate-additional-heart':
      return deactivateAdditionalHeartInducers(state, action.deactivationKey);
  }
}

function useCard(state: GameState, index: number): GameState {
  if (!canUseCard(state, index)) return state;
  const source = cardAt(state, index);
  const paid = spendEnergy(state, cardCost(state, source));
  const activated = {
    ...paid,
    activation: {
      sourceId: source.id,
      usedCards: [],
      allHand: source.effects.some((effect) => effect.kind === 'use-hand'),
      recoverDiscard: false,
      returnToDraw: [],
      excluded: [],
      handCountChanges: {},
    },
  };
  return finishCardActivation(activateCard(activated, source, state.hand, false));
}

function activateCard(
  state: GameState,
  card: Card,
  initialHand: readonly string[],
  allHand: boolean,
): GameState {
  if (!state.activation) throw new Error('カードの使用処理がありません。');
  const usedSkillCost = cardCost(state, card);
  let next: GameState = {
    ...state,
    onceSkillCostChanges: Object.fromEntries(
      Object.entries(state.onceSkillCostChanges).filter(([id]) => id !== card.id),
    ),
    activation: { ...state.activation, usedCards: [...state.activation.usedCards, card.id] },
    lastActionTick: state.tick,
    lastPerformer: card.performer,
    lastUsedMember: card.member,
    lastUsedUnit: card.unit,
    lastUsedSkillIcon: card.skillIcon ?? null,
    drawContext: 'skill',
    cardUseCounts: { ...state.cardUseCounts, [card.id]: (state.cardUseCounts[card.id] ?? 0) + 1 },
    lastCardName: card.name,
    stats: { ...state.stats, cardsUsed: state.stats.cardsUsed + 1 },
    cardUses: [
      ...state.cardUses,
      {
        key: state.stats.cardsUsed + 1,
        card,
        tick: state.tick,
        handIndex: initialHand.indexOf(card.id),
        handCount: initialHand.length,
        cost: cardCost(state, card),
      },
    ],
  };
  next = beginTokenGeneration(retireCard(applyBeforeUseAbility(next, card), card), card.id);
  next = notifyComboSkillPoint(next, card, cardCost(state, card));
  for (const effect of card.effects) {
    if (effect.kind === 'use-hand') {
      if (allHand) continue;
      next = { ...next, modes: { ...next.modes, held: true } };
      const children = [...next.hand];
      for (const id of children) {
        const child = next.deck.find((item) => item.id === id);
        if (child) next = activateCard(next, child, initialHand, true);
      }
      next = drainModeChanges({ ...next, modes: { ...next.modes, held: false } }, applyEffect);
    } else {
      next = applyEffect(next, effect, card);
    }
  }
  next = advanceProxySkillUses(
    applyUseAbility(finishTokenGeneration(next, card.id), card),
    card.id,
    cardCost(state, card),
    applyEffect,
  );
  next = induceAdditionalHearts(next, card, usedSkillCost, applyEffect);
  return notifyHandSkillUse(next, card);
}

function retireCard(state: GameState, card: Card): GameState {
  return {
    ...state,
    hand: state.hand.filter((id) => id !== card.id),
    handCardStats: Object.fromEntries(
      Object.entries(state.handCardStats).filter(([id]) => id !== card.id),
    ),
    drawPile: state.drawPile.filter((id) => id !== card.id),
    discard: state.discard.filter((id) => id !== card.id),
    relayUsed: state.relayUsed.filter((id) => id !== card.id),
    handHeartCollectCounts: Object.fromEntries(
      Object.entries(state.handHeartCollectCounts).filter(([id]) => id !== card.id),
    ),
  };
}
