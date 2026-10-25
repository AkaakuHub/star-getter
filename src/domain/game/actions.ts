import { beginTokenGeneration, finishTokenGeneration } from './cards/tokens';
import { applyBeforeUseAbility } from './cards/beforeUse';
import { drainModeChanges } from './effects/modeChange';
import { resolveModeSkill } from './live/modes';
import { collectHearts } from './hearts';
import { type Action, type Card, type Effect, type GameState } from './model';
import { applyEffect } from './effects';
import { spendEnergy } from './resources';
import { canUseCard, cardAt } from './projection';
import { cardCost } from './cards/cost';
import { finishCardActivation } from './cards/cardZones';
import { useSpecial } from './special';
import { applyUseAbility, notifyHandCardBeforeUse, notifyHandSkillUse } from './cards/useAbilities';
import { advanceProxySkillUses } from './effects/proxySkill';
import { deactivateHandLimitEffects } from './effects/handLimit';
import { deactivateHandMaxCardEffects } from './effects/handMaxCard';
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
import { deactivateLoveUpAdditionalBuffs } from './effects/loveUpAdditionalBuff';
import { deactivateMentalRecoverAdditionalBuffs } from './effects/mentalRecoverAdditionalBuff';
import { deactivateMentalBarrierAdditionalBuffs } from './effects/mentalBarrierAdditionalBuff';
import { deactivateDisableMentalDownEffects } from './effects/disableMentalDown';
import { deactivateGaugeInfinities } from './resources';
import { deactivateSkillCooldownEffects } from './effects/skillCooldown';
import { deactivateInducedSkillEffects } from './effects/induceSkillEffect';
import { deactivateTokenDeck, switchTokenDeck } from './effects/tokenDeckSplit';
import { missionActionEffect, registerMissionMember, skipIngameMission } from './ingameMissions';
import { deactivateBeatHeartValueBuffs } from './effects/beatHeartValueBuff';
import { deactivateMoodChangeSkills } from './effects/moodChangeSkill';
import { deactivateHeartLimitAdditionalBuffs } from './effects/heartLimitBoost';
import { deactivateMoodValueAdditionalBuffs } from './effects/moodValueBoost';
import { refreshEffectInducers } from './effects/effectInduce';
import { deactivateBeatPointBuffs } from './effects/beatPointBuff';
import { deactivateGaugeRegenerations } from './live/gaugeRegeneration';
import { deactivateSearchRequests } from './cards/search';
import { deactivateHeartBoosts } from './live/heartBoosts';
import { deactivateSkillCostChanges } from './cards/skillCostChanges';
import type { EffectApplier } from './effects/induceSkillEffect';

export function act(state: GameState, action: Action): GameState {
  return refreshEffectInducers(actInternal(state, action), applyEffect);
}

function actInternal(state: GameState, action: Action): GameState {
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
    case 'switch-token-deck':
      return switchTokenDeck(state);
    case 'deactivate-token-deck':
      return deactivateTokenDeck(state, action.deactivationKey);
    case 'skip-ingame-mission':
      return skipIngameMission(state);
    case 'deactivate-hand-limit': {
      const expired = deactivateHandLimitEffects(state, action.deactivationKey);
      return expired.handAdjustment > 0
        ? restoreHandLimitCount(expired.state, expired.handAdjustment)
        : expired.state;
    }
    case 'deactivate-hand-max-card':
      return deactivateHandMaxCardEffects(state, action.deactivationKey);
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
    case 'deactivate-love-up-additional-buff':
      return deactivateLoveUpAdditionalBuffs(state, action.deactivationKey);
    case 'deactivate-mental-recover-additional-buff':
      return deactivateMentalRecoverAdditionalBuffs(state, action.deactivationKey);
    case 'deactivate-mental-barrier-additional-buff':
      return deactivateMentalBarrierAdditionalBuffs(state, action.deactivationKey);
    case 'deactivate-mental-down':
      return deactivateDisableMentalDownEffects(state, action.deactivationKey);
    case 'deactivate-token-boost':
      return {
        ...state,
        tokenBoosts: state.tokenBoosts.filter(
          (boost) => boost.deactivationKey !== action.deactivationKey,
        ),
      };
    case 'deactivate-infinity-gauge':
      return deactivateGaugeInfinities(state, action.deactivationKey);
    case 'deactivate-skill-cooldown':
      return deactivateSkillCooldownEffects(state, action.deactivationKey);
    case 'deactivate-induced-skill-effect':
      return deactivateInducedSkillEffects(state, action.deactivationKey);
    case 'deactivate-beat-heart-value-buff':
      return deactivateBeatHeartValueBuffs(state, action.deactivationKey);
    case 'deactivate-mood-change-skill':
      return deactivateMoodChangeSkills(state, action.deactivationKey);
    case 'deactivate-heart-limit-boost':
      return deactivateHeartLimitAdditionalBuffs(state, action.deactivationKey);
    case 'deactivate-mood-value-boost':
      return deactivateMoodValueAdditionalBuffs(state, action.deactivationKey);
    case 'deactivate-beat-point-buff':
      return deactivateBeatPointBuffs(state, action.deactivationKey);
    case 'deactivate-gauge-regeneration':
      return deactivateGaugeRegenerations(state, action.deactivationKey);
    case 'deactivate-search':
      return deactivateSearchRequests(state, action.deactivationKey);
    case 'deactivate-heart-boost':
      return deactivateHeartBoosts(state, action.deactivationKey);
    case 'deactivate-voltage-up-additional-buff':
      return {
        ...state,
        voltageUpAdditionalBuffs: state.voltageUpAdditionalBuffs.filter(
          (buff) => buff.deactivationKey !== action.deactivationKey,
        ),
      };
    case 'deactivate-skill-cost-change':
      return deactivateSkillCostChanges(state, action.deactivationKey);
    case 'deactivate-skill-score-up':
      return {
        ...state,
        skillScoreUps: state.skillScoreUps.filter(
          (buff) => buff.deactivationKey !== action.deactivationKey,
        ),
      };
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
      handCardStatsAtUse: {},
      allHand: source.effects.some((effect) => effect.kind === 'use-hand'),
      skipSourceRefill: false,
      recoverDiscard: false,
      returnToDraw: [],
      excluded: [],
      handCountChanges: {},
      pendingHandStatsDeactivationKeys: [],
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
  const previousSkillType = state.currentSkillType;
  const usedSkillCost = cardCost(state, card, allHand);
  const handCardStatsAtUse = { ...state.activation.handCardStatsAtUse };
  const handCardStats = state.handCardStats[card.id];
  if (handCardStats) handCardStatsAtUse[card.id] = handCardStats;
  let next: GameState = {
    ...state,
    currentSkillType: 2,
    onceSkillCostChanges: Object.fromEntries(
      Object.entries(state.onceSkillCostChanges).filter(([id]) => id !== card.id),
    ),
    activation: {
      ...state.activation,
      usedCards: [...state.activation.usedCards, card.id],
      handCardStatsAtUse,
    },
    lastActionTick: state.tick,
    lastPerformer: card.performer,
    lastUsedMember: card.member,
    lastUsedUnit: card.unit,
    lastUsedSkillIcon: card.skillIcon ?? null,
    drawContext: 'skill',
    skillActivationCounts: {
      ...state.skillActivationCounts,
      [card.id]: Number(BigInt.asIntN(32, BigInt((state.skillActivationCounts[card.id] ?? 0) + 1))),
    },
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
        cost: usedSkillCost,
      },
    ],
  };
  next = notifyHandCardBeforeUse(next, card, 2, applyEffect);
  next = beginTokenGeneration(retireCard(applyBeforeUseAbility(next, card), card), card.id);
  next = notifyComboSkillPoint(next, card, usedSkillCost);
  for (const effect of card.effects) {
    if (effect.kind === 'use-hand') continue;
    const beforeEffect = next;
    next = missionActionEffect(applyEffect(next, effect, card), effect, beforeEffect);
  }
  next = finishTokenGeneration(next, card.id);
  next = applyAbilityEffects(next, card, card.ability893Effects ?? [], applyEffect);
  next = applyAbilityEffects(next, card, card.ability894Effects ?? [], applyEffect);
  for (const effect of card.effects) {
    if (effect.kind !== 'use-hand' || allHand) continue;
    next = { ...next, modes: { ...next.modes, held: true } };
    const children = [...next.hand];
    for (const id of children) {
      const child = next.deck.find((item) => item.id === id);
      if (child) next = activateCard(next, resolveModeSkill(child, next.modes), initialHand, true);
    }
    next = drainModeChanges({ ...next, modes: { ...next.modes, held: false } }, applyEffect);
  }
  next = advanceProxySkillUses(applyUseAbility(next, card), card.id, usedSkillCost, applyEffect);
  next = induceAdditionalHearts(next, card, usedSkillCost, applyEffect);
  const completed = registerMissionMember(notifyHandSkillUse(next, card, applyEffect), card.member);
  return { ...completed, currentSkillType: previousSkillType };
}

function applyAbilityEffects(
  state: GameState,
  card: Card,
  effects: readonly Effect[],
  applyEffect: EffectApplier,
): GameState {
  if (effects.length === 0) return state;
  let next = beginTokenGeneration(state, card.id);
  for (const effect of effects) next = applyEffect(next, effect, card);
  return finishTokenGeneration(next, card.id);
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
