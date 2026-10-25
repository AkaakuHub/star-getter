import { enqueueHandShuffle } from './cards/boardActions';
import { changeResource } from './resources';
import { evaluateCondition } from './conditions/evaluate';
import { conditionContext } from './conditions/gameContext';
import { energyMaximum } from './parameters/maximum';
import { addModeReaction, changeMode } from './effects/modeChange';
import { applyAdditionalBuff } from './effects/additionalBuff';
import { applyScoreBoost } from './effects/scoreBoost';
import { calculateSkillMoodCorrection } from './live/skillMood';
import { moodValue, sectionAt } from './projection';
import { voltageLevel } from './live/voltageLevel';
import { activateBloom } from './bloom';
import { collectHearts } from './hearts';
import { type Card, type Effect, type GameState } from './model';
import { requestTokens } from './cards/tokens';
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
import { applyParameterEffect } from './parameters/applyParameterEffect';
import { applyHandLimit } from './effects/handLimit';
import { applyHeartLimit } from './effects/heartLimit';
import { forceProxySkillActivation, registerProxySkill } from './effects/proxySkill';
import { applyVoltageTier } from './effects/voltageTier';
import { applyAmplifyEffect } from './effects/amplify';
import { applyApSpeedChange, applyApSpeedPercent } from './effects/apSpeed';
import { activateVoltageConversion } from './effects/voltageConversion';
import { activateMentalHeartInduce } from './effects/mentalHeartInduce';
export { skillValue } from './effects/skillValue';

export function applyEffect(
  state: GameState,
  effect: Effect,
  card?: Card,
  multiplier = 1,
  addValue = 0,
): GameState {
  effect = resolveEffectParameterDetails(state, card, effect);
  if (effect.kind === 'proxy-skill-forced-activation')
    return forceProxySkillActivation(state, effect.targetType);
  if (effect.kind === 'proxy-skill') return registerProxySkill(state, effect, card);
  const value = (amount: number) =>
    Math.fround(
      skillValue(state, Math.fround(Math.fround(amount + addValue) * multiplier), effect, card),
    );
  switch (effect.kind) {
    case 'branch': {
      const context = conditionContext(state);
      const resourceBranch =
        effect.condition.kind === 'heat' || effect.condition.kind === 'stamina';
      const effects =
        context.bloomActive && resourceBranch
          ? [...effect.whenTrue, ...effect.whenFalse]
          : evaluateCondition(effect.condition, context)
            ? effect.whenTrue
            : effect.whenFalse;
      return effects.reduce(
        (next, child) => applyEffect(next, child, card, multiplier, addValue),
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
            (next, item) => applyEffect(next, item, card, multiplier, addValue),
            state,
          )
        : state;
    case 'mood': {
      const base = value(effect.amount);
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      return {
        ...boosted.state,
        moodOffset: boosted.state.moodOffset + Math.ceil(boosted.value),
      };
    }
    case 'hearts':
      return createHeartsFromEffect(state, value(effect.amount), card, false);
    case 'beat-hearts':
      return createHeartsFromEffect(state, value(effect.amount), card, true);
    case 'tokens':
      return requestTokens(state, effect.token, effect.count, card?.id ?? null, effect.seriesIds);
    case 'token-boost': {
      const base = Math.fround(
        (Math.fround(effect.num / 10_000) + (effect.addValue ?? 0) + addValue) * multiplier,
      );
      if (base <= 0) return state;
      const boosted = skillValue(state, base, { kind: 'amplify', percent: base }, card);
      return {
        ...state,
        tokenBoosts: [
          ...state.tokenBoosts,
          {
            calculation: effect.calculation,
            value: boosted,
            target: effect.target,
            ...(effect.seriesIds ? { seriesIds: effect.seriesIds } : {}),
            remainingUses: effect.uses ?? null,
            remainingSeconds:
              effect.duration?.kind === 'milliseconds'
                ? Math.fround(effect.duration.value / 1000)
                : null,
            remainingSections: effect.duration?.kind === 'sections' ? effect.duration.value : null,
          },
        ],
      };
    }
    case 'hand-limit':
      return applyHandLimit(state, effect, card, multiplier, addValue);
    case 'heart-limit': {
      const base = value(effect.amount);
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      return applyHeartLimit(boosted.state, Math.trunc(boosted.value));
    }
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
      const base = value(effect.amount);
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      return changeResource(boosted.state, 'energy', BigInt(Math.trunc(boosted.value)));
    }
    case 'energy-limit':
      return {
        ...state,
        maxEnergy: energyMaximum(state.maxEnergy, [{ calculation: 'add', value: effect.amount }]),
      };
    case 'reset-special':
      return applySpecialReset(state, effect, card);
    case 'mental-shield': {
      const base = value(effect.amount);
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      return {
        ...boosted.state,
        mentalShield: boosted.state.mentalShield + Math.trunc(boosted.value),
      };
    }
    case 'cost-reduction':
    case 'skill-cost-change':
    case 'parameter-value-change':
      return applyParameterEffect(state, effect, card, multiplier);
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
    case 'beat-point-buff': {
      const mood = effect.moodBonus
        ? calculateSkillMoodCorrection(
            effect.moodBonus.target,
            moodValue(state),
            effect.moodBonus.perPoint,
          )
        : 0;
      const amount = Math.trunc(
        Math.fround(
          (Math.fround(effect.amount + mood) + (effect.addValue ?? 0)) *
            (effect.multiplier ?? multiplier),
        ),
      );
      const base = Math.trunc(
        skillValue(state, amount, { kind: 'amplify', percent: amount }, card),
      );
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      return {
        ...boosted.state,
        beatPointBuffs: [
          ...boosted.state.beatPointBuffs,
          {
            value: Math.trunc(boosted.value),
            remainingSections: effect.duration?.sections ?? null,
          },
        ],
      };
    }
    case 'heart-boost':
      return addHeartBoost(state, effect, card, multiplier);
    case 'voltage-limit':
      return { ...state, maximumVoltageLevel: state.maximumVoltageLevel + effect.amount };
    case 'voltage-set':
      return changeResource(
        state,
        'excitement',
        BigInt(Math.trunc(Math.fround(effect.amount)) - Math.trunc(state.excitement)),
      );
    case 'stop-voltage-increase':
      if (effect.duration.value === 0) return state;
      return {
        ...state,
        voltageStops: [
          ...state.voltageStops,
          {
            remainingSeconds:
              effect.duration.kind === 'milliseconds'
                ? Math.fround(effect.duration.value / 1000)
                : null,
            remainingSections: effect.duration.kind === 'sections' ? effect.duration.value : null,
          },
        ],
      };
    case 'infinity-gauge':
      return activateInfinityGauge(state, effect);
    case 'gauge-regeneration':
      return applyGaugeRegeneration(state, effect, card, multiplier);
    case 'mental-barrier':
      return applyMentalBarrier(state, effect, card, multiplier);
    case 'voltage-tier': {
      return applyVoltageTier(state, effect, card, multiplier, addValue, applyEffect);
    }
    case 'ap-speed': {
      return applyApSpeedPercent(state, effect.percent, effect.duration);
    }
    case 'ap-speed-change': {
      return applyApSpeedChange(state, effect, card, multiplier, addValue);
    }
    case 'voltage-convert':
      return activateVoltageConversion(state, effect, card, multiplier, addValue);
    case 'mental-heart-induce':
      return activateMentalHeartInduce(state, effect, card, multiplier, addValue);
    case 'skill-boost':
      return activateAction52SkillBoost(state, effect);
    case 'stamina':
    case 'excitement': {
      const boosted = applyAdditionalBuff(state, effect.kind, value(effect.amount), card);
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
      );
    }
    case 'collect':
      return collectHearts(state);
    case 'boost':
      return applyScoreBoost(state, value(Math.round((effect.multiplier - 1) * 100)), card);
    case 'amplify': {
      return applyAmplifyEffect(state, effect);
    }
    case 'skill-cooldown': {
      const seconds = Math.fround(
        Math.fround(Math.fround(effect.ratio / 10000) * Math.fround(state.track.songTime)) / 10000,
      );
      return {
        ...state,
        skillCooldownSeconds:
          state.skillCooldownSeconds === null
            ? seconds
            : Math.min(state.skillCooldownSeconds, seconds),
      };
    }
    case 'bloom': {
      const base = value(effect.strength);
      const boosted = applyAction52SkillBoostForCard(state, card, base);
      return activateBloom(boosted.state, boosted.value);
    }
    case 'resource-boost': {
      const eligible =
        effect.condition === 'always' ||
        (effect.condition === 'mental100'
          ? state.stamina >= 100
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
