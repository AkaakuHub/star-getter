import { calculateSkillMoodCorrection } from './live/skillMood';
import { durationSeconds, moodValue, sectionAt } from './projection';
import { voltageLevel, voltageThreshold } from './live/voltageLevel';
import { beatHeartCount } from './beat';
import { activateBloom, changeBloomResource } from './bloom';
import { addHearts, collectHearts } from './hearts';
import { type Card, type Effect, type GameState, rules } from './model';
import { addTokens } from './cards/tokens';
import { fillHand, shuffleHand } from './cards/drawing';
import { changeStarGatherHeartLimit } from './live/heartLimit';
import { applyStarGatherSkillBoost } from './live/skillBoost';

export function changeResource(
  state: GameState,
  resource: 'energy' | 'stamina' | 'excitement',
  amount: bigint,
): GameState {
  if (state.bloom) return changeBloomResource(state, resource, amount);
  const maximum =
    resource === 'energy'
      ? state.maxEnergy
      : resource === 'excitement'
        ? voltageThreshold(state.maximumVoltageLevel)
        : 100;
  return { ...state, [resource]: Math.max(0, Math.min(maximum, state[resource] + Number(amount))) };
}

export function applyEffect(state: GameState, effect: Effect, card?: Card): GameState {
  const value = (amount: number) => skillValue(state, amount, effect, card);
  switch (effect.kind) {
    case 'conditional':
      return (
        effect.condition === 'happy100'
          ? moodValue(state) >= 100
          : effect.condition === 'mellow100'
            ? moodValue(state) <= -100
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
          (state.hand.includes(card.id) && card.passive
            ? skillValue(state, card.passive.heartsPercent ?? 0, {
                kind: 'amplify',
                percent: card.passive.heartsPercent ?? 0,
                ...(card.passive.moodBonus ? { moodBonus: card.passive.moodBonus } : {}),
              })
            : 0),
        100,
      );
      const beats = effect.kind === 'beat-hearts' ? beatHeartCount(state) : 1;
      return addHearts(state, Math.ceil((value(effect.amount) * percent * beats) / 100));
    }
    case 'tokens':
      return addTokens(state, effect.token, effect.count);
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
      return fillHand(shuffleHand(state));
    case 'use-hand':
      throw new Error('一斉使用はカード使用処理で実行してください。');
    case 'energy':
      return changeResource(state, 'energy', BigInt(Math.ceil(value(effect.amount))));
    case 'energy-limit':
      return { ...state, maxEnergy: state.maxEnergy + effect.amount };
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
    case 'set-energy':
      return state.bloom
        ? changeBloomResource(state, 'energy', BigInt(effect.amount - state.energy))
        : { ...state, energy: Math.min(state.maxEnergy, effect.amount) };
    case 'protect-mental':
      return { ...state, mentalProtected: true, resting: false };
    case 'voltage-limit':
      return { ...state, maximumVoltageLevel: state.maximumVoltageLevel + effect.amount };
    case 'voltage-set':
      return changeResource(
        state,
        'excitement',
        BigInt(Math.trunc(Math.fround(effect.amount)) - Math.trunc(state.excitement)),
      );
    case 'voltage-tier': {
      const tier =
        effect.tiers[
          Math.min(5, Math.floor(voltageLevel(state.excitement, state.maximumVoltageLevel) / 200))
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
      const matching = state.resourceBoosts.filter((boost) => boost.target === effect.kind);
      const percent = matching.reduce((sum, boost) => Math.fround(sum + boost.percent), 100);
      const next = changeResource(
        state,
        effect.kind,
        BigInt(Math.ceil(Math.fround((value(effect.amount) * percent) / 100))),
      );
      return {
        ...next,
        resourceBoosts: state.resourceBoosts.flatMap((boost) =>
          boost.target !== effect.kind
            ? [boost]
            : boost.uses > 1
              ? [{ ...boost, uses: boost.uses - 1 }]
              : [],
        ),
      };
    }
    case 'collect':
      return collectHearts(state);
    case 'boost':
      return {
        ...state,
        boosts: [
          ...state.boosts,
          {
            percent: Math.trunc(value(Math.round((effect.multiplier - 1) * 100))),
            untilTick: Math.round(durationSeconds(state) * rules.ticksPerSecond),
          },
        ],
      };
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
              { target: effect.target, percent: value(effect.percent), uses: effect.uses },
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
      : effect.kind === 'bloom' || effect.kind === 'amplify'
        ? raw
        : Math.ceil(raw);
  const handBoost = state.deck.reduce(
    (sum, item) =>
      sum +
      (state.hand.includes(item.id) &&
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
        if (!state.hand.includes(item.id) || !boost?.members.includes(card.member)) return sum;
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
