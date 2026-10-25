import { enqueueHandShuffle } from './cards/boardActions';
import { changeResource } from './resources';
import { evaluateCondition } from './conditions/evaluate';
import { conditionContext } from './conditions/gameContext';
import { energyMaximum } from './parameters/maximum';
import { addModeReaction, changeMode } from './effects/modeChange';
import { applyAdditionalBuff } from './effects/additionalBuff';
import { calculateSkillMoodCorrection } from './live/skillMood';
import { durationSeconds, moodValue, sectionAt } from './projection';
import { voltageLevel } from './live/voltageLevel';
import { beatHeartCount } from './beat';
import { activateBloom } from './bloom';
import { addHearts, collectHearts } from './hearts';
import { type Card, type Effect, type GameState, rules } from './model';
import { applyCostReduction } from './cards/cost';
import { requestTokens } from './cards/tokens';

import { changeStarGatherHeartLimit } from './live/heartLimit';
import { applyStarGatherSkillBoost } from './live/skillBoost';

export function applyEffect(
  state: GameState,
  effect: Effect,
  card?: Card,
  multiplier = 1,
): GameState {
  const value = (amount: number) =>
    Math.fround(skillValue(state, amount, effect, card) * multiplier);
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
      return effects.reduce((next, child) => applyEffect(next, child, card), state);
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
        ? effect.effects.reduce((next, item) => applyEffect(next, item, card), state)
        : state;
    case 'mood':
      return { ...state, moodOffset: state.moodOffset + Math.ceil(value(effect.amount)) };
    case 'hearts':
    case 'beat-hearts': {
      const percent = state.deck.reduce(
        (sum, card) =>
          sum +
          (state.handEffectCardIds.includes(card.id) && card.passive
            ? skillValue(state, card.passive.heartsPercent ?? 0, {
                kind: 'amplify',
                percent: card.passive.heartsPercent ?? 0,
                ...(card.passive.moodBonus ? { moodBonus: card.passive.moodBonus } : {}),
              })
            : 0),
        100,
      );
      const beats = effect.kind === 'beat-hearts' ? beatHeartCount(state) : 1;
      const base = Math.ceil((value(effect.amount) * percent * beats) / 100);
      const extra = state.heartBoosts.reduce((sum, boost) => Math.fround(sum + boost.percent), 0);
      return addHearts(
        {
          ...state,
          heartBoosts: state.heartBoosts.flatMap((boost) =>
            boost.uses > 1 ? [{ ...boost, uses: boost.uses - 1 }] : [],
          ),
        },
        Math.ceil(Math.fround(base + (base * extra) / 100)),
      );
    }
    case 'tokens':
      return requestTokens(state, effect.token, effect.count, card?.id ?? null);
    case 'hand-limit':
      return { ...state, handLimit: state.handLimit + effect.amount };
    case 'heart-limit':
      return {
        ...state,
        hearts: changeStarGatherHeartLimit(
          state.hearts,
          Math.min(10_000_000, state.hearts.heartLimit + Math.ceil(value(effect.amount))),
        ).state,
      };
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
    case 'energy':
      return changeResource(state, 'energy', BigInt(Math.trunc(value(effect.amount))));
    case 'energy-limit':
      return {
        ...state,
        maxEnergy: energyMaximum(state.maxEnergy, [{ calculation: 'add', value: effect.amount }]),
      };
    case 'reset-special':
      return {
        ...state,
        specialUsed: state.specialUsed.filter((id) => {
          const source = state.deck.find((item) => item.id === id);
          return (
            (effect.normalOnly && source?.special?.extra) ||
            (effect.unit !== undefined && source?.unit !== effect.unit)
          );
        }),
      };
    case 'mental-shield':
      return { ...state, mentalShield: state.mentalShield + Math.ceil(value(effect.amount)) };
    case 'cost-reduction':
      return applyCostReduction(state, effect);
    case 'protect-mental':
      return effect.duration === 'section'
        ? { ...state, sectionMentalProtected: true, resting: false }
        : { ...state, mentalProtected: true, resting: false };
    case 'beat-count':
      return { ...state, sectionBeatHeartBonus: state.sectionBeatHeartBonus + effect.amount };
    case 'heart-boost':
      return {
        ...state,
        heartBoosts: [
          ...state.heartBoosts,
          { percent: Math.ceil(value(effect.percent)), uses: effect.uses },
        ],
      };
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
                ? Math.fround(Math.fround(effect.duration.value) / 1000)
                : null,
            remainingSections: effect.duration.kind === 'sections' ? effect.duration.value : null,
          },
        ],
      };
    case 'voltage-tier': {
      if (state.bloom)
        return effect.tiers.reduceRight(
          (next, tier) => tier.reduce((current, child) => applyEffect(current, child, card), next),
          state,
        );
      const tier =
        effect.tiers[
          Math.min(
            effect.tiers.length - 1,
            Math.floor(voltageLevel(state.excitement, state.maximumVoltageLevel) / effect.step),
          )
        ];
      if (!tier) throw new Error('熱気の段階に対応する効果がありません。');
      return tier.reduce((next, child) => applyEffect(next, child, card), state);
    }
    case 'ap-speed': {
      const field = effect.duration === 'stage' ? 'apStageIntervalFactor' : 'apIntervalFactor';
      return {
        ...state,
        [field]: Math.fround(state[field] - Math.fround(value(effect.percent) / 100)),
      };
    }
    case 'stamina':
    case 'excitement': {
      const boosted = applyAdditionalBuff(state, effect.kind, value(effect.amount), card);
      return changeResource(boosted.state, effect.kind, BigInt(Math.ceil(boosted.value)));
    }
    case 'collect':
      return collectHearts(state);
    case 'boost': {
      const boosted = applyAdditionalBuff(
        state,
        'attract',
        value(Math.round((effect.multiplier - 1) * 100)),
        card,
      );
      return {
        ...boosted.state,
        boosts: [
          ...state.boosts,
          {
            percent: Math.trunc(boosted.value),
            untilTick: Math.round(durationSeconds(state) * rules.ticksPerSecond),
          },
        ],
      };
    }
    case 'amplify': {
      const percent =
        effect.percent +
        (effect.moodBonus
          ? calculateSkillMoodCorrection(
              effect.moodBonus.target,
              moodValue(state),
              effect.moodBonus.perPoint,
            )
          : 0);
      if (effect.members)
        return {
          ...state,
          targetBoosts: [
            ...state.targetBoosts,
            { members: effect.members, percent, duration: effect.duration ?? 'stage' },
          ],
        };
      return {
        ...state,
        amplification: Math.fround(state.amplification + percent),
        sectionAmplification:
          state.sectionAmplification + (effect.duration === 'section' ? percent : 0),
      };
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
    case 'bloom':
      return activateBloom(state, value(effect.strength));
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

export function skillValue(state: GameState, value: number, effect: Effect, card?: Card): number {
  const bonus =
    'moodBonus' in effect && effect.moodBonus
      ? calculateSkillMoodCorrection(
          effect.moodBonus.target,
          moodValue(state),
          effect.moodBonus.perPoint,
        )
      : 0;
  const raw = Math.fround(value + bonus);
  const base =
    effect.kind === 'boost'
      ? Math.trunc(raw)
      : effect.kind === 'bloom' || effect.kind === 'amplify' || effect.kind === 'energy'
        ? raw
        : Math.ceil(raw);
  const handBoost = state.deck.reduce(
    (sum, item) =>
      sum +
      (state.handEffectCardIds.includes(item.id) &&
      (item.token === 'bookmark' || item.token === 'story') &&
      state.deck.length >= 80
        ? Math.fround(1001 + Math.max(0, moodValue(state)) * 5.005)
        : 0),
    0,
  );
  const story = card?.token === 'story' ? state.storyAmplification + handBoost : 0;
  const targeted = card
    ? state.targetBoosts.reduce(
        (sum, boost) => sum + (boost.members.includes(card.member) ? boost.percent : 0),
        0,
      )
    : 0;
  const passive = card
    ? state.deck.reduce((sum, item) => {
        const boost = item.passive?.skillBoost;
        if (!state.handEffectCardIds.includes(item.id) || !boost?.members.includes(card.member))
          return sum;
        const mood = boost.moodBonus
          ? calculateSkillMoodCorrection(
              boost.moodBonus.target,
              moodValue(state),
              boost.moodBonus.perPoint,
            )
          : 0;
        return sum + boost.percent + mood;
      }, 0)
    : 0;
  return applyStarGatherSkillBoost(base, state.amplification - 100 + story + targeted + passive);
}
