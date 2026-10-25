import { enqueueHandShuffle } from './cards/boardActions';
import { changeResource, setVoltageValue } from './resources';
import { evaluateCondition } from './conditions/evaluate';
import { conditionContext } from './conditions/gameContext';
import { addModeReaction, changeMode } from './effects/modeChange';
import { applyAdditionalBuff } from './effects/additionalBuff';
import { applyScoreBoost } from './effects/scoreBoost';
import { moodValue, sectionAt } from './projection';
import { voltageLevel } from './live/voltageLevel';
import { activateBloom } from './bloom';
import { collectHearts } from './hearts';
import { type Card, type Effect, type GameState } from './model';
import { applyTokenCardEffect, requestTokens } from './cards/tokens';
import { activateTokenBoost } from './effects/tokenBoost';
import { activateSkillCooldown } from './effects/skillCooldown';
import { skillValue } from './effects/skillValue';
import { applySpecialReset } from './effects/specialReset';
import { activateInfinityGauge } from './effects/infinityGauge';
import { applyGaugeRegeneration } from './effects/gaugeRegeneration';
import { applyMentalBarrier } from './effects/mentalBarrier';
import {
  activateAction52SkillBoost,
  applyAction52SkillBoostForCard,
} from './effects/action52SkillBoost';
import { addHeartBoost } from './live/heartBoosts';
import { createHeartsFromEffect } from './effects/heartCreation';
import { resolveEffectParameterDetails } from './parameters/parameterValueChange';
import { applyParameterEffect, isParameterEffect } from './parameters/applyParameterEffect';
import { applyHandLimit } from './effects/handLimit';
import { activateHeartLimitChange, applyHeartLimitEffect } from './effects/heartLimit';
import { forceProxySkillActivation, registerProxySkill } from './effects/proxySkill';
import { applyVoltageTier } from './effects/voltageTier';
import { applyAmplifyEffect } from './effects/amplify';
import { applyApSpeedChange, applyApSpeedPercent } from './effects/apSpeed';
import { activateVoltageConversion } from './effects/voltageConversion';
import { activateMentalHeartInduce } from './effects/mentalHeartInduce';
import { activateComboInduce } from './effects/comboInduce';
import { activateVoltageIncreaseStop } from './effects/stopVoltageIncrease';
import { activateAdditionalHeartInduce } from './effects/additionalHeart';
import { activateInducedSkillEffect } from './effects/induceSkillEffect';
import { activateTokenDeckSplit } from './effects/tokenDeckSplit';
import { startIngameMission } from './ingameMissions';
import { activateBeatHeartValueBuff } from './effects/beatHeartValueBuff';
import { activateMoodChangeSkill } from './effects/moodChangeSkill';
import { activateHeartLimitBoost } from './effects/heartLimitBoost';
import { activateMoodValueBoost } from './effects/moodValueBoost';
import { activateGenesisSkill } from './effects/genesisSkill';
import { activateSpecialAppealToken } from './effects/specialAppealToken';
import { activateHandMaxCard } from './effects/handMaxCard';
import { activateMentalShield } from './effects/mentalShield';
import {
  activateFixedParameterExtend,
  changeFixedParameterBase,
} from './effects/fixedParameterExtend';
export { skillValue } from './effects/skillValue';
export function applyEffect(
  state: GameState,
  effect: Effect,
  card?: Card,
  multiplier = 1,
  addValue = 0,
  effectPower = 1,
): GameState {
  effect = resolveEffectParameterDetails(state, card, effect);
  if (effect.kind === 'proxy-skill-forced-activation')
    return forceProxySkillActivation(state, effect.targetType);
  if (effect.kind === 'proxy-skill') return registerProxySkill(state, effect, card);
  if (effect.kind === 'mood-change-skill')
    return activateMoodChangeSkill(state, effect, card, multiplier, addValue, effectPower);
  if (effect.kind === 'heart-limit-boost')
    return activateHeartLimitBoost(state, effect, multiplier, addValue);
  if (effect.kind === 'mood-value-boost')
    return activateMoodValueBoost(state, effect, card, multiplier, addValue);
  if (effect.kind === 'genesis-skill') return activateGenesisSkill(state, effect, card);
  if (effect.kind === 'special-appeal-token') return activateSpecialAppealToken(state, effect);
  if (effect.kind === 'hand-max-card') return activateHandMaxCard(state, effect);
  if (effect.kind === 'voltage-convert')
    return activateVoltageConversion(state, effect, card, multiplier, addValue);
  if (effect.kind === 'mental-heart-induce')
    return activateMentalHeartInduce(state, effect, card, multiplier, addValue);
  if (effect.kind === 'combo-induce')
    return activateComboInduce(state, effect, card, multiplier, addValue);
  if (effect.kind === 'heart-limit-change')
    return activateHeartLimitChange(state, effect, card, multiplier, addValue, effectPower);
  if (effect.kind === 'additional-heart-induce')
    return activateAdditionalHeartInduce(state, effect, card, multiplier, addValue);
  if (effect.kind === 'induce-skill-effect')
    return activateInducedSkillEffect(state, effect, card, multiplier, addValue);
  if (effect.kind === 'skill-boost') return activateAction52SkillBoost(state, effect);
  if (effect.kind === 'ap-speed')
    return applyApSpeedPercent(state, effect.percent, effect.duration);
  if (effect.kind === 'voltage-tier')
    return applyVoltageTier(state, effect, card, multiplier, addValue, applyEffect, effectPower);
  if (effect.kind === 'ap-speed-change')
    return applyApSpeedChange(state, effect, card, multiplier, addValue);
  if (isParameterEffect(effect))
    return applyParameterEffect(state, effect, card, multiplier, addValue);
  const value = (amount: number) =>
    Math.fround(
      skillValue(state, Math.fround(Math.fround(amount + addValue) * multiplier), effect, card),
    );
  switch (effect.kind) {
    case 'branch': {
      const context = conditionContext(state);
      const resourceBranch =
        effect.condition.kind === 'heat' ||
        effect.condition.kind === 'stamina' ||
        effect.condition.kind === 'mental-at-most' ||
        effect.condition.kind === 'voltage-level-at-most';
      const effects =
        context.bloomActive && resourceBranch
          ? [...effect.whenTrue, ...effect.whenFalse]
          : evaluateCondition(effect.condition, context)
            ? effect.whenTrue
            : effect.whenFalse;
      return effects.reduce(
        (next, child) => applyEffect(next, child, card, multiplier, addValue, effectPower),
        state,
      );
    }
    case 'mode':
      return changeMode(state, effect, applyEffect);
    case 'mode-reaction':
      return addModeReaction(state, effect, card);
    case 'conditional':
      return (
        effect.condition === 'happy100'
          ? moodValue(state) >= 100
          : effect.condition === 'mellow100'
            ? moodValue(state) <= -100
            : effect.condition === 'mental0'
              ? state.bloom !== null || Math.trunc(state.stamina) === 0
              : effect.condition === 'deck80'
                ? state.deck.length >= 80
                : effect.condition === 'first-section'
                  ? sectionAt(state) === state.track.sections[0]
                  : sectionAt(state) === state.track.sections.at(-1)
      )
        ? effect.effects.reduce(
            (next, item) => applyEffect(next, item, card, multiplier, addValue, effectPower),
            state,
          )
        : state;
    case 'mood': {
      const base = Math.fround(value(effect.amount) * effectPower);
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      const amount = Math.ceil(boosted.value);
      return {
        ...boosted.state,
        moodOffset: boosted.state.moodOffset + amount,
      };
    }
    case 'hearts':
      return createHeartsFromEffect(
        state,
        value(effect.amount),
        card,
        false,
        effectPower,
        effect.lifetimeSeconds,
      );
    case 'beat-hearts':
      return createHeartsFromEffect(state, value(effect.amount), card, true);
    case 'tokens':
      return requestTokens(state, effect.token, effect.count, card?.id ?? null, effect.seriesIds);
    case 'token-card':
      return applyTokenCardEffect(state, effect, card?.id ?? null);
    case 'token-boost':
      return activateTokenBoost(state, effect, card, multiplier, addValue);
    case 'token-deck-split':
      return activateTokenDeckSplit(state, effect);
    case 'ingame-mission':
      return startIngameMission(state, effect.groupId);
    case 'hand-limit':
      return applyHandLimit(state, effect, card, multiplier, addValue);
    case 'heart-limit':
      return applyHeartLimitEffect(state, value(effect.amount), card, effectPower);
    case 'shuffle':
      return enqueueHandShuffle(state, effect, card?.id ?? null);
    case 'search-unit':
    case 'search-token':
    case 'search': {
      const target =
        effect.kind === 'search'
          ? effect.target
          : effect.kind === 'search-unit'
            ? { kind: 'unit' as const, unit: effect.unit }
            : { kind: 'token' as const, token: effect.token };
      return {
        ...state,
        deckActions: {
          ...state.deckActions,
          searches: [
            ...state.deckActions.searches,
            ...Array.from({ length: effect.count }, () => ({
              scope: effect.kind === 'search' ? effect.scope : ('skill' as const),
              target,
            })),
          ],
        },
      };
    }
    case 'use-hand':
      throw new Error('一斉使用はカード使用処理で実行してください。');
    case 'card-move': {
      if (
        !card ||
        state.skillUseDestinations[card.id] === 'exclusion' ||
        state.skillUseDestinations[card.id] === 'proxy'
      )
        return state;
      return {
        ...state,
        skillUseDestinations: { ...state.skillUseDestinations, [card.id]: effect.destination },
      };
    }
    case 'energy': {
      const base = Math.fround(value(effect.amount) * effectPower);
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      return changeResource(boosted.state, 'energy', BigInt(Math.trunc(boosted.value)));
    }
    case 'energy-limit':
      return changeFixedParameterBase(state, 'ap', effect.amount);
    case 'reset-special':
      return applySpecialReset(state, effect, card);
    case 'mental-shield':
      return activateMentalShield(state, effect, card, multiplier, addValue, effectPower);
    case 'protect-mental':
      return effect.duration === 'section'
        ? { ...state, sectionMentalProtected: true, resting: false }
        : { ...state, mentalProtected: true, resting: false };
    case 'beat-count': {
      const boosted = applyAction52SkillBoostForCard(state, card, value(effect.amount));
      return {
        ...boosted.state,
        sectionBeatHeartBonus: boosted.state.sectionBeatHeartBonus + Math.trunc(boosted.value),
      };
    }
    case 'beat-heart-value-buff':
      return activateBeatHeartValueBuff(
        state,
        effect,
        card,
        effect.multiplier ?? multiplier,
        effect.addValue ?? addValue,
      );
    case 'heart-boost':
      return addHeartBoost(state, effect, card, multiplier);
    case 'voltage-limit':
      return changeFixedParameterBase(state, 'voltage', effect.amount);
    case 'fixed-parameter-extend':
      return activateFixedParameterExtend(state, effect, card);
    case 'voltage-set':
      return setVoltageValue(state, effect.amount);
    case 'stop-voltage-increase':
      return activateVoltageIncreaseStop(state, effect);
    case 'infinity-gauge':
      return activateInfinityGauge(state, effect);
    case 'gauge-regeneration':
      return applyGaugeRegeneration(
        state,
        effect,
        card,
        multiplier,
        addValue,
        effectPower,
        applyEffect,
      );
    case 'mental-barrier':
      return applyMentalBarrier(
        state,
        effect,
        card,
        multiplier,
        addValue,
        effectPower,
        applyEffect,
      );
    case 'stamina':
    case 'excitement': {
      const base = Math.fround(Math.trunc(value(effect.amount)) * effectPower);
      const boosted = applyAdditionalBuff(state, effect.kind, base, card);
      const action52 = applyAction52SkillBoostForCard(
        boosted.state,
        card,
        Math.trunc(boosted.value),
      );
      return changeResource(
        action52.state,
        effect.kind,
        BigInt(Math.trunc(action52.value)),
        'skill',
        card,
        applyEffect,
      );
    }
    case 'collect':
      return collectHearts(state);
    case 'boost':
      return applyScoreBoost(
        state,
        Math.fround(value(Math.round((effect.multiplier - 1) * 100)) * effectPower),
        card,
      );
    case 'amplify': {
      return applyAmplifyEffect(state, effect);
    }
    case 'skill-cooldown':
      return activateSkillCooldown(state, effect);
    case 'bloom': {
      const base = value(effect.strength);
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      return activateBloom(boosted.state, boosted.value);
    }
    case 'resource-boost': {
      const eligible =
        effect.condition === 'always' ||
        (effect.condition === 'mental100'
          ? state.stamina >= state.maximumMental
          : voltageLevel(state.excitement, state.maximumVoltageLevel) >= 20);
      return eligible
        ? {
            ...state,
            resourceBoosts: [
              ...state.resourceBoosts,
              {
                target: effect.target,
                percent: Math.ceil(value(effect.percent)),
                uses: effect.uses,
                ...(effect.members ? { members: effect.members } : {}),
              },
            ],
          }
        : state;
    }
  }
}
